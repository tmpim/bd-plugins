import uuidv4 from "@shared/util/uuid";

export interface PatchCallData<F extends GenericFunction> {
    thisValue: unknown,
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

interface MethodPatch<F extends GenericFunction> {
    id: string
    priority: number
    patch: PatchFunction<F>
    cancel: CancelFlexPatch
}

interface PatchedModule {
    __tlib_patch: {
        [methodname: string]: {
            original: GenericFunction
            patchedCmp: () => void
            before: MethodPatch<(...args: unknown[]) => unknown>[]
            instead: MethodPatch<(...args: unknown[]) => unknown>[]
            after: MethodPatch<(...args: unknown[]) => unknown>[]
        }
    }
}

function isPatchedModule(obj: unknown): obj is PatchedModule {
    if (typeof obj == "object") {
        return (obj as PatchedModule).__tlib_patch !== undefined;
    }

    return false;
}

function gcPatch<O extends Record<string, GenericFunction>>(namespace: O & PatchedModule, methodname: keyof O) {
    const state = namespace.__tlib_patch[methodname as string];
    namespace[methodname] = state.original as (O & PatchedModule)[keyof O];
    delete namespace.__tlib_patch[methodname as string];

    if (Object.keys(namespace.__tlib_patch).length === 0) {
        // We're fully done here, lets wrap this up
        delete namespace.__tlib_patch;
    }
}

function generateCancel<O extends Record<string, GenericFunction>>(namespace: O, methodname: keyof O & string, pid: string): CancelFlexPatch {
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
            if (namespace[methodname] === state.patchedCmp) {
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
    };
}

function injectPatch<O extends Record<string, GenericFunction>, K extends keyof O>(target: O & PatchedModule, methodname: K): GenericFunction {
    const ijOriginal = target[methodname];
    target[methodname] = (function patchRunner(...args: any[]) {
        const state = target?.__tlib_patch?.[methodname as string];
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
            for (const fn of state.before)  returnValue = fn.patch({ originalMethod, thisValue: this, arguments: args, returnValue }) ?? returnValue;
            for (const fn of state.instead) returnValue = fn.patch({ originalMethod, thisValue: this, arguments: args, returnValue }) ?? returnValue;
            if  (state.instead.length == 0) returnValue = originalMethod.call(this, ...args) ?? returnValue;

            for (const fn of state.after)   returnValue = fn.patch({ originalMethod, thisValue: this, arguments: args, returnValue }) ?? returnValue;

            return returnValue;
        } else {
            // The patch has been deactivated, but it's not safe to fully unpatch, so we have to proxy for now...
            returnValue = originalMethod(...args);

            // Maybe we can finally fully unpatch??
            if (target[methodname] === state.patchedCmp) {
                gcPatch(target, methodname);
            }

            return returnValue;
        }
    }) as (O & PatchedModule)[K];

    // Copy over any function props
    for (const propName in ijOriginal) {
        if (Object.prototype.hasOwnProperty.call(ijOriginal, propName)) {
            target[methodname][propName] = ijOriginal[propName];
        }
    }

    // Copy prototype
    target[methodname].prototype = ijOriginal.prototype;

    return target[methodname];
}

function ensurePatchReady<O extends Record<string, GenericFunction>, K extends keyof O>(namespace: O, methodname: K & string): O & PatchedModule {
    if (!isPatchedModule(namespace)) {
        (namespace as unknown as PatchedModule).__tlib_patch = {};
    }
    const target = namespace as O & PatchedModule;

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
        };
    } else if (!mdata.before) {
        // Previously half GC'd patch
        mdata.before = [];
        mdata.instead = [];
        mdata.after = [];
    }

    return namespace as O & PatchedModule;
}

// Flexible method patcher which shouldn't conflict with any other patching utility
export function flexpatch<O, K extends ExtractPropertyNamesOfType<O, GenericFunction>, F extends GenericFunction>(
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
    const nstarget = namespace as unknown as Record<string, GenericFunction>;
    const target = ensurePatchReady(nstarget, methodname);
    const mdata = target.__tlib_patch[methodname];

    const patchCanceller = generateCancel(nstarget, methodname, id);
    const insertPatch: (arr: MethodPatch<F>[], p: PatchFunction<F>) => void = (arr, patch) => {
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
