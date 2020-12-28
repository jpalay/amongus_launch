import m from 'mithril';

import * as ServerInterfaces from '../ServerInterfaces';
import * as Scene from './canvas/Scene'
import * as Player from './canvas/Player'
import * as OctogonalWall from './canvas/OctogonalWall'

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
        gamePhase: 'join_game',
        userName: '',
        roomName: '',
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
                    { width: 900, height: 900 }
                )
            ],
            onAddPlayer: (gamePhase) => { this._refreshPlayerList(gamePhase) }
        })

        this._initializeSockets()
    }

    private _initializeSockets() {
        this.socket.on('event', (message: ServerInterfaces.ServerResponse) => {
            // TODO: client should tell server what state to transition to in order to accomodate joining mid-game
            switch (message.eventName) {
                case 'start_game':
                    this._handleStartGameResponse(message)
                    break;
            }
        });
    }

    /****************************
     *  RENDERING
     ***************************/

    view() {
        switch (this.state.gamePhase) {
            case 'join_game':
                return this._renderForm();
            case 'join_game_pending':
                return this._renderJoinGamePending();
            case 'lobby':
                return this._renderLobby();
            case 'run_game':
                return this._renderGame();
            default:
                return null;
        }
    }

    private _renderForm() {
        return m('div', [
            m('input', {
                type: 'text',
                placeholder: 'username',
                oninput: (e: InputEvent) => { this.state.userName = (<HTMLInputElement>e.target)!.value }
            }),
            m('input', {
                type: 'text',
                placeholder: 'room name',
                oninput: (e: InputEvent) => { this.state.roomName = (<HTMLInputElement>e.target)!.value }
            }),
            m('button', {
                onclick: () => this._registerUser()
            }, 'join game')

        ]);
    }

    private _renderJoinGamePending() {
        return m('span', 'waiting for server response...');
    }

    private _renderLobby() {
        const startGameButton = this.scene.currentPlayer()?.descriptor.isAdmin
            ? m('button', { onclick: () => this._startGame() }, 'start game')
            : null;

        return m('div', [
            m('ul', this.state.playerNames.map(playerName => m('li', playerName))),
            startGameButton
        ])
    }

    private _renderGame() {
        return m('canvas#GameCanvas', {
            width: 900,
            height: 900
        });
    }

    onupdate() {
        const canvas: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById('GameCanvas');
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
            eventName: 'register_user',
            roomName,
            color: 'red',
            userName,
        };
        this.state.gamePhase = 'join_game_pending';
        this.socket.emit('event', message);
    }

    private _startGame() {
        this.socket.emit('event', {
            eventName: 'start_game',
            roomName: this.state.roomName
        })
    }

    /****************************
     * SOCKET CALLBACKS
     ***************************/

    _handleStartGameResponse(message: ServerInterfaces.StartGameResponse) {
        if (this.state.gamePhase === 'lobby') {
            this.state.gamePhase = 'run_game';
            m.redraw()
        }
    }


    /****************************
     * OTHER CALLBACKS & HELPERS
     ***************************/

    private _refreshPlayerList(gamePhase: ServerInterfaces.GamePhase) {
        this.state.playerNames = this.scene.sprites
            .filter(sprite => sprite instanceof Player.Player)
            // filter uses a typeguard, so this is safe
            .map(player => (<Player.Player>player).descriptor.name);

        if (this.state.gamePhase === 'join_game_pending') {
            this.state.gamePhase = gamePhase;
            m.redraw();
        }
        
        if (this.state.gamePhase === 'lobby') {
            m.redraw();
        }
    }
}
