import {useCallback, useEffect, useRef, useState} from "react"
import "./Canvas.css"
import {TransportCommands} from "./shared/TransportCommands"

const canvasWorkerUrl = new URL("./canvas-worker/canvas-worker.ts", import.meta.url)

function createDefaultMousePosArray(buffer: SharedArrayBuffer) {
	const mousePos = new Uint16Array(buffer)
	mousePos[0] = 0
	mousePos[1] = 0
	return mousePos
}

function sendEventToWorker(worker: Worker, action: TransportCommands, transfer: Transferable[] = []) {
	worker.postMessage(action, transfer)
}

export function Canvas() {
	const canvasWeakMapRef = useRef(new WeakMap<HTMLCanvasElement, OffscreenCanvas>())
	const [[canvasWidth, canvasHeight], setCanvasSize] = useState([320, 240])
	const initialCanvasSizeRef = useRef([canvasWidth, canvasHeight])
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const mousePosBufferRef = useRef(new SharedArrayBuffer(Uint16Array.BYTES_PER_ELEMENT * 2))
	const mousePosRef = useRef(createDefaultMousePosArray(mousePosBufferRef.current))

	const [worker, setWorker] = useState<Worker | null>(null)
	const [workerKey, setWorkerKey] = useState(0)

	useEffect(() => {
		const worker = new Worker(canvasWorkerUrl, {type: "module"})
		setWorker(worker)
		setWorkerKey((workerKey) => workerKey + 1)
		return () => worker.terminate()
	}, [])

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas || !worker || canvasWeakMapRef.current.has(canvas)) {
			return
		}

		const offscreen = canvas.transferControlToOffscreen()
		canvasWeakMapRef.current.set(canvas, offscreen)

		sendEventToWorker(
			worker,
			{
				type: "init",
				payload: {
					devicePixelRatio: window.devicePixelRatio ?? 1,
					width: initialCanvasSizeRef.current[0],
					height: initialCanvasSizeRef.current[1],
					canvas: offscreen,
					mousePos: mousePosRef.current,
				},
			},
			[offscreen],
		)

		return () => {
			worker.postMessage({type: "terminate"})
		}
	}, [worker])

	const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
		const mousePos = mousePosRef.current
		const x = e.clientX - e.currentTarget.offsetLeft
		const y = e.clientY - e.currentTarget.offsetTop

		mousePos[0] = x
		mousePos[1] = y
	}, [])

	const handleClick = useCallback(
		(e: React.PointerEvent<HTMLCanvasElement>) => {
			if (!worker) return
			const x = e.clientX - e.currentTarget.offsetLeft
			const y = e.clientY - e.currentTarget.offsetTop
			sendEventToWorker(worker, {type: "click", payload: [x, y]})
		},
		[worker],
	)

	const handlePointerDown = useCallback(
		(e: React.PointerEvent<HTMLCanvasElement>) => {
			if (!worker) return
			const x = e.clientX - e.currentTarget.offsetLeft
			const y = e.clientY - e.currentTarget.offsetTop
			sendEventToWorker(worker, {type: "pointerdown", payload: [x, y]})
		},
		[worker],
	)

	const handlePointerUp = useCallback(
		(e: React.PointerEvent<HTMLCanvasElement>) => {
			if (!worker) return
			const x = e.clientX - e.currentTarget.offsetLeft
			const y = e.clientY - e.currentTarget.offsetTop
			sendEventToWorker(worker, {type: "pointerup", payload: [x, y]})
		},
		[worker],
	)

	return (
		<canvas
			key={workerKey}
			className="canvas"
			ref={canvasRef}
			onPointerMove={handleMouseMove}
			onClick={handleClick}
			onPointerDown={handlePointerDown}
			onPointerUp={handlePointerUp}
			style={{
				width: canvasWidth,
				height: canvasHeight,
			}}
		/>
	)
}
