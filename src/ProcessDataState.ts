import { Id } from "./workers/process-data-worker";
import { BarebonElement } from "./BarebonElement";

export type ProcessDataState = {
    elements: Map<Id, BarebonElement>;
    orderedElementIds: Id[];
    hoveredElementId: Id | undefined;
    state: { type: "idle"; } | { type: "dragging"; elementId: Id; x: number; y: number; };
};
