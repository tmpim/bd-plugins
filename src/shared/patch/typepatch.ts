import { CancelFlexPatch, flexpatch } from "./flexpatch";

export type CTree = {
    props: Record<string, unknown> & {
        children?: CTree | CTree[]
    }
}

export function findChildrenBy(root: CTree, cb: (props: CTree["props"]) => boolean): CTree | null {
    if (!root?.props) return null;

    if (cb(root.props)) {
        return root;
    }

    if (Array.isArray(root.props.children)) {
        for (const c of root.props.children) {
            const rc = findChildrenBy(c, cb);
            if (rc) return rc;
        }
    } else if (root.props.children) {
        return findChildrenBy(root.props.children, cb);
    }

    return null;
}

export function processComponentType(
    module: { default: GenericFunction },
    cb: (props: Record<string, unknown>, node: React.ReactNode) => void
): CancelFlexPatch {
    return flexpatch(module, "default", {
        after(data) {
            const inst = data.returnValue as {
                props: Record<string, unknown>
                type: React.ComponentClass
            };

            const otype = inst.type;
            inst.type = class ModuleProcessor extends otype {
                render() {
                    const rvalue = super.render();
                    // console.log("repurposing", rvalue);
                    // console.log("tfind", );
                    cb(inst.props, rvalue);

                    return rvalue;
                }
            };

            // props.children.props.children[""0""].props.children[""0""].props.children

            for (const extra in otype) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (inst.type as any)[extra] = (otype as any)[extra];
            }
        }
    });
}
