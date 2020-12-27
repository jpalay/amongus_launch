import * as Scene from "./Scene";
import * as Helpers from "./helpers";
import { PlayerDescriptor } from "../ServerInterfaces";

export type PlayerState = {
    position: Helpers.Coordinate;
    facingLeft: boolean;
    walkingTicks: number;
}


export class Player implements Scene.Sprite {
    objectType: "sprite";
    socket: SocketIOClient.Socket;
    name: string;
    id: string;
    isAdmin: boolean;
    size: Helpers.Dimensions;
    state: PlayerState;

    constructor(socket: SocketIOClient.Socket, player: PlayerDescriptor) {
        this.name = player.name;
        this.socket = socket;
        this.id = player.id;
        this.state = player.initialState;
        this.isAdmin = player.isAdmin;

        this.objectType = "sprite";
        this.size = { width: 40, height: 50 };
    }

    private _getImage() {
        const imageNumber = Math.floor(this.state.walkingTicks / 5) % 4;
        return (document.getElementById(`red${imageNumber}`) as HTMLImageElement);
    }

    _center(): Helpers.Coordinate {
        return {
            x: this.state.position.x + this.size.width / 2,
            y: this.state.position.y + this.size.height / 2
        }
    }

    render(canvas: HTMLCanvasElement) {
        const context = Helpers.getContext(canvas);
        const canvasWidth = canvas.offsetWidth

        context.save();

        if (this.state.facingLeft) {
            context.translate(canvas.offsetWidth, 0);
            context.scale(-1, 1);
        }

        context.drawImage(
            this._getImage(),
            this.state.facingLeft
                ? canvasWidth - this.state.position.x - this.size.width
                : this.state.position.x,
            this.state.position.y,
            this.size.width,
            this.size.height
        );

        context.restore();

        context.save();
        context.font = '10px sans-serif';
        context.textAlign = 'center';
        const center = this._center();
        const textX = center.x;
        const textY = center.y + this.size.height / 2 + 12;
        context.fillText(this.name, textX, textY, 90);
        context.restore()
    }

    updateState(scene: Scene.Scene) {
		throw Error("not yet implemented");
    }
}
