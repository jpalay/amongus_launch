import * as Scene from "./Scene"
import * as ServerInterfaces from "../../ServerInterfaces"
import * as Helpers from "./helpers"

export type State = { }

export class LaunchSequence implements Scene.Sprite {
    objectType = "sprite" as const;

    state: State = { };
    zIndex: number;

    constructor(zIndex: number) {
        this.zIndex = zIndex;
    }

    render(canvas: HTMLCanvasElement) {
        const context = Helpers.getContext(canvas);

        const textPosition: Helpers.Coordinate = {
            x: (ServerInterfaces.CANVAS_SIZE.width) / 2,
            y: (ServerInterfaces.CANVAS_SIZE.height) / 2,
        }

        context.save();

        context.beginPath();
        context.font = "150px sans-serif";
        context.textAlign = "center";
        context.fillStyle = "blue";

        context.fillText("Launching in 15", textPosition.x, textPosition.y)

        context.restore();
    }

    updateState(scene: Scene.Scene) { }

    // private _drawRoundedRectangle(context: CanvasRenderingContext2D, position: Helpers.Coordinate, size: Helpers.Dimensions, borderRadius: number) {
    //     var rightEdge = position.x + w;
    //     var bottomEdge = position.y + h;
    //     context.beginPath();
    //     context.strokeStyle="green";
    //     context.lineWidth="4";
    //     context.moveTo(position.x + borderRadius, position.y);
    //     context.lineTo(rightEdge - borderRadius, position.y);
    //     context.quadraticCurveTo(rightEdge, position.y, rightEdge, position.y + borderRadius);
    //     context.lineTo(rightEdge, position.y + h - borderRadius);
    //     context.quadraticCurveTo(rightEdge, bottomEdge, rightEdge-borderRadius, bottomEdge);
    //     context.lineTo(position.x+borderRadius, bottomEdge);
    //     context.quadraticCurveTo(position.x, bottomEdge, position.x, bottomEdge-borderRadius);
    //     context.lineTo(position.x, position.y+borderRadius);
    //     context.quadraticCurveTo(position.x, position.y, position.x+borderRadius, position.y);
    //     context.stroke();
    // }
}
