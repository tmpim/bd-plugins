import uuidv4 from "@shared/util/uuid";
import logger from "@shared/base/logger";

export interface PatchCallData<F extends GenericFunction> {
    arguments: ArgumentTypes<F>,
    returnValue: ReturnType<F>,
    originalMethod: F
}

export type PatchFunction<F extends GenericFunction> = (data: PatchCallData<F>) => ReturnType<F>
export type CancelFlexPatch = () => void;

export interface PatchData<F extends GenericFunction> {
    before?: PatchFunction<F>
    instead?: PatchFunction<F>
    after?: PatchFunction<F>
    priority?: number
}

interface MethodPatch {
    id: string
    priority: number
    patch: PatchFunction<any>
    cancel: CancelFlexPatch
}

interface PatchedModule {
    __tlib_patch: {
        [methodname: string]: {
            original: Function
            patchedCmp: Function
            before: MethodPatch[]
            instead: MethodPatch[]
            after: MethodPatch[]
        }
    }
}

function isPatchedModule(obj: any): obj is PatchedModule {
    if (typeof obj == "object") {
        return (obj as PatchedModule).__tlib_patch !== undefined;
    }

    return false;
}

function gcPatch<O>(namespace: O & PatchedModule, methodname: keyof O & string) {
    const state = namespace.__tlib_patch[methodname];
    namespace[methodname] = state.original as any;
    delete namespace.__tlib_patch[methodname];

    if (Object.keys(namespace.__tlib_patch).length === 0) {
        // We're fully done here, lets wrap this up
        delete namespace.__tlib_patch;
    }
}

function generateCancel<O>(namespace: O, methodname: keyof O & string, pid: string): CancelFlexPatch {
    return function() {
        if (!isPatchedModule(namespace)) return;

        const state = namespace.__tlib_patch[methodname];
        if (!state) return;

        state.before  = state.before .filter(({ id }) => id !== pid);
        state.instead = state.instead.filter(({ id }) => id !== pid);
        state.after   = state.after  .filter(({ id }) => id !== pid);

        if (
            state.before.length === 0 &&
            state.instead.length === 0 &&
            state.after.length === 0
        ) {
            // Remove patch if possible
            if (namespace[methodname] as any === state.patchedCmp) {
                // Great, we're still the top-level patch, so it's safe to remove ourselves.
                gcPatch(namespace, methodname);

            } else {
                // This signifies to the patch executor that it doesn't
                // need to iterate thus saving a bit of performance here
                delete state.before;
                delete state.instead;
                delete state.after;
            }
        }
    }
}

function injectPatch<O, K extends keyof O>(target: O & PatchedModule, methodname: K & string): Function {
    return target[methodname] = (function patchRunner() {
        const state = target?.__tlib_patch?.[methodname];
        if (!state) {
            // Patch got GC'd, but we're still here.
            // This is fine, as it usually just means
            //   that we went through a reload, and this
            //   injected instance is a hanging artifact.
            return;
        }

        let returnValue;
        const { original: originalMethod } = state;

        if (state.before) {
            for (const fn of state.before)  returnValue = fn.patch({ originalMethod, arguments: arguments as any, returnValue }) ?? returnValue;
            for (const fn of state.instead) returnValue = fn.patch({ originalMethod, arguments: arguments as any, returnValue }) ?? returnValue;
            if  (state.instead.length == 0) returnValue = originalMethod(...arguments) ?? returnValue;

            for (const fn of state.after)   returnValue = fn.patch({ originalMethod, arguments: arguments as any, returnValue }) ?? returnValue;

            return returnValue;
        } else {
            // The patch has been deactivated, but it's not safe to fully unpatch, so we have to proxy for now...
            returnValue = originalMethod(...arguments);

            // Maybe we can finally fully unpatch??
            if (target[methodname] as any === state.patchedCmp) {
                gcPatch(target, methodname);
            }

            return returnValue;
        }
    }) as any;
}

function ensurePatchReady<O, K extends keyof O>(namespace: O, methodname: K & string): O & PatchedModule {
    let target: O & PatchedModule = namespace as any;
    if (!isPatchedModule(namespace)) {
        (namespace as any).__tlib_patch = {};
    }

    const mdata = target.__tlib_patch[methodname];
    if (!mdata) {
        const original = target[methodname];
        if (typeof original != "function") {
            throw new Error("Trying to patch type of " + typeof original);
        }

        target.__tlib_patch[methodname] = {
            original: original,
            patchedCmp: injectPatch(target, methodname),
            before: [], instead: [], after: []
        }
    } else if (!mdata.before) {
        // Previously half GC'd patch
        mdata.before = [];
        mdata.instead = [];
        mdata.after = [];
    }

    return namespace as O & PatchedModule;
}

// Flexible method patcher which shouldn't conflict with any other patching utility
export function flexpatch<O, K extends ExtractPropertyNamesOfType<O, Function>, F extends GenericFunction>(
    namespace: O,
    methodname: K & string,
    patchdata: PatchData<F>
): CancelFlexPatch {
    if (!namespace[methodname]) {
        throw new Error("Method `" + methodname + "` does not exist on object");
    }

    // Make an id for this patch so we can know how to remove it later
    const id = uuidv4();

    // Make sure that the target has the necessary __tlib_patch, and insert the patch runner if necessary
    const target = ensurePatchReady(namespace, methodname);
    const mdata = target.__tlib_patch[methodname];

    const patchCanceller = generateCancel(namespace, methodname, id);
    const insertPatch: (arr: MethodPatch[], p: PatchFunction<F>) => void = (arr, patch) => {
        const priority = patchdata.priority ?? 0;

        let idx = 0;
        while (arr[idx]?.priority <= priority) {
            idx += 1;
        }

        arr.splice(idx, 0, { id, patch, priority, cancel: patchCanceller });
    };

    patchdata.before  && insertPatch(mdata.before,  patchdata.before);
    patchdata.instead && insertPatch(mdata.instead, patchdata.instead);
    patchdata.after   && insertPatch(mdata.after,   patchdata.after);

    return patchCanceller;
}
