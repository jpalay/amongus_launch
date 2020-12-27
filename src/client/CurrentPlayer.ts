import * as Player from "./Player";
import * as Scene from "./Scene";
import * as Helpers from "./helpers";
import { PlayerDescriptor } from "../ServerInterfaces";
import * as ServerInterfaces from "../ServerInterfaces";

export class CurrentPlayer extends Player.Player {
    maxSpeed: number;
    updateQueue: Player.PlayerState[];

    constructor(canvas: HTMLCanvasElement, socket: SocketIOClient.Socket, player: PlayerDescriptor) {
        super(canvas, socket, player);
        this.maxSpeed = 5;
        this.updateQueue = [];

        setInterval(this._sendUpdateQueue, 100);
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
            facingLeft: this.state.facingLeft,
            walkingTicks: this.state.walkingTicks + 1
        }

        if (mouseVectorMagnitude > this.maxSpeed && scene.state.mouse.pressed) {
            nextState.position.x += this.maxSpeed * mouseVector.x / mouseVectorMagnitude;
            nextState.position.y += this.maxSpeed * mouseVector.y / mouseVectorMagnitude;

            if (mouseVector.x < 0) {
                nextState.facingLeft = true;
            } else if (mouseVector.x > 0) {
                nextState.facingLeft = false;
            }
        } else {
            nextState.walkingTicks = 0;
        }

        // check for collisions
        if (!this._hasCollision(nextState, scene.solidObjects)) {
            this._setState(nextState);
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
                this._setState(horizontalNextState);
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
                    this._setState(verticalNextState);
                } else {
                    this._setState({
                        ...nextState,
                        position: this.state.position,
                    })
                }
            }
        }
    }

    private _setState(nextState: Player.PlayerState) {
        if (
            this.state.position.x !== nextState.position.x
            || this.state.position.y !== nextState.position.y
            || this.state.facingLeft !== nextState.facingLeft
            || this.state.walkingTicks !== nextState.walkingTicks
        ) {
            this.state = nextState;
            this.updateQueue.push(this.state);
        }
    }

    private _sendUpdateQueue = () => {
        if (this.updateQueue.length > 0) {
            const message: ServerInterfaces.UpdateStateParams = {
                eventName: "update_state",
                playerId: this.id,
                updateQueue: this.updateQueue
            }
            this.socket.emit("event", message);
            this.updateQueue = [];
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
}
