import * as Scene from "./Scene";
import * as Helpers from "./helpers";
import * as ServerInterfaces from "../../ServerInterfaces";

export type State = {
    position: Helpers.Coordinate;
    facingLeft: boolean;
    walkingTicks: number;
}

export class Player implements Scene.Sprite {
    objectType: "sprite";
    socket: SocketIOClient.Socket;
    name: string;
    id: string;
    color: ServerInterfaces.Color;
    isAdmin: boolean;
    room: ServerInterfaces.Room;
    size: Helpers.Dimensions;
    state: State;

    constructor(socket: SocketIOClient.Socket, player: ServerInterfaces.PlayerDescriptor) {
        this.id = player.id;
        this.name = player.name;
        this.state = player.initialState;
        this.room = player.room;
        this.color = player.color;
        this.isAdmin = player.isAdmin;

        this.socket = socket;

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

    toDescriptor(): ServerInterfaces.PlayerDescriptor {
        return {
            name: this.name,
            id: this.id,
            isAdmin: this.isAdmin,
            color: this.color,
            room: this.room,
            initialState: this.state,
        }
    }
}
