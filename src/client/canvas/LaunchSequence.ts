import * as Scene from "./Scene"
import * as ServerInterfaces from "../../ServerInterfaces"
import * as Helpers from "./helpers"

export type State = { ttl: number; megaparty: boolean, megapartyTicks: 0 }

export class LaunchSequence implements Scene.Sprite {
    objectType = "sprite" as const;

    state: State = {
        ttl: 15,
        megaparty: false,
        megapartyTicks: 0
    };
    zIndex: number;

    constructor(zIndex: number) {
        this.zIndex = zIndex;
        const interval = window.setInterval(
            () => {
                if (this.state.ttl > 0) {
                    this.state.ttl -= 1;
                } else {
                    window.clearInterval(interval);
                    this.state.megaparty = true;
                }
            },
            1000
        )
    }

    render(canvas: HTMLCanvasElement) {
        const context = Helpers.getContext(canvas);
        if (!this.state.megaparty) {
            this.renderText(context)
        }
        else {
            this.renderMegaparty(canvas, context);
        }
    }

    renderMegaparty(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
        const image = document.getElementById("megaparty") as HTMLImageElement;
        const minHeight = 400;
        const maxHeight = 800;
        const heightPeriod = 60;
        const timeIntoPeriod = this.state.megapartyTicks % heightPeriod;
        const height = timeIntoPeriod < heightPeriod / 2
            ? timeIntoPeriod * (maxHeight - minHeight) / (heightPeriod / 2) + minHeight
            : (heightPeriod - timeIntoPeriod) * (maxHeight - minHeight) / (heightPeriod / 2) + minHeight
        const width = image.width / image.height * height;

        const x = (canvas.offsetWidth - width) / 2;
        const y = (canvas.offsetHeight - height) / 2;

        context.drawImage(image, x, y, width, height);
    }

    renderText(context: CanvasRenderingContext2D) {
        const textPosition: Helpers.Coordinate = {
            x: (ServerInterfaces.CANVAS_SIZE.width) / 2,
            y: (ServerInterfaces.CANVAS_SIZE.height) / 2,
        }

        context.save();

        context.beginPath();
        context.font = "120px sans-serif";
        context.textAlign = "center";
        context.fillStyle = "blue";

        context.fillText(`Launching in ${this.state.ttl}`, textPosition.x, textPosition.y)

        context.restore();

    }

    updateState(scene: Scene.Scene) {
        if (this.state.megaparty) {
            this.state.megapartyTicks ++;
        }
    }
}
