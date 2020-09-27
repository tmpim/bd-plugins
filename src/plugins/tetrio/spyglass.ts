import { logger } from "@shared/base/logger";

let shouldConnect = false;
let idCounter = 0;

const listeners: { id: number; func: (msg: unknown) => void; }[] = [];
let ws: WebSocket | undefined;
export function connect(): void {
    if (ws) return;
    shouldConnect = true;
    ws = new WebSocket("wss://spyglass.tmpim.pw/subscribe");

    ws.onmessage = (e) => {
        listeners.forEach(l => l.func(e.data));
    };

    ws.onclose = () => {
        ws = void ws;
        if (shouldConnect) {
            logger.log("Socket is closed. Reconnect will be attempted in 1 second.", "spyglass");
            setTimeout(connect, 1000);
        } else {
            logger.log("Socket successfully shutdown.", "spyglass");
        }
    };

    ws.onerror = (err) => {
        logger.error("Socket encountered error: " + err + "Closing socket", "spyglass");
        ws?.close();
    };
}

export function close(): void {
    logger.log("Shutting down spyglass socket.");
    shouldConnect = false;
    ws?.close();
}

export function registerListener(func: (msg: unknown) => void): number {
    const id = idCounter++;
    listeners.push({ id, func });
    return id;
}

export function removeListener(rid: number): void {
    const idx = listeners.findIndex(({ id }) => id === rid);
    if (idx >= 0) {
        listeners.splice(idx, 1);
    } else {
        console.warn("Could not unregister ws listener!!!");
    }
}
