const main = () => {
    const canvas = <HTMLCanvasElement> document.getElementById("myCanvas");

    const scene = new Scene(
        canvas,
        new Player(canvas),
        [],
        [
            new OctogonalWall(
                800,
                { width: canvas.offsetWidth, height: canvas.offsetHeight }
            )
        ]
    );
    scene.run()
}

type SceneState = {
    ticks: number;
    keyboard: {
        space: boolean;
    },
    mouse: {
        x: number;
        y: number;
        pressed: boolean;
    }
};

type Coordinate = { x: number; y: number; };
type Dimensions = { width: number; height: number; };

interface WorldObject {
    objectType: "sprite" | "solid";
    render(canvas: HTMLCanvasElement): void;
}

interface SolidObject extends WorldObject {
    objectType: "solid"
    blocksPoint: (testPoint: Coordinate) => boolean;
}

interface Sprite extends WorldObject {
    objectType: "sprite"
    updateState(sceneState: SceneState, solidObjects: SolidObject[]): void;
}

class Scene {
    canvas: HTMLCanvasElement;
    player: Player;
    sprites: Sprite[];
    solidObjects: SolidObject[];
    state: SceneState;

    constructor(canvas: HTMLCanvasElement, player: Player, sprites: Sprite[], solidObjects: SolidObject[]) {
        this.canvas = canvas;
        this.player = player;
        this.sprites = sprites;
        this.solidObjects = solidObjects;
        this.state = {
            ticks: 0,
            keyboard: {
                space: false
            },
            mouse: {
                x: 0,
                y: 0,
                pressed: false
            }
        };
    }

    private _renderScene() {
        const context = getContext(this.canvas);

        context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.solidObjects.forEach(solidObject => {
            solidObject.render(this.canvas);
        })
        this.sprites.forEach(sprite => {
            sprite.render(this.canvas);
        });
        this.player.render(this.canvas);
    }

    private _updateState() {
        this.state.ticks += 1;
        this.sprites.forEach(sprite => { sprite.updateState(this.state, this.solidObjects) });
        this.player.updateState(this.state, this.solidObjects);
    }

    run() {
        // add keyboard listeners
        document.addEventListener('keydown', event => {
            if (event.keyCode === 32) {
                this.state.keyboard.space = true;
            }
        });

        document.addEventListener('keyup', event => {
            if (event.keyCode === 32) {
                this.state.keyboard.space = false;
            }
        });

        // add mouse listeners
        document.addEventListener('mousemove', event => {
            this.state.mouse.x = event.clientX - this.canvas.getBoundingClientRect().left;
            this.state.mouse.y = event.clientY - this.canvas.getBoundingClientRect().top;
        });

        document.addEventListener('mousedown', event => {
            this.state.mouse.pressed = true;
        });

        document.addEventListener('mouseup', event => {
            this.state.mouse.pressed = false;
        });

        setInterval(
            () => {
                this._updateState();
                this._renderScene();
            },
            10
        )
    }
}

class OctogonalWall implements SolidObject {
    objectType: "solid";
    octogonSize: number;
    offset: { offsetX: number, offsetY: number };

    constructor(octogonSize: number, canvasSize: Dimensions) {
        this.objectType = "solid";
        this.octogonSize = octogonSize
        this.offset = {
            offsetX: (canvasSize.width - octogonSize) / 2,
            offsetY: (canvasSize.height - octogonSize) / 2,
        }
    }

    coordinates() {
        const sideLength = Math.sqrt(2) * this.octogonSize / (Math.sqrt(2) + 2);
        const cornerLength = sideLength / Math.sqrt(2);

        const last = <T>(elts: T[]): T => elts.slice(-1)[0];
        
        const topLeft = { x: this.offset.offsetX, y: this.offset.offsetY }

        const coordinates: Coordinate[]  = [ { x: topLeft.x, y: topLeft.y + cornerLength } ];
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

    blocksPoint(testPoint: Coordinate) {
        const testCanvas = document.createElement('canvas');
        const context = getContext(testCanvas);
        this._renderWithContext(context);
        return context.isPointInStroke(testPoint.x, testPoint.y);
    }
    
    _renderWithContext(context: CanvasRenderingContext2D) {
        const coordinates = this.coordinates();
        context.beginPath();
        context.moveTo(coordinates[0].x, coordinates[0].y);
        for (var i = 1; i < coordinates.length; i++) {
            context.lineTo(coordinates[i].x, coordinates[i].y);
        }

        context.closePath()
        context.lineWidth = 3;
        context.strokeStyle = 'blue';
        context.stroke();
    }

    render(canvas: HTMLCanvasElement) {
        this._renderWithContext(getContext(canvas));
    };
}

type PlayerState = {
    position: Coordinate;
    facingLeft: boolean;
}

class Player implements Sprite {
    objectType: "sprite";
    image: HTMLImageElement;
    size: Dimensions;
    maxSpeed: number;
    state: PlayerState;

    constructor(canvas: HTMLCanvasElement) {
        this.objectType = "sprite";

        this.image = <HTMLImageElement>document.getElementById("red0");
        this.size = { width: 40, height: 50 };
        this.maxSpeed = 1.8;

        this.state = {
            position: {
                x: canvas.offsetWidth / 2 - this.size.width / 2,
                y: canvas.offsetHeight / 2 - this.size.height / 2
            },
            facingLeft: false
        };
    }

    render(canvas: HTMLCanvasElement) {
        const context = getContext(canvas);
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

    updateState(sceneState: SceneState, solidObjects: SolidObject[]) {
        const mouseVector = {
            x: sceneState.mouse.x - this._center().x,
            y: sceneState.mouse.y - this._center().y
        }

        const mouseVectorMagnitude = Math.sqrt(mouseVector.x ** 2 + mouseVector.y ** 2);

        // calculate next state
        const nextState: PlayerState = {
            position: { ...this.state.position },
            facingLeft: this.state.facingLeft
        }

        if (mouseVectorMagnitude > this.maxSpeed && sceneState.mouse.pressed) {
            nextState.position.x += this.maxSpeed * mouseVector.x / mouseVectorMagnitude;
            nextState.position.y += this.maxSpeed * mouseVector.y / mouseVectorMagnitude;

            if (mouseVector.x < 0) {
                nextState.facingLeft = true;
            } else if (mouseVector.x > 0) {
                nextState.facingLeft = false;
            }
        }

        // check for collisions
        if (!this._hasCollision(nextState, solidObjects)) {
            this.state = nextState;
        } else {
            // try just moving horizontally
            const horizontalNextState = {
                ...nextState,
                position: {
                    ...nextState.position,
                    y: this.state.position.y
                }
            };

            if (!this._hasCollision(horizontalNextState, solidObjects)) {
                this.state = horizontalNextState;
            } else {
                // try just moving vertically
                const verticalNextState = {
                    ...nextState,
                    position: {
                        ...nextState.position,
                        x: this.state.position.x
                    }
                };

                if (!this._hasCollision(verticalNextState, solidObjects)) {
                    this.state = verticalNextState;
                }
            }
        }
    }

    private _hasCollision(state: PlayerState, solidObjects: SolidObject[]) {
        return solidObjects.some(solidObject => {
            return this._getCorners(state).some(corner => {
                return solidObject.blocksPoint(corner);
            })
        });
    }

    private _getCorners(state: PlayerState): Coordinate[] {
        return [
            {x: state.position.x, y: state.position.y },
            {x: state.position.x + this.size.width, y: state.position.y },
            {x: state.position.x + this.size.width, y: state.position.y + this.size.height },
            {x: state.position.x, y: state.position.y + this.size.height }
        ]
    }

    private _center(): Coordinate {
        return {
            x: this.state.position.x + this.size.width / 2,
            y: this.state.position.y + this.size.height / 2
        }
    }
}

function getContext(canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");
    if (context == null) {
        throw Error("null context");
    }

    return context
}


window.onload = main;
