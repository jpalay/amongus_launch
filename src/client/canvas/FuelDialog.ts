import * as Scene from "./Scene"
import * as ServerInterfaces from "../../ServerInterfaces"
import * as Helpers from "./helpers"

export type State = {
    percentFull: number;
    fuelButtonPressed: boolean;
    ticksSinceCreation: number;
}

export class FuelDialog implements Scene.Sprite {
    objectType = "sprite" as const;
    dialogSize: Helpers.Dimensions = { width: 500, height: 800 };
    fuelMeterSize: Helpers.Dimensions = { width: 15, height: 400 };
    zIndex: number;
    onClose: () => void;
    onFullyFueled: () => void;

    state: State = {
        percentFull: 0,
        fuelButtonPressed: false,
        ticksSinceCreation: 0
    };

    constructor({
        socket, initialPercentFull, zIndex, onClose, onFullyFueled
        }: {
        socket: SocketIOClient.Socket,
        initialPercentFull: number,
        zIndex: number,
        onClose: () => void,
        onFullyFueled: () => void
    }) {
        this.zIndex = zIndex;
        this.onClose = onClose;
        this.onFullyFueled = onFullyFueled;
        this.state.percentFull = initialPercentFull;
    }

    render(canvas: HTMLCanvasElement) {
        const context = Helpers.getContext(canvas);

        const newOrigin: Helpers.Coordinate = {
            x: (ServerInterfaces.CANVAS_SIZE.width - this.dialogSize.width) / 2,
            y: (ServerInterfaces.CANVAS_SIZE.height - this.dialogSize.height) / 2,
        }

        // set coordinates relative to top-left of dialog
        context.save();
        context.translate(newOrigin.x, newOrigin.y);

        this._drawDialogBackground(context);
        this._drawTitle(context);
        this._drawInstructions(context);
        this._drawFuelMeter(context);
        this._maybeDrawSuccessText(context);

        context.restore();
    }

    updateState(scene: Scene.Scene) {
        this.state.ticksSinceCreation++;

        if (scene.state.mouse.pressed) {
            scene.removeSprite(this);
            this.onClose();
            return;
        }


        if (this.state.percentFull < 100 && !this.state.fuelButtonPressed && scene.state.keyboard.f) {
            this.state.percentFull = Math.min(100, this.state.percentFull + 5);
            if (this.state.percentFull === 100) {
                this.onFullyFueled();
            }
            this.state.fuelButtonPressed = true;
        }
        else if (this.state.percentFull < 100) {
            this.state.percentFull = Math.max(0, this.state.percentFull - .5);
        }

        if (!scene.state.keyboard.f) {
            this.state.fuelButtonPressed = false;
        }
    }

    private _drawTitle(context: CanvasRenderingContext2D) {
        context.beginPath();
        const fontSize = 12;
        context.font = `${fontSize}px sans-serif`;
        context.textAlign = "left";
        context.fillStyle = "black"
        context.fillText("fueling station", 10, 4 + fontSize);

        context.beginPath();
        context.font = `${fontSize}px sans-serif`;
        context.textAlign = "right";
        context.fillStyle = "black"
        context.fillText("x", this.dialogSize.width - 2, fontSize);

        context.beginPath();
        context.moveTo(0, fontSize + 9);
        context.lineTo(this.dialogSize.width, fontSize + 9);
        context.strokeStyle = "black";
        context.lineWidth = 1;
        context.stroke();
    }

    private _drawInstructions(context: CanvasRenderingContext2D) {
        context.beginPath();
        const fontSize = 15;
        context.font = `${fontSize}px sans-serif`;
        context.textAlign = "center";
        context.fillStyle = "white"
        const instructionText = this.state.ticksSinceCreation < 150
            ? "press f to fuel"
            : "press f (rapidly) to fuel";

        context.fillText(instructionText, this.dialogSize.width / 2, 80 + fontSize);
    }

    private _drawDialogBackground(context: CanvasRenderingContext2D) {
        context.beginPath();
        context.rect(
            0,
            0,
            this.dialogSize.width,
            this.dialogSize.height
        );
        context.fillStyle = "grey";
        context.fill();
    }

    private _drawFuelMeter(context: CanvasRenderingContext2D) {
        const fuelMeterPosition: Helpers.Coordinate = {
            x: (this.dialogSize.width - this.fuelMeterSize.width) / 2,
            y: (this.dialogSize.height - this.fuelMeterSize.height) / 2,
        }

        // draw background
        context.beginPath()
        context.rect(
            fuelMeterPosition.x,
            fuelMeterPosition.y,
            this.fuelMeterSize.width,
            this.fuelMeterSize.height
        );
        context.fillStyle = "lightgrey"
        context.fill()

        // draw fuel level
        const fuelHeight = this.fuelMeterSize.height * this.state.percentFull / 100;
        context.beginPath();
        context.rect(
            fuelMeterPosition.x,
            fuelMeterPosition.y + (this.fuelMeterSize.height - fuelHeight),
            this.fuelMeterSize.width,
            fuelHeight
        );
        context.fillStyle = "green"
        context.fill();
    }

    private _maybeDrawSuccessText(context: CanvasRenderingContext2D) {
        if (this.state.percentFull < 100) {
            return;
        }

        // set up text styling
        context.beginPath();
        const fontSize = 42;
        context.font = `${fontSize}px sans-serif`;
        context.textAlign = "left";
        context.fillStyle = "white"

        // calculate position of text and image
        const successText = "good job";
        const originalUpthumbSize = { width: 162, height: 154 }
        const upthumbSize = {
            width: originalUpthumbSize.width * 36 / originalUpthumbSize.height,
            height: 36
        }

        const textWidth = context.measureText(successText).width;
        const spaceBetween = 15;
        const totalWidth = textWidth + spaceBetween + upthumbSize.width;
        const textLeft = (this.dialogSize.width - totalWidth) / 2;
        const pictureLeft = textLeft + textWidth + spaceBetween;
        const bottomPadding = 90;

        // draw text and image
        context.fillText(successText, textLeft, this.dialogSize.height - bottomPadding);
        context.drawImage(
            document.getElementById("upthumb") as HTMLImageElement,
            pictureLeft,
            this.dialogSize.height - bottomPadding - upthumbSize.height + 3,
            upthumbSize.width,
            upthumbSize.height
        );
    }

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
