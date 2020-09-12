let shouldConnect = false;
let idCounter = 0;

const listeners: { id: number; func: (msg: any) => void; }[] = [];
let ws: WebSocket;
export function connect() {
    if (ws) return;
    shouldConnect = true;
    ws = new WebSocket("wss://spyglass.tmpim.pw/subscribe");

    ws.onmessage = (e) => {
        listeners.forEach(l => l.func(e.data));
    };

    ws.onclose = (e) => {
        ws = void ws;
        if (shouldConnect) {
            console.log('Socket is closed. Reconnect will be attempted in 1 second.', e.reason);
            setTimeout(connect, 1000);
        } else {
            console.log("Socket successfully shutdown.");
        }
    };

    ws.onerror = (err) => {
        console.error('Socket encountered error: ', err, 'Closing socket');
        ws.close();
    };
}

export function close() {
    console.log("Shutting down spyglass socket.");
    shouldConnect = false;
    ws.close();
}

export function registerListener(func: (msg: any) => void) {
    const id = idCounter++;
    listeners.push({ id, func });
    return id;
}

export function removeListener(rid: number) {
    const idx = listeners.findIndex(({ id }) => id === rid);
    if (idx >= 0) {
        listeners.splice(idx, 1);
    } else {
        console.warn("Could not unregister ws listener!!!")
    }
}
