import * as Helpers from "./helpers";
import * as Scene from "./Scene"

export class OctogonalWall implements Scene.StaticObject {
    objectType: "solid";
    octogonSize: number;
    offset: { offsetX: number, offsetY: number };

    constructor(octogonSize: number, canvasSize: Helpers.Dimensions) {
        this.objectType = "solid";
        this.octogonSize = octogonSize
        this.offset = {
            offsetX: (canvasSize.width - octogonSize) / 2,
            offsetY: (canvasSize.height - octogonSize) / 2,
        }
    }

    render(canvas: HTMLCanvasElement) {
        this._renderWithContext(Helpers.getContext(canvas));
    };

    blocksPoint(testPoint: Helpers.Coordinate) {
        const testCanvas = document.createElement('canvas');
        const context = Helpers.getContext(testCanvas);
        this._renderWithContext(context);
        return context.isPointInStroke(testPoint.x, testPoint.y);
    }
    
    private _coordinates() {
        const sideLength = Math.sqrt(2) * this.octogonSize / (Math.sqrt(2) + 2);
        const cornerLength = sideLength / Math.sqrt(2);

        const last = <T>(elts: T[]): T => elts.slice(-1)[0];
        
        const topLeft = { x: this.offset.offsetX, y: this.offset.offsetY }

        const coordinates: Helpers.Coordinate[]  = [ { x: topLeft.x, y: topLeft.y + cornerLength } ];
        coordinates.push({
            x: last(coordinates).x + cornerLength,
            y: last(coordinates).y - cornerLength
        });

        coordinates.push({
            x: last(coordinates).x + sideLength,
            y: last(coordinates).y
        });

        coordinates.push({
            x: last(coordinates).x + cornerLength,
            y: last(coordinates).y + cornerLength
        });

        coordinates.push({
            x: last(coordinates).x,
            y: last(coordinates).y + sideLength
        });

        coordinates.push({
            x: last(coordinates).x - cornerLength,
            y: last(coordinates).y + cornerLength
        });

        coordinates.push({
            x: last(coordinates).x - sideLength,
            y: last(coordinates).y
        });

        coordinates.push({
            x: last(coordinates).x - cornerLength,
            y: last(coordinates).y - cornerLength
        });

        return coordinates;
    }

    private _renderWithContext(context: CanvasRenderingContext2D) {
        const coordinates = this._coordinates();
        context.beginPath();
        context.moveTo(coordinates[0].x, coordinates[0].y);
        for (var i = 1; i < coordinates.length; i++) {
            context.lineTo(coordinates[i].x, coordinates[i].y);
        }

        context.closePath()
        context.lineWidth = 6;
        context.strokeStyle = 'blue';
        context.stroke();
    }
}
