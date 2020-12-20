import * as Scene from './Scene'
import * as CurrentPlayer from './CurrentPlayer'
import * as OctogonalWall from './OctogonalWall'

const   main = () => {
    const canvas = <HTMLCanvasElement> document.getElementById("myCanvas");

    const scene = new Scene.Scene(
        canvas,
        new CurrentPlayer.CurrentPlayer(canvas),
        [],
        [
            new OctogonalWall.OctogonalWall(
                800,
                { width: canvas.offsetWidth, height: canvas.offsetHeight }
            )
        ]
    );
    scene.run()
}


window.onload = main;
