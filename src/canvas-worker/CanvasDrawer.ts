export interface CanvasDrawerState {
	mousePos: Readonly<Uint16Array>
}

export class CanvasDrawer {
	#state: CanvasDrawerState

	constructor(state: CanvasDrawerState) {
		this.#state = state
	}

	draw(ctx: OffscreenCanvasRenderingContext2D) {
		ctx.fillStyle = "rgb(255, 0, 0)"
		ctx.beginPath()
		ctx.arc(this.#state.mousePos[0], this.#state.mousePos[1], 4, 0, 2 * Math.PI)
		ctx.fill()
	}
}
