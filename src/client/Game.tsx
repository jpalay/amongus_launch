import React from "react";
import * as ServerInterfaces from "../ServerInterfaces";
import * as CurrentPlayer from "./CurrentPlayer";
import * as OtherPlayer from "./OtherPlayer";
import * as Scene from "./Scene";
import * as OctogonalWall from "./OctogonalWall";


export type Props = {
    socket: SocketIOClient.Socket,
    currentPlayer: ServerInterfaces.PlayerDescriptor,
    otherPlayers: ServerInterfaces.PlayerDescriptor[]
};

export type State = {}

export class Component extends React.Component<Props, State> {
    displayName = "Game";
    private canvasRef = React.createRef<HTMLCanvasElement>();

    render() {
        return (
            <canvas
                ref={ this.canvasRef }
                width="900"
                height="900"
            ></canvas>
        );
    }

    componentDidMount() {
        const canvas = this.canvasRef.current!;
        const scene = new Scene.Scene(
            canvas,
            this.props.socket,
            new CurrentPlayer.CurrentPlayer(canvas, this.props.socket, this.props.currentPlayer),
            this.props.otherPlayers.map(player => new OtherPlayer.OtherPlayer(canvas, this.props.socket, player)),
            [
                new OctogonalWall.OctogonalWall(
                    800,
                    { width: canvas.offsetWidth, height: canvas.offsetHeight }
                )
            ]
        );
        scene.run()
    }
}


export const create = (props: Props) => React.createElement(Component, props);
