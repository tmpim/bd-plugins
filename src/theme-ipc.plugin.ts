import { BdPlugin } from "../types/BdPlugin";
import { createServer, Server, Socket } from "net";
import { unlinkSync } from "fs";

interface SocketError extends Error {
    code: string;
}

interface SettingsModule {
    updateRemoteSettings(newSettings: Record<string, string>): Promise<void>;
}

class ThemeIpc implements BdPlugin {
    settingsModule?: SettingsModule;

    ipcServer?: Server;

    getName(): string { return "ThemeIPC"; }
    getDescription(): string { return "Hosts a UNIX IPC socket and listens for theme change commands."; }
    getVersion(): string { return "0.0.1"; }
    getAuthor(): string { return "Emma"; }

    start(): void {
        this.settingsModule = BdApi.findModule(x =>
            x.default && x.default.updateRemoteSettings).default;

        if (!this.settingsModule) {
            return BdApi.showToast("Unable to load Settings Module, ThemeIPC will not work.", { timeout: 5000, type: "error" });
        }


        this.ipcServer = createServer(this.onSocketConnection.bind(this));
        if (this.ipcServer) {
            this.ipcServer.on("error", this.onServerError.bind(this));
            this.ipcServer.listen("/tmp/discord_theme");
        }
    }

    stop(): void {
        this.ipcServer?.close();
    }

    onSocketConnection(socket: Socket) {
        function tryWrite(data: string | Uint8Array) {
            if (socket.writable) {
                socket.write(data);
            }
        }

        socket.on("data", (data) => {
            this.settingsModule?.updateRemoteSettings({theme: data.toString('ascii').trim()})
                .then(() => tryWrite("OK"))
                .catch((e) => tryWrite("ERROR: " + JSON.stringify(e.errors)));
        });
    }

    onServerError(error: SocketError) {
        console.error(error);

        switch (error.code) {
            case "EACCES":
                return BdApi.showToast("Unable to create IPC Socket, ThemeIPC will not work.", { timeout: 5000, type: "error" });

            case "EADDRINUSE":
                unlinkSync("/tmp/discord_theme");
                this.ipcServer.listen("/tmp/discord_theme");
                break;

            default:
                return BdApi.showToast("An error occurred in ThemeIPC server, it may or may not still work.", { timeout: 5000, type: "error" });
        }
    }
}

export = ThemeIpc;
