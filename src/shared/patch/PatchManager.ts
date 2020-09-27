import { CancelFlexPatch } from "@shared/patch/flexpatch";

export default class PatchManager {
    activePatches: CancelFlexPatch[] = []

    addPatch(p: CancelFlexPatch): void {
        this.activePatches.push(p);
    }

    stop(): void {
        this.activePatches.forEach(c => c());
        this.activePatches = [];
    }
}
