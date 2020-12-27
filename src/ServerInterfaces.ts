import * as Player from "./client/canvas/Player";

export const Colors = ["teal", "red", "blue", "purple", "brown", "black", "pink"] as const;
export type Color = (typeof Colors)[number];
export type GamePhase ="lobby" | "run_game";
export type Room = { name: string, gamePhase: GamePhase};


export type PlayerDescriptor = {
    roomName: string;
    id: string;
    name: string;
    isAdmin: boolean;
    color: Color;
    initialState: Player.State
}

export type RegisterUserParams = {
    eventName: "register_user";
    roomName: string;
    color: Color;
    userName: string;
}

export type RegisterUserResponse = {
    eventName: "register_user";
    registeredPlayer: PlayerDescriptor;
    allPlayers: PlayerDescriptor[];
    gamePhase: GamePhase;
}

export type StartGameParams = {
    eventName: "start_game";
    roomName: string;
}

export type StartGameResponse = {
    eventName: "start_game";
    allPlayers: PlayerDescriptor[];
}

export type UpdateStateParams = {
    eventName: "update_state";
    playerId: string;
    updateQueue: Player.State[],
};

export type UpdateStateResponse = UpdateStateParams;

export type RequestParams = RegisterUserParams | StartGameParams | UpdateStateParams;
export type ServerResponse = RegisterUserResponse | StartGameResponse | UpdateStateResponse;
