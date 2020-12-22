import React from "react";
import * as ServerInterfaces from "../ServerInterfaces";

export type State = {
    gamePhase: "join_game" | "join_game_pending" | "lobby" | "run_game";
    players: ServerInterfaces.PlayerDescriptor;
}

export type Props = {};

export class Component extends React.Component<Props, State> {
    displayName = "GameStateManager";

    constructor(props: Props) {
        super(props);
        this.state = {
            gamePhase: "join_game",
            players: []
        }
    }

    _registerUser() {
        console.log("click")
        this.setState({
            gamePhase: "join_game_pending"
        }
    }

    render() {
        console.log("GAME PHASE:", this.gamePhase) // why doesn't this fail to compile?
        switch (this.state.gamePhase) {
            case "join_game":
                return this._renderForm();
            case "join_game_pending":
                return this._renderJoinGamePending();
            default:
                return null;
        }
    }

    private _renderForm() {
        return (
            <div>
                <input type="text" placeholder = "username"/>
                <input type="text" placeholder = "roomName"/>
                <button type="button" onClick={() => this._registerUser()}>join game</button>
            </div>
        );
    }

    private _renderJoinGamePending() {
        return (
            <span>Joining game...</span>
        )
    }
}

export const create = (props: Props) => React.createElement(Component, props);
