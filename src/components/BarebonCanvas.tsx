import './BarebonCanvas.css'

import {useEffect, useRef} from "react"

interface BarebonCanvasProps {
	width: number
	height: number
}

export function BarebonCanvas(props: BarebonCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const workerRef = useRef<Worker | null>(null)
	const sharedBufferRef = useRef<SharedArrayBuffer>(new SharedArrayBuffer(Uint16Array.BYTES_PER_ELEMENT * 2))
	const cursorPosRef = useRef<Uint16Array>(new Uint16Array(sharedBufferRef.current))
	const initialSizeRef = useRef({width: props.width, height: props.height})
	const offscreenRef = useRef<OffscreenCanvas | null>(null)

	useEffect(() => {
		if (offscreenRef.current !== null) {
			return
		}

		if (canvasRef.current === null) {
			return
		}

		const renderWorker = new Worker(new URL("../workers/render-worker.ts", import.meta.url))
		workerRef.current = renderWorker

		const offscren = canvasRef.current.transferControlToOffscreen()
		offscreenRef.current = offscren

		renderWorker.postMessage(
			{
				type: "init",
				mousePos: cursorPosRef.current,
				canvas: offscren,
				width: initialSizeRef.current.width,
				height: initialSizeRef.current.height,
				pixelRatio: devicePixelRatio,
			},
			[offscren],
		)
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
			ref={canvasRef}
			style={{
				width: props.width,
				height: props.height,
			}}
		/>
	)
}
