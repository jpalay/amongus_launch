import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import lowdb from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync'

import * as ServerInterfaces from "./ServerInterfaces";

const adapter = new FileSync('db.json');
const db = lowdb(adapter);


const _registerUser = (params: ServerInterfaces.RegisterUserParams, io: Server | Socket) => {
  // tslint:disable-next-line:no-console
    console.log(params.foo);
    return 0;
}

export default (io: Server) => {
    io.on("connection", socket => {
        socket.on("event", message => {
            const params = JSON.parse(message) as ServerInterfaces.Params;

            switch (params.eventName) {
                case "register_user":
                    _registerUser(params, io);
                    break;
            }
        });
    });
}
