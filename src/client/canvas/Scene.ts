import * as Helpers from './helpers';
import { Player } from './Player';
import { OtherPlayer } from './OtherPlayer';
import { CurrentPlayer } from './CurrentPlayer';
import * as ServerInterfaces from '../../ServerInterfaces';
import { FuelingStation } from "./FuelingStation";

export interface WorldObject {
    objectType: 'sprite' | 'static';
    zIndex?: number | undefined;
    render(canvas: HTMLCanvasElement): void;
}

export interface StaticObject extends WorldObject {
    objectType: 'static'
    blocksPoint: (testPoint: Helpers.Coordinate) => boolean;
}

export interface Sprite extends WorldObject {
    objectType: 'sprite'
    updateState(scene: Scene): void;
    render(canvas: HTMLCanvasElement): void;
}

export type State = {
    ticks: number;
    keyboard: {
        space: boolean;
    },
    mouse: {
        x: number;
        y: number;
        pressed: boolean;
    }
};

export class Scene {
    socket: SocketIOClient.Socket;
    staticObjects: StaticObject[];
    sprites: Sprite[];
    state: State;
    currentPlayerName: string | null;
    onAddPlayer: (gamePhase: ServerInterfaces.GamePhase) => void;

    constructor({
        socket,
        staticObjects,
        onAddPlayer,
    }: {
        socket: SocketIOClient.Socket,
        staticObjects: StaticObject[],
        onAddPlayer: (gamePhase: ServerInterfaces.GamePhase) => void
    }) {
        this.socket = socket;
        this.sprites = [];
        this.staticObjects = staticObjects;
        this.currentPlayerName = null;
        this.onAddPlayer = onAddPlayer;
        this.state = {
            ticks: 0,
            keyboard: {
                space: false
            },
            mouse: {
                x: 0,
                y: 0,
                pressed: false
            }
        };

        this.socket.on('event', (message: ServerInterfaces.ServerResponse) => {
            if (message.eventName === 'register_user') {
                this._addNewPlayers(message);
            }
        });
    }

    private _addNewPlayers = (message: ServerInterfaces.RegisterUserResponse) => {
        const newPlayersAndStations = message.allPlayers.filter(
            playerAndStation => this.sprites.findIndex(
                sprite => (sprite instanceof Player) && sprite.descriptor.name === playerAndStation.descriptor.name
            ) === -1
        );

        const newPlayers = newPlayersAndStations.map(playerAndStation =>
            this.currentPlayerName !== null && this.currentPlayerName === playerAndStation.descriptor.name
                ? new CurrentPlayer(this.socket, playerAndStation.descriptor, 2)
                : new OtherPlayer(this.socket, playerAndStation.descriptor, 1)
        );

        const newFuelingStations = newPlayersAndStations.map(playerAndStation =>
            new FuelingStation(this.socket, playerAndStation.fuelingStation, 0)
        );

        this.sprites = this.sprites.concat(newPlayers).concat(newFuelingStations);

        if (newPlayersAndStations.length > 0) {
            this.onAddPlayer(message.room.gamePhase);
        }
    }

    private _renderScene(canvas: HTMLCanvasElement) {
        const context = Helpers.getContext(canvas);

        context.clearRect(0, 0, canvas.width, canvas.height);

        const allWorldObjectsByZIndex = [...this.staticObjects, ...this.sprites].sort((worldObject1, worldObject2) => {
            if (worldObject1.zIndex === worldObject2.zIndex) {
                return 0;
            }
            // Put undefined at the top
            else if (worldObject1.zIndex === undefined) {
                return -1;
            }
            else if (worldObject2.zIndex === undefined) {
                return 1;
            }
            else {
                return worldObject1.zIndex - worldObject2.zIndex;
            }
        });

        allWorldObjectsByZIndex.forEach(worldObject => worldObject.render(canvas));
    }

    private _updateState() {
        this.state.ticks += 1;
        this.sprites.forEach(sprite => { sprite.updateState(this) });
    }

    currentPlayer() {
        // Filter uses a typeguard, so this is safe
        const currentPlayer = this.sprites.filter(sprite => (sprite instanceof CurrentPlayer))[0] as CurrentPlayer | undefined;
        return currentPlayer !== undefined ? currentPlayer : null;
    }

    run(canvas: HTMLCanvasElement) {
        // add keyboard listeners
        document.addEventListener('keydown', event => {
            if (event.keyCode === 32) {
                this.state.keyboard.space = true;
            }
        });

        document.addEventListener('keyup', event => {
            if (event.keyCode === 32) {
                this.state.keyboard.space = false;
            }
        });

        // add mouse listeners
        document.addEventListener('mousemove', event => {
            this.state.mouse.x = event.clientX - canvas.getBoundingClientRect().left;
            this.state.mouse.y = event.clientY - canvas.getBoundingClientRect().top;
        });

        document.addEventListener('mousedown', event => {
            this.state.mouse.pressed = true;
        });

        document.addEventListener('mouseup', event => {
            this.state.mouse.pressed = false;
        });

        return window.setInterval(
            () => {
                this._updateState();
                this._renderScene(canvas);
            },
            33
        )
    }
}
