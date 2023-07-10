export type Action<Type extends string, Payload = undefined> = {type: Type; payload: Payload}

export type Vec2<T = number> = [T, T]
