import * as Scene from './Scene';
import * as Helpers from './helpers';
import * as ServerInterfaces from '../../ServerInterfaces';

export type State = {
    position: Helpers.Coordinate;
    facingLeft: boolean;
    walkingTicks: number;
}

export class Player implements Scene.Sprite {
    socket: SocketIOClient.Socket;
    descriptor: ServerInterfaces.PlayerDescriptor;
    state: State;
    zIndex: number;

    objectType: 'sprite' = 'sprite';
    size: Helpers.Dimensions = { width: 20, height: 25 };

    constructor(socket: SocketIOClient.Socket, descriptor: ServerInterfaces.PlayerDescriptor, zIndex: number) {
        this.zIndex = zIndex;
        this.socket = socket;
        this.descriptor = descriptor;
        this.state = descriptor.initialState;
    }

    private _getImage() {
        const imageNumber = Math.floor(this.state.walkingTicks / 5) % 4;
        return (document.getElementById(`red${imageNumber}`) as HTMLImageElement);
    }

    center(): Helpers.Coordinate {
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
        const center = this.center();
        const textX = center.x;
        const textY = center.y + this.size.height / 2 + 12;
        context.fillText(this.descriptor.name, textX, textY, 90);
        context.restore()
    }

    updateState(scene: Scene.Scene) {
		throw Error('not yet implemented');
    }

    toDescriptor(): ServerInterfaces.PlayerDescriptor {
        return this.descriptor;
    }
}
