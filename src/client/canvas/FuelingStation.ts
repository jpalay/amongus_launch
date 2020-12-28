import * as Scene from './Scene'
import * as ServerInterfaces from '../../ServerInterfaces'
import * as Helpers from './helpers'

export type State = {
    canBeActivated: boolean;
}

export class FuelingStation implements Scene.Sprite {
    objectType = 'sprite' as const;
    size: Helpers.Dimensions = { width: 22, height: 50 };

    descriptor: ServerInterfaces.FuelingStationDescriptor;
    zIndex: number;
    state: State = { canBeActivated: false };

    constructor(socket: SocketIOClient.Socket, descriptor: ServerInterfaces.FuelingStationDescriptor, zIndex: number) {
        this.descriptor = descriptor;
        this.zIndex = zIndex;
    }

    render(canvas: HTMLCanvasElement) {
        const context = Helpers.getContext(canvas);
        context.save();
        context.drawImage(
            FuelingStation._getImage(),
            this.descriptor.position.x,
            this.descriptor.position.y,
            this.size.width,
            this.size.height
        );

        if (this.state.canBeActivated) {
            context.beginPath();
            context.rect(
                this.descriptor.position.x - 5,
                this.descriptor.position.y - 5,
                this.size.width + 10,
                this.size.height + 10
            );
            context.strokeStyle = 'red';
            context.lineWidth = 2;
            context.stroke();
        }

        context.restore();
    }

    updateState(scene: Scene.Scene) {
        const currentPlayer = scene.currentPlayer();

        // Should only activate for the current player
        if (currentPlayer === null || currentPlayer.descriptor.id !== this.descriptor.playerId) {
            return;
        }

        const stationCorners = Helpers.getCorners(this.descriptor.position, this.size);
        const playerCorners = Helpers.getCorners(currentPlayer.state.position, currentPlayer.size);

        const stationContainsPlayerCorner = playerCorners.some(
            corner => Helpers.rectangleContainsPoint(this.descriptor.position, this.size, corner)
        );

        const playerContainsStationCorner = stationCorners.some(
            corner => Helpers.rectangleContainsPoint(currentPlayer.state.position, currentPlayer.size, corner)
        );

        this.state.canBeActivated = stationContainsPlayerCorner || playerContainsStationCorner;
    }

    private static _getImage() {
        return (document.getElementById('fuel_pump') as HTMLImageElement);
    }
}
