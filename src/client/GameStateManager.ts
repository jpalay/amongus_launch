import m from "mithril";

import * as ServerInterfaces from "../ServerInterfaces";
import * as Scene from "./canvas/Scene"
import * as LaunchSequence from "./canvas/LaunchSequence"
import * as OctogonalWall from "./canvas/OctogonalWall"

export type State = {
    gamePhase: ServerInterfaces.GamePhase;
    invalidUserName: boolean;
    userName: string,
    selectedColor: ServerInterfaces.Color;
    playerNames: string[];
}

export type Props = {
    socket: SocketIOClient.Socket
};

export class GameStateManager {
    socket: SocketIOClient.Socket;

    scene: Scene.Scene; 

    state: State = {
        gamePhase: "join_game",
        invalidUserName: false,
        userName: "",
        selectedColor: "teal",
        playerNames: []
    };

    gameLoopInterval: number | null = null;

    /****************************
     *  INITIALIZATION
     ***************************/

    constructor(props: Props) {
        this.socket = props.socket;
        this.scene = new Scene.Scene({
            socket: props.socket,
            staticObjects: [
                new OctogonalWall.OctogonalWall(
                    800,
                    ServerInterfaces.CANVAS_SIZE
                )
            ],
            debugMode: this._debugMode(),
        })

        this._initializeSockets()
    }

    private _initializeSockets() {
        this.socket.on("event", (message: ServerInterfaces.ServerResponse) => {
            switch (message.eventName) {
                case "start_game":
                    this._startGame();
                    break;

                case "register_user":
                    this._addNewPlayers(message);
                    break;

                case "ready_to_launch":
                    this._initiateLaunchSequence();
                    break;
            }
        });
    }

    /****************************
     *  RENDERING
     ***************************/

    view() {
        switch (this.state.gamePhase) {
            case "join_game":
                return this._renderForm(false);
            case "join_game_pending":
                return this._renderForm(true);
            case "lobby":
                return this._renderLobby();
            case "run_game":
                return this._renderGame();
            default:
                return null;
        }
    }

    private _renderForm(buttonDisabled: boolean) {
        return m("div.GameForm", [
            // complains bc class is defined in selector as well as class attribute,
            // but mithril does support this
            m("input.TextInput" as any, {
                type: "text",
                placeholder: "username",
                class: this.state.invalidUserName ? "TextInput--error" : null,
                oninput: (e: InputEvent) => { this.state.userName = (<HTMLInputElement>e.target)!.value }
            }),
            m(
                "div.ColorSelector",
                ServerInterfaces.Colors.map(this._renderColorBlock)
            ),
            m("button.JoinGameButton", {
                onclick: () => this._registerUser(),
                disabled: buttonDisabled,
            }, buttonDisabled ? "waiting for server" : "get started"),
        ])
    }

    private _renderColorBlock = (color: ServerInterfaces.Color) => {
        const children: string[] = this.state.selectedColor === color ? ["x"] : [];
        return m(`div.ColorBlock.ColorBlock--${color}`, {
            onclick: () => { this.state.selectedColor = color; }
        }, children);
    }

    private _renderJoinGamePending() {
        return m("span", "waiting for server response...");
    }

    private _renderLobby() {
        const startGameButton = this.scene.currentPlayer()?.descriptor.isAdmin
            ? m("button", { onclick: () => this._emitStartGame() }, "start game")
            : null;

        return m("div.Lobby", [
            m("h3", "Team members:"),
            m("ul", this.state.playerNames.map(playerName => m("li.PlayerName", playerName))),
            this._renderInstructions(),
            startGameButton,
        ])
    }

    private _renderInstructions() {
        return m("div.Instructions", {style: "text-align: center"}, [
            m("h3", "Instructions:"),
            m("ul", [
                m("li.Instruction", "1. Click and hold to move"),
                m("li.Instruction", "2. Find your task, and press space to interact"),
                m("li.Instruction", "3. When all tasks are complete, Nested Portfolios will launch!")
            ])
        ]);
    }

    private _renderGame() {
        return m("div", [
            m("canvas#GameCanvas", ServerInterfaces.CANVAS_SIZE),
            this._renderInstructions()
        ]);
    }

    onupdate() {
        const canvas: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById("GameCanvas");
        if (canvas != null && this.gameLoopInterval === null) {
            this.gameLoopInterval = this.scene.run(canvas);
        }
    }

    private _debugMode() {
        return new URLSearchParams(window.location.search)
            .get("debugMode") !== null;
    }

    /****************************
     * EVENT HANDLERS
     ***************************/

    private _registerUser() {
        const userName = this.state.userName;
        if (userName === "") {
            this.state.invalidUserName = true;
            return;
        } else {
            this.state.invalidUserName = false;
        }
        const color = this.state.selectedColor;
        this.scene.currentPlayerName = userName;

        const message: ServerInterfaces.RegisterUserParams = {
            eventName: "register_user",
            roomName: this._roomName(),
            color,
            userName,
        };
        this.state.gamePhase = "join_game_pending";
        this.socket.emit("event", message);
    }

    private _emitStartGame() {
        this.socket.emit("event", {
            eventName: "start_game",
            roomName: this._roomName()
        })
    }

    private _roomName() {
        const roomName = new URLSearchParams(window.location.search).get("groupName");
        return roomName === null ? "LAUNCH" : roomName;
    }

    /****************************
     * SOCKET CALLBACKS
     ***************************/

    _startGame() {
        if (this.state.gamePhase === "lobby") {
            this.state.gamePhase = "run_game";
            m.redraw()
        }
    }

    _addNewPlayers(message: ServerInterfaces.RegisterUserResponse) {
        this.scene.addNewPlayers(
            message.allPlayers.map(playerAndStation => playerAndStation.descriptor),
            message.allPlayers.map(playerAndStation => playerAndStation.fuelingStation)
        );

        this.state.playerNames = message.allPlayers.map(playerAndStation => playerAndStation.descriptor.name);

        // in case we're joining in the middle of a game
        this.state.gamePhase = message.gamePhase;
        m.redraw();
    }

    _initiateLaunchSequence() {
        this.scene.addSprite(new LaunchSequence.LaunchSequence(1000, this._debugMode()));
    }
}
