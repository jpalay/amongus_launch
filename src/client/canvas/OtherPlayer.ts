import * as Player from "./Player";
import * as Scene from "./Scene";
import * as ServerInterfaces from "../../ServerInterfaces";

export class OtherPlayer extends Player.Player {
    private updateQueue: Player.State[];

    constructor(socket: SocketIOClient.Socket, descriptor: ServerInterfaces.PlayerDescriptor, zIndex: number) {
        super(socket, descriptor, zIndex);
        this.updateQueue = [];

        this.socket.on("event", (message: ServerInterfaces.ServerResponse) => {
            switch (message.eventName) {
                case "update_state":
                    this._updateStateFromServer(message)
                    break;
            }
        });
    }

    private _updateStateFromServer(message: ServerInterfaces.UpdateStateResponse) {
        if (this.descriptor.id === message.playerId) {
            this.updateQueue = this.updateQueue.concat(message.updateQueue);
        }
    }

    updateState(scene: Scene.Scene) {
        const nextState = this.updateQueue.shift();
        if (nextState !== undefined) {
            this.state = nextState;
        }
    }
}
