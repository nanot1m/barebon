import type {CanvasDrawer} from "./CanvasDrawer"

export class CanvasContainer {
	#canvas: OffscreenCanvas
	#ctx: OffscreenCanvasRenderingContext2D
	#devicePixelRatio: number
	#width: number
	#height: number
	#canvasDrawer: CanvasDrawer
	#rafHandle = 0
	#state: "running" | "stopped" = "stopped"

	constructor(
		canvas: OffscreenCanvas,
		devicePixelRatio: number,
		width: number,
		height: number,
		canvasDrawer: CanvasDrawer,
	) {
		this.#canvas = canvas
		this.#ctx = canvas.getContext("2d")!
		this.#devicePixelRatio = devicePixelRatio
		this.#width = width
		this.#height = height
		this.#canvasDrawer = canvasDrawer
	}

	scaleCanvas() {
		this.#canvas.width = this.#width * this.#devicePixelRatio
		this.#canvas.height = this.#height * this.#devicePixelRatio
		this.#ctx.scale(this.#devicePixelRatio, this.#devicePixelRatio)
	}

	runLoop() {
		if (this.#state === "running") {
			return
		}
		this.#state = "running"
		this.#loop()
	}

	stopLoop() {
		if (this.#state === "stopped") {
			return
		}
		this.#state = "stopped"
		cancelAnimationFrame(this.#rafHandle)
	}

	#clearCanvas() {
		this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height)
	}

	#loop = () => {
		this.#clearCanvas()
		this.#draw()
		this.#rafHandle = requestAnimationFrame(this.#loop)
	}

	#draw() {
		this.#canvasDrawer.draw(this.#ctx)
	}
}
