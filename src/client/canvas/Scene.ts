import * as Helpers from "./helpers";
import { Player } from "./Player";
import { OtherPlayer } from "./OtherPlayer";
import { CurrentPlayer } from "./CurrentPlayer";
import * as ServerInterfaces from "../../ServerInterfaces";
import { FuelingStation } from "./FuelingStation";

export interface WorldObject {
    objectType: "sprite" | "static";
    zIndex?: number | undefined;
    render(canvas: HTMLCanvasElement): void;
}

export interface StaticObject extends WorldObject {
    objectType: "static"
    blocksPoint: (testPoint: Helpers.Coordinate) => boolean;
}

export interface Sprite extends WorldObject {
    objectType: "sprite"
    updateState(scene: Scene): void;
}

export type State = {
    ticks: number;
    keyboard: {
        space: boolean;
        f: boolean;
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
    debugMode: boolean;

    constructor({
        socket,
        staticObjects,
        debugMode,
    }: {
        socket: SocketIOClient.Socket,
        staticObjects: StaticObject[],
        debugMode: boolean,
    }) {
        this.socket = socket;
        this.sprites = [];
        this.staticObjects = staticObjects;
        this.currentPlayerName = null;
        this.debugMode = debugMode;

        this.state = {
            ticks: 0,
            keyboard: {
                space: false,
                f: false
            },
            mouse: {
                x: 0,
                y: 0,
                pressed: false
            }
        };

    }

     addNewPlayers = (allPlayers: ServerInterfaces.PlayerDescriptor[], fuelingStations: ServerInterfaces.FuelingStationDescriptor[]) => {
        const newPlayerDescriptors = allPlayers.filter(
            playerDescriptor => this.sprites.findIndex(
                sprite => (sprite instanceof Player) && sprite.descriptor.name === playerDescriptor.name
            ) === -1
        );

        const newPlayers = newPlayerDescriptors.map(playerDescriptor =>
            this.currentPlayerName !== null && this.currentPlayerName === playerDescriptor.name
                ? new CurrentPlayer(this.socket, playerDescriptor, 2)
                : new OtherPlayer(this.socket, playerDescriptor, 1)
        );

        const newFuelingStations = fuelingStations.filter(fuelingStationDescriptor =>
            newPlayerDescriptors.some(playerDescriptor => playerDescriptor.id === fuelingStationDescriptor.playerId)
        ).map(fuelingStationDescriptor =>
            new FuelingStation(this.socket, fuelingStationDescriptor, 0)
        );

        this.sprites = this.sprites.concat(newPlayers).concat(newFuelingStations);
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

    addSprite(sprite: Sprite) {
        this.sprites.push(sprite);
    }

    removeSprite(sprite: Sprite) {
        const index = this.sprites.findIndex(obj => obj === sprite);
        if (index !== -1) {
            this.sprites.splice(index, 1);
        }
    }

    run(canvas: HTMLCanvasElement) {
        // add keyboard listeners
        document.addEventListener("keydown", event => {
            if (event.key === " ") {
                event.preventDefault();
                this.state.keyboard.space = true;
            }
        });

        document.addEventListener("keyup", event => {
            if (event.key === " ") {
                event.preventDefault();
                this.state.keyboard.space = false;
            }
        });

        document.addEventListener("keydown", event => {
            if (event.key === "f") {
                event.preventDefault();
                this.state.keyboard.f = true;
            }
        });

        document.addEventListener("keyup", event => {
            if (event.key === "f") {
                event.preventDefault();
                this.state.keyboard.f = false;
            }
        });

        // add mouse listeners
        document.addEventListener("mousemove", event => {
            this.state.mouse.x = event.clientX - canvas.getBoundingClientRect().left;
            this.state.mouse.y = event.clientY - canvas.getBoundingClientRect().top;
        });

        document.addEventListener("mousedown", () => {
            this.state.mouse.pressed = true;
        });

        document.addEventListener("mouseup", () => {
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
