// tslint:disable:no-console
import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import lowdb from "lowdb"
import FileSync from "lowdb/adapters/FileSync"

import { Room, PlayerDescriptor } from "./ServerInterfaces";
import * as ServerInterfaces from "./ServerInterfaces";


type Schema = {
    players: PlayerDescriptor[]
    rooms: Room[],
}

const adapter = new FileSync<Schema>("db.json");
const db = lowdb(adapter);

db.defaults({ players: [], rooms: [] }).write()

const _getOrCreateRoom = (roomName: string) => {
    const existingRoom = db.get("rooms").find({name: roomName }).value();

    if (existingRoom !== undefined) {
        return { room: existingRoom, existingRoom: true };
    } else {
        const room = { name: roomName, gamePhase: "lobby" as const };
        db.get("rooms").push(room).write();
        return { room, existingRoom: false};
    }
}

const _getOrCreatePlayer = (
    lookupKey: Partial<PlayerDescriptor>,
    descriptor: PlayerDescriptor
) => {
    const existingPlayer = db.get("players").find(lookupKey).value();
    if (existingPlayer !== undefined) {
        return existingPlayer;
    } else {
        db.get("players").push(descriptor).write();
        return descriptor;
    }
}

const _registerUser = (params: ServerInterfaces.RegisterUserParams, socket: Socket, io: Server) => {
    db.read();
    const { room, existingRoom } = _getOrCreateRoom(params.roomName);
    const isAdmin = !existingRoom;

    const playerDescriptor = _getOrCreatePlayer(
        { name: params.userName, room },
        {
            room,
            name: params.userName,
            isAdmin,
            id: uuidv4(),
            color: params.color,
            initialState: {
                position: {x: 400, y: 400},
                facingLeft: false,
                walkingTicks: 0
            }
        }
    )

    db.read();
    const allPlayers = db.get("players").filter({ room }).value()

    const response: ServerInterfaces.RegisterUserResponse = {
        eventName: "register_user",
        registeredPlayer: playerDescriptor,
        allPlayers,
        gamePhase: room.gamePhase
    };

    console.log(response);

    socket.join(room.name);
    io.in(room.name).emit("event", response)
}


const _startGame = (params: ServerInterfaces.StartGameParams, socket: Socket, io: Server) => {
    console.log("starting game");
    db.read();
    db.get("rooms").find({ name: params.roomName }).assign({ gamePhase: "run_game" }).write();
    const room = db.get("rooms").find({ name: params.roomName }).value();

    const response: ServerInterfaces.StartGameResponse = {
        eventName: "start_game",
        allPlayers: db.get("players").filter({ room }).value()
    }
    console.log("emitting start_game response to", params.roomName);
    io.in(params.roomName).emit("event", response);
}

const _updateState = (params: ServerInterfaces.UpdateStateParams, socket: Socket, io: Server) => {
    db.read();
    const { room } = db.get("players").find({id: params.playerId}).value();
    const response: ServerInterfaces.UpdateStateResponse = {
        eventName: "update_state",
        playerId: params.playerId,
        updateQueue: params.updateQueue,
    }
    io.in(room.name).emit("event", response);
}


export default (io: Server) => {
    io.on("connection", socket => {
        socket.on("event", (message: ServerInterfaces.RequestParams) => {
            // tslint:disable-next-line:no-console
            const params = message as ServerInterfaces.RequestParams;
            console.log("received params")
            console.log(params)
            console.log("done receiving params")

            switch (params.eventName) {
                case "register_user":
                    _registerUser(params, socket, io);
                    break;

                case "start_game":
                    _startGame(params, socket, io);
                    break;

                case "update_state":
                    _updateState(params, socket, io)
            }
        });
    });
}
