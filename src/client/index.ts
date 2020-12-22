// import * as Scene from './Scene'
// import * as CurrentPlayer from './CurrentPlayer'
// import * as OctogonalWall from './OctogonalWall'

import React from "react";
import ReactDOM from "react-dom";
import * as GameStateManager from './GameStateManager'

const main = () => {
    const gameStateManager = 
    ReactDOM.render(
        GameStateManager.create({});
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
