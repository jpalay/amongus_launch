import * as Player from "./Player";
import * as Scene from "./Scene";
import * as Helpers from "./helpers";
import * as ServerInterfaces from "../../ServerInterfaces";

export class OtherPlayer extends Player.Player {
    private updateQueue: Player.State[];

    constructor(socket: SocketIOClient.Socket, player: ServerInterfaces.PlayerDescriptor) {
        super(socket, player);
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
        if (this.id === message.playerId) {
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
