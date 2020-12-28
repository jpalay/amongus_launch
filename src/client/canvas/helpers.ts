export type Coordinate = { x: number; y: number; };
export type Dimensions = { width: number; height: number; };

export function getContext(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (context == null) {
        throw Error('null context');
    }

    return context
}

export function getCorners(topLeft: Coordinate, size: Dimensions) {
    return [
        {x: topLeft.x, y: topLeft.y }, // top-left
        {x: topLeft.x + size.width, y: topLeft.y }, // top-right
        {x: topLeft.x + size.width, y: topLeft.y + size.height }, // bottom-right
        {x: topLeft.x, y: topLeft.y + size.height } // bottom-left
    ]
}

export function rectangleContainsPoint(topLeft: Coordinate, size: Dimensions, point: Coordinate) {
    return point.x > topLeft.x
        && point.x < topLeft.x + size.height
        && point.y > topLeft.y
        && point.y < topLeft.y + size.height;
}
