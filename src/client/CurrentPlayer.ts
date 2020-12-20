import * as Player from "./Player";
import * as Scene from "./Scene";
import * as Helpers from "./helpers";

export class CurrentPlayer extends Player.Player {
    maxSpeed: number;

    constructor(canvas: HTMLCanvasElement) {
        super(canvas);
        this.maxSpeed = 1.8;
    }

    updateState(scene: Scene.Scene) {
        const mouseVector = {
            x: scene.state.mouse.x - this._center().x,
            y: scene.state.mouse.y - this._center().y
        }

        const mouseVectorMagnitude = Math.sqrt(mouseVector.x ** 2 + mouseVector.y ** 2);

        // calculate next state
        const nextState: Player.PlayerState = {
            position: { ...this.state.position },
            facingLeft: this.state.facingLeft
        }

        if (mouseVectorMagnitude > this.maxSpeed && scene.state.mouse.pressed) {
            nextState.position.x += this.maxSpeed * mouseVector.x / mouseVectorMagnitude;
            nextState.position.y += this.maxSpeed * mouseVector.y / mouseVectorMagnitude;

            if (mouseVector.x < 0) {
                nextState.facingLeft = true;
            } else if (mouseVector.x > 0) {
                nextState.facingLeft = false;
            }
        }

        // check for collisions
        if (!this._hasCollision(nextState, scene.solidObjects)) {
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

            if (!this._hasCollision(horizontalNextState, scene.solidObjects)) {
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

                if (!this._hasCollision(verticalNextState, scene.solidObjects)) {
                    this.state = verticalNextState;
                }
            }
        }
    }

    private _hasCollision(state: Player.PlayerState, solidObjects: Scene.SolidObject[]) {
        return solidObjects.some(solidObject => {
            return this._getCorners(state).some(corner => {
                return solidObject.blocksPoint(corner);
            })
        });
    }

    private _getCorners(state: Player.PlayerState): Helpers.Coordinate[] {
        return [
            {x: state.position.x, y: state.position.y },
            {x: state.position.x + this.size.width, y: state.position.y },
            {x: state.position.x + this.size.width, y: state.position.y + this.size.height },
            {x: state.position.x, y: state.position.y + this.size.height }
        ]
    }

    private _center(): Helpers.Coordinate {
        return {
            x: this.state.position.x + this.size.width / 2,
            y: this.state.position.y + this.size.height / 2
        }
    }
}
