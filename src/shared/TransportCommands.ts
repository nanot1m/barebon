import {Action, Vec2} from "./common-types"

export interface InitParams {
	devicePixelRatio: number
	width: number
	height: number
	mousePos: Uint16Array
	canvas: OffscreenCanvas
}

export type TransportCommands =
	| Action<"init", InitParams>
	| Action<"terminate">
	| Action<"click", Vec2<number>>
	| Action<"pointerdown", Vec2<number>>
	| Action<"pointerup", Vec2<number>>
