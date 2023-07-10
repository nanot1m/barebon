import {Action} from "../shared/common-types"

export interface HandlersMap {
	[command: string]: any[]
}

type FilterByType<T extends {type: string}, U extends T["type"]> = T extends infer J
	? J extends {type: U}
		? J
		: never
	: never

export class Commander<T extends Action<any, any>> {
	#commands = {} as {[Key in T["type"]]: Array<(payload: T["payload"]) => void>}

	on<Key extends T["type"]>(command: Key, handler: (payload: FilterByType<T, Key>["payload"]) => void) {
		const handlers = this.#commands[command]
		if (handlers) {
			handlers.push(handler)
		} else {
			this.#commands[command] = [handler]
		}

		return () => {
			const handlers = this.#commands[command]
			if (handlers) {
				const index = handlers.indexOf(handler)
				if (index !== -1) {
					handlers.splice(index, 1)
				}
			}
		}
	}

	emit<Key extends T["type"]>(command: Key, payload: FilterByType<T, Key>["payload"]) {
		const handlers = this.#commands[command]
		if (handlers) {
			handlers.forEach((handler) => {
				handler(payload)
			})
		}
	}
}
