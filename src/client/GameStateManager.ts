// import React from "react";
import * as ServerInterfaces from "../ServerInterfaces";
import * as OctogonalWall from "./OctogonalWall"
import m from "mithril";
import * as Scene from "./Scene"
// import * as Game from "./Game";
//
export type State = {
    gamePhase: "join_game" | "join_game_pending" | "lobby" | "run_game";
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
            solidObjects: [
                new OctogonalWall.OctogonalWall(
                    800,
                    { width: 900, height: 900 }
                )
            ],
            addPlayerCallback: () => { this._refreshPlayerList() }
        })

        this._initializeSockets()
    }

    private _initializeSockets() {
        this.socket.on("event", (message: ServerInterfaces.ServerResponse) => {
            console.log("got a message!");
            console.log(message);

            // TODO: client should tell server what state to transition to in order to accomodate joining mid-game
            switch (message.eventName) {
                case "start_game":
                    this._handleStartGameResponse(message)
                    break;
            }
        });
    }


    /****************************
     *  RENDERING
     ***************************/

    view() {
        console.log("I'm in a phase!", this.state.gamePhase);
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
        const startGameButton = this._currentPlayer().isAdmin
            ? m("button", { onclick: () => this._startGame() }, "start game")
            : null;

        return m("div", [
            m("ul", this.state.playerNames.map(playerName => m("li", playerName))),
            startGameButton
        ])
    }

    private _renderGame() {
        return m("canvas#GameCanvas", {
            width: 900,
            height: 900
        });
    }

    /****************************
     * EVENT HANDLERS
     ***************************/

    _registerUser() {
        const userName = this.state.userName;
        const roomName = this.state.roomName;
        this.scene.currentPlayerName = userName;

        const message: ServerInterfaces.RegisterUserParams = {
            eventName: "register_user",
            roomName,
            color: "red",
            userName,
        };
        this.socket.emit("event", message);
        this._setState({ gamePhase: "join_game_pending" });
    }

    private _startGame() {
        this.socket.emit("event", {
            eventName: "start_game",
            roomName: this.state.roomName
        })
    }

    /****************************
     * SOCKET CALLBACKS
     ***************************/

    _handleStartGameResponse(message: ServerInterfaces.StartGameResponse) {
        if (this.state.gamePhase === "lobby") {
            this._setState({ gamePhase: "run_game" });
        }
    }


    /****************************
     * OTHER CALLBACKS & HELPERS
     ***************************/

    private _refreshPlayerList() {
        this.state.playerNames = this.scene.players.map(player => player.name);
        
        if (this.state.gamePhase === "join_game_pending") {
            this._setState({ gamePhase: "lobby" });
            console.log("i guess im in lobby now");
            m.redraw();
        }
        
        if (this.state.gamePhase === "lobby") {
            m.redraw();
        }
    }


    _setState(newState: Partial<State>) {
        this.state = {
            ...this.state,
            ...newState
        };
    }

    private _currentPlayer() {
        return this.scene.players.filter(player => player.name === this.state.userName)[0];
    }

    onupdate() {
        const canvas: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById("GameCanvas");
        if (canvas != null && this.gameLoopInterval === null) {
            this.gameLoopInterval = this.scene.run(canvas);
        }
    }
















    // private _renderForm() {
    //     return (
    //         <div>
    //             <input type="text" ref={this.userNameInputRef} placeholder="username"/>
    //             <input type="text" ref={this.roomNameInputRef} placeholder="roomName"/>
    //             <button type="button" onClick={() => this._registerUser()}>join game</button>
    //         </div>
    //     );
    // }
}

//
//
// export class Component extends React.Component<Props, State> {
//     displayName = "GameStateManager";
//     private userNameInputRef = React.createRef<HTMLInputElement>();
//     private roomNameInputRef = React.createRef<HTMLInputElement>();
//
//     constructor(props: Props) {
//         super(props);
//         this.state = {
//             gamePhase: "join_game",
//             userName: "",
//             roomName: "",
//             players: []
//         };
//     }
//
//     componentDidMount() {
//         this.props.socket.on("event", (message: ServerInterfaces.ServerResponse) => {
//             console.log("got a message!");
//             console.log(message);
//             switch (message.eventName) {
//                 case "register_user":
//                     this._handleRegisterUserResponse(message)
//                     break;
//             }
//
//             switch (message.eventName) {
//                 case "start_game":
//                     this._handleStartGameResponse(message)
//                     break;
//             }
//         });
//     }
//
//     _handleRegisterUserResponse(message: ServerInterfaces.RegisterUserResponse) {
//         if (["join_game", "join_game_pending", "lobby"].includes(this.state.gamePhase)) {
//             this.setState({
//                 gamePhase: message.gamePhase,
//                 players: message.allPlayers
//             })
//         }
//     }
//
//     _handleStartGameResponse(message: ServerInterfaces.StartGameResponse) {
//         this.setState({
//             gamePhase: "run_game",
//             players: message.allPlayers
//         })
//     }
//
//     _registerUser() {
//         const userName = this.userNameInputRef.current!.value;
//         const roomName = this.roomNameInputRef.current!.value;
//
//         const message: ServerInterfaces.RegisterUserParams = {
//             eventName: "register_user",
//             roomName,
//             color: "red",
//             userName,
//         };
//         this.props.socket.emit("event", message);
//         this.setState({
//             gamePhase: "join_game_pending",
//             userName,
//             roomName
//         });
//     }
//
//     render() {
//         console.log("GAME PHASE:", this.state.gamePhase) // why doesn't this fail to compile?
//         switch (this.state.gamePhase) {
//             case "join_game":
//                 return this._renderForm();
//             case "join_game_pending":
//                 return this._renderJoinGamePending();
//             case "lobby":
//                 return this._renderLobby();
//             case "run_game":
//                 return this._renderGame();
//             default:
//                 return null;
//         }
//     }
//
//     private _currentPlayer() {
//         console.log(this.state.players);
//         return this.state.players.filter(player => player.name === this.state.userName)[0];
//     }
//
//     private _renderGame() {
//         const currentPlayer = this._currentPlayer();
//         const otherPlayers = this.state.players.filter(player => player.id !== currentPlayer.id);
//
//         return Game.create({
//             socket: this.props.socket,
//             currentPlayer,
//             otherPlayers
//         });
//     }
//
//     private _renderLobby() {
//         const players = this.state.players.map(player => (<li key={ player.id }>{ player.name }</li>));
//         const startGameButton = this._currentPlayer().isAdmin
//             ? (<button onClick={() => this._startGame()}>start game</button>)
//             : null;
//         
//
//         return (
//             <div>
//                 <ul>
//                     { players }
//                 </ul>
//                 { startGameButton }
//             </div>
//         );
//     }
//
//     private _startGame() {
//         console.log("starting game");
//         this.props.socket.emit("event", {
//             eventName: "start_game",
//             roomName: this.state.roomName
//         })
//     }
//
//     private _renderForm() {
//         return (
//             <div>
//                 <input type="text" ref={this.userNameInputRef} placeholder="username"/>
//                 <input type="text" ref={this.roomNameInputRef} placeholder="roomName"/>
//                 <button type="button" onClick={() => this._registerUser()}>join game</button>
//             </div>
//         );
//     }
//
//     private _renderJoinGamePending() {
//         return (
//             <span>Joining game...</span>
//         )
//     }
// }
//
// export const create = (props: Props) => React.createElement(Component, props);
