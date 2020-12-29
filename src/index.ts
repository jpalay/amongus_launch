import http from "http";
import Bundler from "parcel-bundler";
import path from "path";
import SocketIOServer from "socket.io";

import initializeSocketIO from "./socket";

import express from "express";

const app = express();
const server = new http.Server(app);
const io = SocketIOServer(server, {transports: ["websocket"]});
const port = 4000 || process.env.PORT;

initializeSocketIO(io);
io.listen(3000);

// replace the call to app.get with:
const bundler = new Bundler(path.join(__dirname, "../src/client/index.html"));
app.use(bundler.middleware());

app.use(express.static("../assets"))

app.listen(port, () => {
  // tslint:disable-next-line:no-console
  console.log(`server started at http://localhost:${port}`);
});
