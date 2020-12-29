import * as Player from "./client/canvas/Player";
import * as Helpers from "./client/canvas/helpers";

export const Colors = ["teal", "red", "blue", "purple", "brown", "black", "pink"] as const;
export type Color = (typeof Colors)[number];
export type GamePhase ="join_game" | "join_game_pending" | "lobby" | "run_game";
export type Room = { name: string, gamePhase: GamePhase};

export const CANVAS_SIZE: Helpers.Dimensions = { width: 900, height: 900 };

export type PlayerDescriptor = {
    id: string;
    name: string;
    isAdmin: boolean;
    color: Color;
    roomName: string;
    initialState: Player.State
}

export type FuelingStationDescriptor = {
    roomName: string;
    playerId: string;
    position: Helpers.Coordinate;
}

export type RegisterUserParams = {
    eventName: "register_user";
    roomName: string;
    color: Color;
    userName: string;
}

export type StartGameParams = {
    eventName: "start_game";
    roomName: string;
}

export type UpdateStateParams = {
    eventName: "update_state";
    playerId: string;
    updateQueue: Player.State[],
};

export type RegisterUserResponse = {
    eventName: "register_user";
    room: Room,
    registeredPlayer: {
        descriptor: PlayerDescriptor;
        fuelingStation: FuelingStationDescriptor;
    };
    allPlayers: {
        descriptor: PlayerDescriptor;
        fuelingStation: FuelingStationDescriptor;
    }[];
    gamePhase: GamePhase;
}

export type StartGameResponse = {
    eventName: "start_game";
    allPlayers: PlayerDescriptor[];
}
export type UpdateStateResponse = UpdateStateParams;

export type RequestParams = RegisterUserParams | StartGameParams | UpdateStateParams;
export type ServerResponse = RegisterUserResponse | StartGameResponse | UpdateStateResponse;
