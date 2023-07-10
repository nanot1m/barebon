import {CanvasApp} from "./CanvasApp"
import {Commander} from "./Commander"
import type {TransportCommands} from "../shared/TransportCommands"

const commander = new Commander<TransportCommands>()
const canvasApp = new CanvasApp(commander)

canvasApp.init()

self.addEventListener("message", (event: MessageEvent<TransportCommands>) => {
	console.debug("canvas-worker: received message", event.data)

	commander.emit(event.data.type, "payload" in event.data ? event.data.payload : undefined)
})
