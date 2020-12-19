const main = () => {
    const canvas = <HTMLCanvasElement> document.getElementById("myCanvas");

    const scene = new Scene(canvas, [new Player({ x: 20, y: 40 })]);

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

interface Sprite {
    render(context: CanvasRenderingContext2D): void;
    updateState(state: SceneState): void;
}

class Scene {
    canvas: HTMLCanvasElement;
    sprites: Sprite[];
    state: SceneState;

    constructor(canvas: HTMLCanvasElement, sprites: Sprite[]) {
        this.canvas = canvas;
        this.sprites = sprites;
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

    private _context(): CanvasRenderingContext2D {
        const context = this.canvas.getContext("2d");
        if (context == null) {
            throw Error("null context");
        }

        return context
    }

    private _renderScene() {
        const context = this._context();

        context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.sprites.forEach(sprite => {
            sprite.render(context);
        });
    }

    private _updateState() {
        this.state.ticks += 1;
        this.sprites.forEach(sprite => { sprite.updateState(this.state) });
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

class Player implements Sprite {
    position: Coordinate;
    size: Dimensions;
    maxSpeed: number;

    constructor(initialPosition: Coordinate) {
        this.position = initialPosition;
        this.size = {width: 50, height: 50};
        this.maxSpeed = 1;
    }

    render(context: CanvasRenderingContext2D) {
        context.beginPath();
        context.rect(
            this.position.x,
            this.position.y,
            this.size.width,
            this.size.height
        );

        context.fillStyle = "#FF0000";
        context.fill();
        context.closePath();
    }

    updateState(state: SceneState) {
        const mouseVector = {
            x: state.mouse.x - this._center().x,
            y: state.mouse.y - this._center().y
        }

        const mouseVectorMagnitude = Math.sqrt(mouseVector.x ** 2 + mouseVector.y ** 2);

        if (mouseVectorMagnitude > this.maxSpeed && state.mouse.pressed) {
            this.position.x += this.maxSpeed * mouseVector.x / mouseVectorMagnitude;
            this.position.y += this.maxSpeed * mouseVector.y / mouseVectorMagnitude;
        }
    }

    private _center(): Coordinate {
        return {
            x: this.position.x + this.size.width / 2,
            y: this.position.y + this.size.height / 2
        }
    }
}


window.onload = main;
