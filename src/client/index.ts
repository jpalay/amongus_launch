import io from "socket.io-client";
import m from "mithril";

import * as GameStateManager from "./GameStateManager"

const main = () => {
    const socket: SocketIOClient.Socket = io(
        "https://palay-pi-websockets.ngrok.io",
        {
            transports: ["websocket"]
        }
    );
    m.mount(
        <HTMLDivElement>document.getElementById("main"),
        new GameStateManager.GameStateManager({ socket })
    );
}

window.onload = main;
