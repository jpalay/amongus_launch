// import * as Scene from './Scene'
// import * as CurrentPlayer from './CurrentPlayer'
// import * as OctogonalWall from './OctogonalWall'

import React from "react";
import ReactDOM from "react-dom";
import * as GameStateManager from './GameStateManager'
import io from "socket.io-client";

const main = () => {
    const socket: SocketIOClient.Socket = io(
        `ws://${document.location.hostname}:3000`,
        {
            transports: ['websocket']
        }
    );
    const gameStateManager = 
    ReactDOM.render(
        GameStateManager.create({ socket }),
        <HTMLDivElement>document.getElementById("main")
    );

    // const canvas = <HTMLCanvasElement> document.getElementById("myCanvas");
    //
    // const scene = new Scene.Scene(
    //     canvas,
    //     new CurrentPlayer.CurrentPlayer(canvas),
    //     [],
    //     [
    //         new OctogonalWall.OctogonalWall(
    //             800,
    //             { width: canvas.offsetWidth, height: canvas.offsetHeight }
    //         )
    //     ]
    // );
    // scene.run()
}


window.onload = main;
