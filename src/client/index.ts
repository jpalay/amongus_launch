// import * as Scene from './Scene'
// import * as CurrentPlayer from './CurrentPlayer'
// import * as OctogonalWall from './OctogonalWall'

// import React from "react";
// import ReactDOM from "react-dom";
import * as GameStateManager from './GameStateManager'
import io from "socket.io-client";
import m from "mithril";

const main = () => {
    const socket: SocketIOClient.Socket = io(
        `ws://${document.location.hostname}:3000`,
        {
            transports: ['websocket']
        }
    );
    console.log(<HTMLDivElement>document.getElementById("main"))
    m.mount(
        <HTMLDivElement>document.getElementById("main"),
        new GameStateManager.GameStateManager({ socket })
    );
}

window.onload = main;
