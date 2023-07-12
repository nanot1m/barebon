let mousePos: Uint16Array
let canvas: OffscreenCanvas
let ctx: OffscreenCanvasRenderingContext2D

console.log("render-worker: started", self)

type BarebonViewObject = {
	type: "rect"
	x: number
	y: number
	width: number
	height: number
	stroke: string
	fill: string
	strokeWidth?: number
}

type RenderingState = {
	elements: BarebonViewObject[]
	hoveredElement: BarebonViewObject | undefined
	state: {type: "idle"} | {type: "dragging"; element: BarebonViewObject; x: number; y: number}
}

const state: RenderingState = {
	elements: [],
	hoveredElement: undefined,
	state: {type: "idle"},
}

self.addEventListener("message", (event) => {
	console.log("render-worker: received message", event.data)

	if (event.data.type === "init") {
		mousePos = event.data.mousePos
		canvas = event.data.canvas as OffscreenCanvas
		ctx = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D
		canvas.width = event.data.width * event.data.pixelRatio
		canvas.height = event.data.height * event.data.pixelRatio
		ctx.scale(event.data.pixelRatio, event.data.pixelRatio)

		const dataWorker = new Worker("./process-data-worker.ts", {type: "module"})
		dataWorker.postMessage({
			type: "init",
			mousePos,
		})
	}

	if (event.data.type === "click") {
		handleClick(event)
	}

	if (event.data.type === "pointerdown") {
		handlePointerDown(event.data.x, event.data.y)
	}

	if (event.data.type === "pointerup") {
		handlePointerUp()
	}
})

function handleClick(event: MessageEvent<{x: number; y: number}>) {
	if (state.state.type === "idle") {
		state.elements.push({
			type: "rect",
			x: event.data.x - 10,
			y: event.data.y - 10,
			width: 20,
			height: 20,
			stroke: "black",
			fill: "red",
		})
	}

	if (state.state.type === "dragging") {
		state.state = {type: "idle"}
	}
}

function handleTickEffects() {
	if (state.state.type === "idle") {
		return
	}

	if (state.state.type === "dragging") {
		const dx = mousePos[0] - state.state.x
		const dy = mousePos[1] - state.state.y
		state.state.element.x += dx
		state.state.element.y += dy
		state.state.x = mousePos[0]
		state.state.y = mousePos[1]
	}
}

function handlePointerDown(x: number, y: number) {
	if (state.hoveredElement === undefined) {
		return
	}
	state.state = {type: "dragging", element: state.hoveredElement, x, y}
}

function handlePointerUp() {
	// do nothing
}

function renderMouse(ctx: OffscreenCanvasRenderingContext2D, mousePos: Uint16Array) {
	const [x, y] = mousePos

	// render cross
	ctx.beginPath()
	ctx.moveTo(x - 5, y)
	ctx.lineTo(x + 5, y)
	ctx.moveTo(x, y - 5)
	ctx.lineTo(x, y + 5)
	ctx.strokeStyle = "black"
	ctx.stroke()
}

function getHoveredElement(mousePos: Uint16Array, elements: BarebonViewObject[]) {
	if (state.state.type === "dragging") {
		return state.state.element
	}

	for (let i = elements.length - 1; i >= 0; i--) {
		const element = elements[i]
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
				return element
			}
		}
	}
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

function renderRect(
	ctx: OffscreenCanvasRenderingContext2D,
	rect: BarebonViewObject,
	isHovered: boolean,
) {
	const rectPath = new Path2D()
	rectPath.rect(rect.x, rect.y, rect.width, rect.height)
	ctx.fillStyle = rect.fill
	ctx.strokeStyle = rect.stroke
	ctx.fill(rectPath)
	ctx.stroke(rectPath)

	if (isHovered) {
		const outerRect = new Path2D()
		outerRect.rect(rect.x - 2, rect.y - 2, rect.width + 4, rect.height + 4)
		ctx.strokeStyle = "blue"
		ctx.lineWidth = 1
		ctx.stroke(outerRect)
	}
}

function renderElements(ctx: OffscreenCanvasRenderingContext2D, elements: BarebonViewObject[]) {
	for (const element of elements) {
		if (element.type === "rect") {
			renderRect(ctx, element, element === state.hoveredElement)
		}
	}
}

function render() {
	if (canvas === undefined) {
		return
	}
	state.hoveredElement = getHoveredElement(mousePos, state.elements)

	ctx.clearRect(0, 0, canvas.width, canvas.height)

	renderElements(ctx, state.elements)
	renderMouse(ctx, mousePos)
}

function renderLoop() {
	if (mousePos !== undefined) {
		render()
		handleTickEffects()
	}
	requestAnimationFrame(renderLoop)
}

renderLoop()

export {}
