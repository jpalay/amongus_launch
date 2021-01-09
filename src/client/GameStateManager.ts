import m from "mithril";

import * as ServerInterfaces from "../ServerInterfaces";
import * as Scene from "./canvas/Scene"
import * as LaunchSequence from "./canvas/LaunchSequence"
import * as OctogonalWall from "./canvas/OctogonalWall"

export type State = {
    gamePhase: ServerInterfaces.GamePhase;
    userName: string,
    roomName: string,
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
        userName: "",
        roomName: "",
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
            ]
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
                return this._renderForm();
            case "join_game_pending":
                return this._renderJoinGamePending();
            case "lobby":
                return this._renderLobby();
            case "run_game":
                return this._renderGame();
            default:
                return null;
        }
    }

    private _renderForm() {
        return m("div", [
            m("input", {
                type: "text",
                placeholder: "username",
                oninput: (e: InputEvent) => { this.state.userName = (<HTMLInputElement>e.target)!.value }
            }),
            m("input", {
                type: "text",
                placeholder: "room name",
                oninput: (e: InputEvent) => { this.state.roomName = (<HTMLInputElement>e.target)!.value }
            }),
            m("button", {
                onclick: () => this._registerUser()
            }, "join game")

        ]);
    }

    private _renderJoinGamePending() {
        return m("span", "waiting for server response...");
    }

    private _renderLobby() {
        const startGameButton = this.scene.currentPlayer()?.descriptor.isAdmin
            ? m("button", { onclick: () => this._emitStartGame() }, "start game")
            : null;

        return m("div", [
            m("ul", this.state.playerNames.map(playerName => m("li", playerName))),
            startGameButton
        ])
    }

    private _renderGame() {
        return m("canvas#GameCanvas", ServerInterfaces.CANVAS_SIZE);
    }

    onupdate() {
        const canvas: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById("GameCanvas");
        if (canvas != null && this.gameLoopInterval === null) {
            this.gameLoopInterval = this.scene.run(canvas);
        }
    }

    /****************************
     * EVENT HANDLERS
     ***************************/

    private _registerUser() {
        const userName = this.state.userName;
        const roomName = this.state.roomName;
        this.scene.currentPlayerName = userName;

        const message: ServerInterfaces.RegisterUserParams = {
            eventName: "register_user",
            roomName,
            color: "red",
            userName,
        };
        this.state.gamePhase = "join_game_pending";
        this.socket.emit("event", message);
    }

    private _emitStartGame() {
        this.socket.emit("event", {
            eventName: "start_game",
            roomName: this.state.roomName
        })
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
        this.scene.addSprite(new LaunchSequence.LaunchSequence(1000));
    }
}
