import {applyPatches, enableMapSet, enablePatches} from "immer"
import {ProcessDataState} from "../ProcessDataState"
import "./BarebonCanvas.css"

enablePatches()
enableMapSet()

import {useEffect, useRef, useState} from "react"

interface BarebonCanvasProps {
	width: number
	height: number
}

const initialState: ProcessDataState = {
	elements: new Map(),
	orderedElementIds: [],
	hoveredElementId: undefined,
	state: {type: "idle"},
}

function render(ctx: CanvasRenderingContext2D, state: ProcessDataState) {
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

	for (const elementId of state.orderedElementIds) {
		const element = state.elements.get(elementId)
		if (!element) {
			continue
		}

		switch (element.type) {
			case "rect": {
				ctx.fillStyle = element.fill
				ctx.strokeStyle = element.stroke
				ctx.lineWidth = 1
				ctx.fillRect(element.x, element.y, element.width, element.height)
				ctx.strokeRect(element.x, element.y, element.width, element.height)
				break
			}
		}

		if (elementId === state.hoveredElementId) {
			const outerRect = new Path2D()
			outerRect.rect(element.x - 2, element.y - 2, element.width + 4, element.height + 4)
			ctx.strokeStyle = "blue"
			ctx.lineWidth = 1
			ctx.stroke(outerRect)
		}
	}
}

export function BarebonCanvas(props: BarebonCanvasProps) {
	const workerRef = useRef<Worker | null>(null)
	const sharedBufferRef = useRef<SharedArrayBuffer>(
		new SharedArrayBuffer(Uint16Array.BYTES_PER_ELEMENT * 2),
	)
	const [canvasCtx, setCanvasCtx] = useState<CanvasRenderingContext2D | null>(null)
	const cursorPosRef = useRef<Uint16Array>(new Uint16Array(sharedBufferRef.current))

	const stateRef = useRef<ProcessDataState>(initialState)

	useEffect(() => {
		if (!canvasCtx) {
			return
		}

		let isStopped = false
		const renderLoop = () => {
			if (isStopped) {
				return
			}

			render(canvasCtx, stateRef.current)

			requestAnimationFrame(renderLoop)
		}

		renderLoop()

		return () => {
			isStopped = true
		}
	}, [canvasCtx])

	useEffect(() => {
		if (canvasCtx) {
			canvasCtx.scale(devicePixelRatio, devicePixelRatio)
		}
	}, [canvasCtx])

	useEffect(() => {
		const renderWorker = new Worker(
			new URL("../workers/process-data-worker.ts", import.meta.url),
			{type: "module"},
		)
		workerRef.current = renderWorker

		renderWorker.postMessage(
			{
				type: "init",
				mousePos: cursorPosRef.current,
			},
			[],
		)

		renderWorker.addEventListener("message", (e) => {
			console.debug(e.data)

			if ("patches" in e.data) {
				stateRef.current = applyPatches(stateRef.current, e.data.patches)
			}
		})

		return () => {
			renderWorker.terminate()
		}
	}, [])

	function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
		cursorPosRef.current[0] = e.clientX - e.currentTarget.offsetLeft
		cursorPosRef.current[1] = e.clientY - e.currentTarget.offsetTop
	}

	function handleClick(e: React.PointerEvent<HTMLCanvasElement>) {
		if (workerRef.current === null) {
			return
		}

		const x = e.clientX - e.currentTarget.offsetLeft
		const y = e.clientY - e.currentTarget.offsetTop

		workerRef.current.postMessage({type: "click", x, y})
	}

	function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
		if (workerRef.current === null) {
			return
		}

		const x = e.clientX - e.currentTarget.offsetLeft
		const y = e.clientY - e.currentTarget.offsetTop

		workerRef.current.postMessage({type: "pointerdown", x, y})
	}

	function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
		if (workerRef.current === null) {
			return
		}

		const x = e.clientX - e.currentTarget.offsetLeft
		const y = e.clientY - e.currentTarget.offsetTop

		workerRef.current.postMessage({type: "pointerup", x, y})
	}

	return (
		<canvas
			className="barebon-canvas"
			onPointerMove={handlePointerMove}
			onPointerDown={handlePointerDown}
			onPointerUp={handlePointerUp}
			onClick={handleClick}
			width={props.width * devicePixelRatio}
			height={props.height * devicePixelRatio}
			ref={(el) => {
				setCanvasCtx(el?.getContext("2d") ?? null)
			}}
			style={{
				width: props.width,
				height: props.height,
			}}
		/>
	)
}
