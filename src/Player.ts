import * as Scene from "./Scene.js";
import * as Helpers from "./helpers.js";

export type PlayerState = {
    position: Helpers.Coordinate;
    facingLeft: boolean;
}

export class Player implements Scene.Sprite {
    objectType: "sprite";
    image: HTMLImageElement;
    size: Helpers.Dimensions;
    state: PlayerState;

    constructor(canvas: HTMLCanvasElement) {
        this.objectType = "sprite";
        this.image = <HTMLImageElement>document.getElementById("red0");
        this.size = { width: 40, height: 50 };

        this.state = {
            position: {
                x: canvas.offsetWidth / 2 - this.size.width / 2,
                y: canvas.offsetHeight / 2 - this.size.height / 2
            },
            facingLeft: false
        };
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
            this.image,
            this.state.facingLeft
                ? canvasWidth - this.state.position.x - this.size.width
                : this.state.position.x,
            this.state.position.y,
            this.size.width,
            this.size.height
        );

        context.restore();
    }

    updateState(scene: Scene.Scene) {
		throw Error("not yet implemented");
    }
}
