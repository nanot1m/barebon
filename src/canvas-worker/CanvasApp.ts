import {CanvasContainer} from "./CanvasContainer"
import {CanvasDrawer} from "./CanvasDrawer"
import type {Commander} from "./Commander"
import type {TransportCommands} from "../shared/TransportCommands"

export class CanvasApp {
	#commander: Commander<TransportCommands>
	#canvasContainer: CanvasContainer | undefined

	constructor(commander: Commander<TransportCommands>) {
		this.#commander = commander
	}

	init() {
		this.#commander.on("init", (params) => {
			this.#canvasContainer = new CanvasContainer(
				params.canvas,
				params.devicePixelRatio,
				params.width,
				params.height,
				new CanvasDrawer({
					mousePos: params.mousePos,
				}),
			)
			this.#canvasContainer.scaleCanvas()
			this.#canvasContainer.runLoop()
		})

		this.#commander.on("terminate", () => {
			this.#canvasContainer?.stopLoop()
		})
	}
}
