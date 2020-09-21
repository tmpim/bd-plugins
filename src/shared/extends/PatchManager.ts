import { CancelFlexPatch } from "../patch/flexpatch";

export default class PatchManager {
    activePatches: CancelFlexPatch[] = []

    addPatch(p: CancelFlexPatch) {
        this.activePatches.push(p);
    }

    stop() {
        this.activePatches.forEach(c => c());
        this.activePatches = [];
    }
}
