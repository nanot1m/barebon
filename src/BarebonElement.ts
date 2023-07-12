import {Id} from "./workers/process-data-worker"

export type BarebonElement = {
	id: Id
	type: "rect"
	x: number
	y: number
	width: number
	height: number
	stroke: string
	fill: string
}
