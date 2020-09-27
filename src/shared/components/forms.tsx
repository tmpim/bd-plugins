import React from "@shared/base/discordreact";
import { objectWithoutProperties } from "@shared/util/objutils";
import { Margins } from "@shared/styles/discordclasses";

export const Slider = BdApi.findModuleByDisplayName("Slider");

enum FlexDirection { VERTICAL, HORIZONTAL, HORIZONTAL_REVERSE }
enum FlexJustify { START, END, CENTER, BETWEEN, AROUND }
enum FlexAlign { START, END, CENTER, STRETCH, BASELINE }
enum FlexWrap { NO_WRAP, WRAP, WRAP_REVERSE }

interface FlexProperties {
    Direction: typeof FlexDirection
    Justify: typeof FlexJustify
    Align: typeof FlexAlign
    Child: React.FC<{
        wrap?: boolean
        basis?: string
        grow?: number
        shrink?: number
    }>
}

export const Flex: React.FC<{
    // children: React.ReactNode[];
    direction?: FlexDirection
    className?: string;
    justify?: FlexJustify
    align?: FlexAlign
    wrap?: FlexWrap
    shrink?: number
    grow?: number
    basis?: string
}> & FlexProperties = BdApi.findModuleByDisplayName("Flex");


export type FormTags = {
    H1: "h1"
    H2: "h2"
    H3: "h3"
    H4: "h4"
    H5: "h5"
    LABEL: "label"
};

// TODO: Type these
const formComponents: {
    FormText: React.FC<{
        tag?: FormTags[keyof FormTags],
        className?: string,
        align?: "left" | "center" | "right"
        disabled?: boolean
        style?: Partial<CSSStyleDeclaration>
    }>
    FormTitle: React.FC<{
        className?: string
        disabled?: boolean
        required?: boolean
        tag?: FormTags[keyof FormTags]
        faded?: boolean
        error?: React.ReactNode
    }>
    FormSection: unknown
    FormItem: unknown
    FormNotice: unknown
    FormNoticeImagePositions: unknown
    FormNoticeTypes: unknown
    FormTextTypes: unknown
    FormTitleTags: unknown
    FormDivider: React.FC<{ className?: string }>
} = BdApi.findModuleByProps("FormSection", "FormText");
export const FormDivider = formComponents.FormDivider;

export const FormText = formComponents.FormText;


/*
type: "SELECT" | "SLIDER" | "SWITCH" | "TEXTINPUT"
*/

const NativeSelect = BdApi.findModuleByDisplayName("SelectTempWrapper");
const NativeText = BdApi.findModuleByDisplayName("TextInput");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NativeButton: any = BdApi.findModuleByProps("Colors", "Hovers", "Looks");
const NativeSlider = BdApi.findModuleByDisplayName("Slider");
const NativeSwitch = BdApi.findModuleByDisplayName("Switch");

/*
var d = function(e) {
    return e.toFixed(0) + "%"
}
*/
// export const SliderContainer = React.forwardRef<unknown, {
//     initialValue: number
//     minValue: number
//     maxValue: number
//     onValueChange: (x: number) => void
//     asValueChanges: (x: number) => void
//     onValueRender: (x: number) => React.ReactNode
// }>(function(props, ref) {
//     const innerRef = React.useRef(null);
//     React.useImperativeHandle(ref, (function() {
//         return {
//             focus: function() {
//                 var e;
//                 return null === (e = innerRef.current) || void 0 === e ? void 0 : e.focus()
//             },
//             blur: function() {
//                 var e;
//                 return null === (e = innerRef.current) || void 0 === e ? void 0 : e.blur()
//             },
//             activate: function() {
//                 return !1
//             }
//         }
//     }
//     ), []);

//     return (<div className={discordClassNames.menuslidercontainer}>
//         <NativeSlider
//             ref={innerRef}
//             handleSize={16}
//             className={discordClassNames.menuslider}
//             initialValue={props.initialValue}
//             minValue={props.minValue}
//             maxValue={props.maxValue}
//             onValueChange={props.onValueChange}
//             asValueChanges={props.asValueChanges}
//             onValueRender={(e: number) => e.toFixed(0) + "%"}
//             orientation="horizontal"
//         />
//     </div>);
// });



export const PanelFormItem: React.FC<{
    label: string
    basis?: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    childProps?: any // TODO: Specialize this
    disabled?: boolean
    className?: string
    titleClassName?: string
    tag?: FormTags[keyof FormTags]
    required?: boolean
    title?: string
    error?: React.ReactNode
} & (
    {
        type: "Button"
    } |
    {
        type: "Select"
        options: {label: string, value: string}[]
        value?: string
        clearable?: boolean
        searchable?: boolean
        onChange?: (x: {label: string, value: string}) => void
    } |
    {
        type: "Slider"
        minValue?: number
        maxValue?: number
        initialValue?: number
        onValueRender?: (x: number) => string;
        onChange?: (x: number) => void
    } |
    {
        type: "Switch"
        value?: boolean
        onChange?: (x: boolean) => void
    } |
    {
        type: "TextInput"
        min?: number
        max?: number
        value?: string | number
        onChange?: (x: string) => void
    } |
    {
        type: "File"
        value?: string
        buttonProps?: Record<string, unknown>
        filter?: Electron.FileFilter[]
        onChange?: (x: string) => void
    }
)> = function(props) {
    const selectFile = async () => {
        // const dummy = document.createElement("input");
        // dummy.type = "input";
        // dummy.hidden = true;
        // document.body.appendChild(dummy);
        // dummy.click();
        if (props.type == "File") {
            const { remote } = await import("electron");
            const data = await remote.dialog.showOpenDialog({ properties: ["openFile"], filters: props.filter });
            if (!data.canceled && data.filePaths[0]) {
                const path = data.filePaths[0];
                props.onChange?.(path);
            }
        }
    };

    let control;
    switch (props.type) {
    case "Select":
        control = <NativeSelect {...props.childProps} {...objectWithoutProperties(props, ["type"])}/>;
        break;
    case "Switch":
        control =
            (<Flex direction={Flex.Direction.HORIZONTAL_REVERSE}>
                <NativeSwitch {...props.childProps} {...objectWithoutProperties(props, ["type"])}/>
            </Flex>);
        break;
    case "Slider":
        control = <NativeSlider {...props.childProps} {...objectWithoutProperties(props, ["type"])}
            onValueChange={props.onChange}>{props.children}</NativeSlider>;
        break;
    case "TextInput":
        control = <NativeText {...props.childProps} {...objectWithoutProperties(props, ["type"])}/>;
        break;
    case "File":
        control = (<Flex>
            <Flex.Child>
                <div>
                    <NativeText {...props.childProps} {...objectWithoutProperties(props, ["type"])}/>
                </div>
            </Flex.Child>
            <NativeButton onClick={selectFile}
                look={NativeButton.Looks.FILLED} {...props.buttonProps}
                disabled={props.disabled}>Browse File</NativeButton>
        </Flex>);
        break;
    default:
        console.error("Invalid control type", props.type);
    }

    return (
        <Flex className={Margins.marginBottom8} align={Flex.Align.CENTER} direction={Flex.Direction.HORIZONTAL} grow={1}>
            <Flex.Child>
                <FormText disabled={props.disabled}>{props.label}</FormText>
            </Flex.Child>
            <Flex.Child basis={props.basis}>
                <div>
                    {control}
                </div>
            </Flex.Child>
        </Flex>
    );
};

export const FormTitle = formComponents.FormTitle;

// TODO: Type the rest of these
export const FormItem: unknown = formComponents.FormItem;
export const FormNotice: unknown = formComponents.FormNotice;
export const FormNoticeImagePositions: unknown = formComponents.FormNoticeImagePositions;
export const FormNoticeTypes: unknown = formComponents.FormNoticeTypes;
export const FormSection: unknown = formComponents.FormSection;
export const FormTextTypes: unknown = formComponents.FormTextTypes;
export const FormTitleTags: unknown = formComponents.FormTitleTags;
