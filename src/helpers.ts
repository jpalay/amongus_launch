export type Coordinate = { x: number; y: number; };
export type Dimensions = { width: number; height: number; };

export function getContext(canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");
    if (context == null) {
        throw Error("null context");
    }

    return context
}
