import {produce, Patch, enableMapSet, enablePatches} from "immer"
import {ReadonlyDeep} from "type-fest"
import {ProcessDataState} from "../ProcessDataState"
import {BarebonElement} from "../BarebonElement"

enablePatches()
enableMapSet()

let mousePos: Uint16Array

self.addEventListener("message", (event) => {
	console.debug("render-worker: received message", event.data)

	if (event.data.type === "init") {
		mousePos = event.data.mousePos
		processDataLoop()
	}

	if (event.data.type === "click") {
		handleClick()
	}

	if (event.data.type === "pointerdown") {
		handlePointerDown(event.data.x, event.data.y)
	}

	if (event.data.type === "pointerup") {
		handlePointerUp(event.data.x, event.data.y)
	}
})

function handleClick() {
	// do nothing
}

function handlePointerDown(x: number, y: number) {
	const {hoveredElementId} = state
	if (state.state.type === "idle" && hoveredElementId) {
		mousePos[0] = x
		mousePos[1] = y

		state = produce(
			state,
			(draft) => {
				draft.state = {
					type: "dragging",
					elementId: hoveredElementId,
					x: x,
					y: y,
				}
			},
			collectPatches,
		)
	}
}

let nextId = 1
function getNextId() {
	return nextId++
}

function handlePointerUp(x: number, y: number) {
	if (state.state.type === "dragging") {
		state = produce(
			state,
			(draft) => {
				draft.state = {type: "idle"}
			},
			collectPatches,
		)
	} else if (state.state.type === "idle") {
		const newElement: BarebonElement = {
			id: getNextId(),
			type: "rect",
			x: x - 10,
			y: y - 10,
			width: 20,
			height: 20,
			stroke: "black",
			fill: "red",
		}
		state = produce(
			state,
			(draft) => {
				draft.elements.set(newElement.id, newElement)
				draft.orderedElementIds.push(newElement.id)
			},
			collectPatches,
		)
	}
}

function processData() {
	state = produce(
		state,
		(draft) => {
			if (state.state.type === "idle") {
				draft.hoveredElementId = getHoveredElement(
					mousePos,
					draft.elements,
					draft.orderedElementIds,
				)
			} else if (draft.state.type === "dragging") {
				const draggingElement = draft.elements.get(draft.state.elementId)
				if (draggingElement) {
					draggingElement.x += mousePos[0] - draft.state.x
					draggingElement.y += mousePos[1] - draft.state.y
				}
				draft.state.x = mousePos[0]
				draft.state.y = mousePos[1]
			}
		},
		collectPatches,
	)
}

export type Id = number

let state: ReadonlyDeep<ProcessDataState> = {
	elements: new Map(),
	orderedElementIds: [],
	hoveredElementId: undefined,
	state: {type: "idle"},
}

function isPointInRect(
	x: number,
	y: number,
	xRect: number,
	yRect: number,
	wRect: number,
	hRect: number,
) {
	return x >= xRect && x <= xRect + wRect && y >= yRect && y <= yRect + hRect
}

function getHoveredElement(
	mousePos: Uint16Array,
	elements: Map<Id, BarebonElement>,
	orderedElementIds: Id[],
) {
	if (state.state.type === "dragging") {
		return state.state.elementId
	}

	for (let i = orderedElementIds.length - 1; i >= 0; i--) {
		const element = elements.get(orderedElementIds[i])
		if (!element) {
			continue
		}
		if (element.type === "rect") {
			if (
				isPointInRect(
					mousePos[0],
					mousePos[1],
					element.x,
					element.y,
					element.width,
					element.height,
				)
			) {
				return element.id
			}
		}
	}
}

console.debug("process-data-worker created", self)

let statePatches: Patch[] = []

function collectPatches(patches: Patch[]) {
	statePatches.push(...patches)
}

function processDataLoop() {
	processData()
	if (statePatches.length > 0) {
		self.postMessage({type: "patches", patches: statePatches})
		statePatches = []
	}
	requestAnimationFrame(processDataLoop)
}

export {}
