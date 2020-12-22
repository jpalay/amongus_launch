import * as Player from "./client/Player";
import * as Helpers from "./client/helpers";

export const Colors = ["teal", "red", "blue", "purple", "brown", "black", "pink"] as const;
export type Color = (typeof Colors)[number];

export type RegisterUserParams = {
    eventName: "register_user";
    roomName: string;
    color: Color;
    userName: string;
}

export type RegisterUserResponse = {
    eventName: "register_user";
    id: number;
    isAdmin: boolean;
    players: PlayerDescriptor[];
}

export type StartGameParams = {
    eventName: "start_game";
    roomName: string;
}

export type PlayerDescriptor = {
    name: string;
    id: number;
    color: Color;
}

export type StartGameResponse = {
    eventName: "start_game";
    players: PlayerDescriptor[];
    playerStates: Player.PlayerState;
}

export type UpdateStateParams = {
    eventName: "update_state";
    playerId: number;
    state: Player.PlayerState,
};

export type UpdateStateResponse = UpdateStateParams;

export type Params = RegisterUserParams | StartGameParams | UpdateStateParams;
export type Response = RegisterUserResponse | StartGameResponse | UpdateStateResponse;
