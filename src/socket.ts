// tslint:disable:no-console
import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import lowdb from "lowdb"
import FileSync from "lowdb/adapters/FileSync"

import { Room, PlayerDescriptor, FuelingStationDescriptor } from "./ServerInterfaces";
import * as ServerInterfaces from "./ServerInterfaces";


type Schema = {
    players: PlayerDescriptor[]
    rooms: Room[],
    fuelingStations: ServerInterfaces.FuelingStationDescriptor[],
}

const adapter = new FileSync<Schema>("db.json");
const db = lowdb(adapter);

const MAX_ROOM_SIZE = 13;
const FUELING_STATION_LOCATIONS = [
    { x: 300, y: 200 },
    { x: 300, y: 300 },
    { x: 300, y: 400 },
    { x: 300, y: 500 },
    { x: 300, y: 600 },

    { x: 400, y: 200 },
    { x: 400, y: 300 },
    { x: 400, y: 400 },
    { x: 400, y: 500 },
    { x: 400, y: 600 },

    { x: 500, y: 300 },
    { x: 500, y: 400 },
    { x: 500, y: 500 },
];

db.defaults({ players: [], rooms: [], fuelingStations: [] }).write()

export default (io: Server) => {
    io.on("connection", socket => {
        socket.on("event", (message: ServerInterfaces.RequestParams) => {
            const params = message as ServerInterfaces.RequestParams;
            console.log("============== received params ==============")
            console.log(params)
            console.log("============== done receiving params ==============")

            switch (params.eventName) {
                case "register_user":
                    _registerUser(params, socket, io);
                    break;

                case "start_game":
                    _startGame(params, socket, io);
                    break;

                case "update_state":
                    _updateState(params, socket, io)
                    break;

                case "fueling_complete":
                    _fuelingComplete(params, socket, io)
                    break;
            }
        });
    });
}

/***********************
 * MESSAGE HANDLERS
 ***********************/

const _registerUser = (params: ServerInterfaces.RegisterUserParams, socket: Socket, io: Server) => {
    db.read();
    const { room, existingRoom } = _getOrCreateRoom(params.roomName);
    const isAdmin = !existingRoom;

    const currentPlayerDescriptor = _getOrCreatePlayer(
        room.name,
        params.userName,
        {
            roomName: room.name,
            name: params.userName,
            isAdmin,
            id: uuidv4(),
            color: params.color,
            initialState: {
                position: { x: 400, y: 400 },
                facingLeft: false,
                walkingTicks: 0
            }
        }
    );

    db.read();
    const allPlayers = db.get("players").filter({ roomName: room.name }).value().map(playerDescriptor => ({
        descriptor: playerDescriptor,
        fuelingStation: db.get("fuelingStations").find({ playerId: playerDescriptor.id }).value()
    }))

    const response: ServerInterfaces.RegisterUserResponse = {
        eventName: "register_user",
        room,
        registeredPlayer: {
            descriptor: currentPlayerDescriptor,
            fuelingStation: db.get("fuelingStations").find({ playerId: currentPlayerDescriptor.id }).value()
        },
        allPlayers,
        gamePhase: room.gamePhase
    };

    socket.join(room.name);
    _broadcastMessage(io, room.name, response);
}

const _startGame = (params: ServerInterfaces.StartGameParams, socket: Socket, io: Server) => {
    db.read();
    db.get("rooms").find({ name: params.roomName }).assign({ gamePhase: "run_game" }).write();
    const room = db.get("rooms").find({ name: params.roomName }).value();

    const response: ServerInterfaces.StartGameResponse = {
        eventName: "start_game",
        allPlayers: db.get("players").filter({ roomName: room.name }).value()
    }

    _broadcastMessage(io, room.name, response);
}


const _updateState = (params: ServerInterfaces.UpdateStateParams, socket: Socket, io: Server) => {
    db.read();
    const { roomName } = db.get("players").find({id: params.playerId}).value();
    const response: ServerInterfaces.UpdateStateResponse = {
        eventName: "update_state",
        playerId: params.playerId,
        updateQueue: params.updateQueue,
    }
    _broadcastMessage(io, roomName, response);
}

const _fuelingComplete = (params: ServerInterfaces.FuelingCompleteParams, socket: Socket, io: Server) => {
    db
        .get("fuelingStations")
        .find({ playerId: params.playerId })
        .assign({ isFueled: true })
        .write();

    db.read();
    const fuelingComplete = db.get("fuelingStations")
        .find({ roomName: params.roomName, isFueled: false })
        .size()
        .value() === 0;

    if (fuelingComplete) {
        _broadcastMessage(io, params.roomName, {
            eventName: "ready_to_launch"
        });
    }
}

/***********************
 * HELPERS
 ***********************/

const _broadcastMessage = (io: Server, roomName: string, response: ServerInterfaces.ServerResponse) => {
    console.log("============== sending response ==============")
    console.log(response)
    io.in(roomName).emit("event", response);
    console.log("============== done sending response ==============")
}

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
    roomName: string,
    name: string,
    descriptor: PlayerDescriptor
) => {
    const existingPlayer = db.get("players").find({roomName, name}).value();
    if (existingPlayer !== undefined) {
        return existingPlayer;
    } else {
        const currentRoomSize = db.get("players").filter({ roomName }).value().length;
        if (currentRoomSize > MAX_ROOM_SIZE) {
            throw new Error("too many players in the room")
        }

        db.get("players").push(descriptor).write();
        db.get("fuelingStations").push({
            roomName,
            playerId: descriptor.id,
            position: FUELING_STATION_LOCATIONS[currentRoomSize],
            isFueled: false
        }).write();
        console.log("wrote to fuelingStations");

        return descriptor;
    }
}
