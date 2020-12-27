import React from "react";
import * as ServerInterfaces from "../ServerInterfaces";
import * as Game from "./Game";

export type State = {
    gamePhase: "join_game" | "join_game_pending" | "lobby" | "run_game";
    userName: string,
    roomName: string,
    players: ServerInterfaces.PlayerDescriptor[];
}

export type Props = {
    socket: SocketIOClient.Socket
};

export class Component extends React.Component<Props, State> {
    displayName = "GameStateManager";
    private userNameInputRef = React.createRef<HTMLInputElement>();
    private roomNameInputRef = React.createRef<HTMLInputElement>();

    constructor(props: Props) {
        super(props);
        this.state = {
            gamePhase: "join_game",
            userName: "",
            roomName: "",
            players: []
        };
    }

    componentDidMount() {
        this.props.socket.on("event", (message: ServerInterfaces.ServerResponse) => {
            console.log("got a message!");
            console.log(message);
            switch (message.eventName) {
                case "register_user":
                    this._handleRegisterUserResponse(message)
                    break;
            }

            switch (message.eventName) {
                case "start_game":
                    this._handleStartGameResponse(message)
                    break;
            }
        });
    }

    _handleRegisterUserResponse(message: ServerInterfaces.RegisterUserResponse) {
        if (["join_game", "join_game_pending", "lobby"].includes(this.state.gamePhase)) {
            this.setState({
                gamePhase: message.gamePhase,
                players: message.allPlayers
            })
        }
    }

    _handleStartGameResponse(message: ServerInterfaces.StartGameResponse) {
        this.setState({
            gamePhase: "run_game",
            players: message.allPlayers
        })
    }

    _registerUser() {
        const userName = this.userNameInputRef.current!.value;
        const roomName = this.roomNameInputRef.current!.value;

        const message: ServerInterfaces.RegisterUserParams = {
            eventName: "register_user",
            roomName,
            color: "red",
            userName,
        };
        this.props.socket.emit("event", message);
        this.setState({
            gamePhase: "join_game_pending",
            userName,
            roomName
        });
    }

    render() {
        console.log("GAME PHASE:", this.state.gamePhase) // why doesn't this fail to compile?
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

    private _currentPlayer() {
        console.log(this.state.players);
        return this.state.players.filter(player => player.name === this.state.userName)[0];
    }

    private _renderGame() {
        const currentPlayer = this._currentPlayer();
        const otherPlayers = this.state.players.filter(player => player.id !== currentPlayer.id);

        return Game.create({
            socket: this.props.socket,
            currentPlayer,
            otherPlayers
        });
    }

    private _renderLobby() {
        const players = this.state.players.map(player => (<li key={ player.id }>{ player.name }</li>));
        const startGameButton = this._currentPlayer().isAdmin
            ? (<button onClick={() => this._startGame()}>start game</button>)
            : null;
        

        return (
            <div>
                <ul>
                    { players }
                </ul>
                { startGameButton }
            </div>
        );
    }

    private _startGame() {
        console.log("starting game");
        this.props.socket.emit("event", {
            eventName: "start_game",
            roomName: this.state.roomName
        })
    }

    private _renderForm() {
        return (
            <div>
                <input type="text" ref={this.userNameInputRef} placeholder="username"/>
                <input type="text" ref={this.roomNameInputRef} placeholder="roomName"/>
                <button type="button" onClick={() => this._registerUser()}>join game</button>
            </div>
        );
    }

    private _renderJoinGamePending() {
        return (
            <span>Joining game...</span>
        )
    }
}

export const create = (props: Props) => React.createElement(Component, props);
