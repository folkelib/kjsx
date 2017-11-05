/// <reference types="knockout" />
declare global  {
    namespace JSX {
        type KnockoutMaybeObservable<T> = KnockoutObservable<T> | T;
        type RenderOutput = HTMLElement | KnockoutObservableArray<HTMLElement>;
        interface ElementAttributesProperty {
            props: any;
        }
        interface IntrinsicElement {
            visible?: KnockoutMaybeObservable<boolean>;
            text?: KnockoutMaybeObservable<string>;
            html?: KnockoutMaybeObservable<string>;
            css?: KnockoutMaybeObservable<string> | {
                [css: string]: KnockoutMaybeObservable<boolean>;
            };
            style?: {
                [css: string]: KnockoutMaybeObservable<string>;
            };
            attr?: {
                [key: string]: KnockoutMaybeObservable<string>;
            };
            click?: () => void;
            class?: string;
            role?: string;
        }
        interface ButtonElement extends IntrinsicElement {
            type?: "submit" | "button";
            enable?: KnockoutMaybeObservable<boolean>;
        }
        interface InputElement extends IntrinsicElement {
            textInput?: KnockoutObservable<string | number>;
            type: "text" | "password" | "hidden" | "checkbox" | "password" | "submit";
            placeholder?: KnockoutMaybeObservable<string>;
            disabled?: "disabled";
            checked?: KnockoutMaybeObservable<boolean>;
            enable?: KnockoutObservable<boolean>;
        }
        interface LinkElement extends IntrinsicElement {
            href?: KnockoutMaybeObservable<string>;
        }
        interface SelectElement extends IntrinsicElement {
            options: KnockoutObservableArray<string>;
            value: KnockoutObservable<string>;
        }
        interface TextAreaElement extends IntrinsicElement {
            textInput: KnockoutObservable<string>;
            placeholder?: string;
            rows?: number;
        }
        interface FormElement extends IntrinsicElement {
            submit?: () => void;
        }
        interface ImageElement extends IntrinsicElement {
            alt?: KnockoutMaybeObservable<string>;
            width?: KnockoutMaybeObservable<number>;
            height?: KnockoutMaybeObservable<number>;
            src: KnockoutMaybeObservable<string>;
        }
        interface IntrinsicElements {
            div: IntrinsicElement;
            span: IntrinsicElement;
            button: ButtonElement;
            input: InputElement;
            a: LinkElement;
            i: IntrinsicElement;
            ul: IntrinsicElement;
            li: IntrinsicElement;
            h1: IntrinsicElement;
            h2: IntrinsicElement;
            h3: IntrinsicElement;
            h4: IntrinsicElement;
            h5: IntrinsicElement;
            table: IntrinsicElement;
            thead: IntrinsicElement;
            tbody: IntrinsicElement;
            tr: IntrinsicElement;
            td: IntrinsicElement;
            th: IntrinsicElement;
            p: IntrinsicElement;
            label: IntrinsicElement;
            select: SelectElement;
            textarea: TextAreaElement;
            section: IntrinsicElement;
            header: IntrinsicElement;
            footer: IntrinsicElement;
            form: FormElement;
            fieldset: IntrinsicElement;
            img: ImageElement;
            dl: IntrinsicElement;
            dd: IntrinsicElement;
            dt: IntrinsicElement;
        }
        interface ElementClass extends ElementAttributesProperty {
            children?: any;
            render(): RenderOutput;
        }
        type Element = HTMLElement;
        type Child = (string | number | undefined | HTMLElement | KnockoutObservable<string> | KnockoutObservableArray<Node> | (() => number) | HTMLElement[]);
    }
}
export interface ForEachElementParameters<T> {
    table: KnockoutObservableArray<T>;
    children: (data: T) => HTMLElement;
}
export declare class ForEachT<T> implements JSX.ElementClass {
    props: ForEachElementParameters<T>;
    render(): KnockoutObservableArray<HTMLElement>;
}
export declare class ForEach extends ForEachT<any> {
}
export declare function array_foreach<T>(table: Array<T>, childFactory: (data: T) => HTMLElement): HTMLElement[];
export declare function ko_foreach<T>(table: KnockoutObservable<T[]>, childFactory: (data: T) => HTMLElement): KnockoutObservableArray<HTMLElement>;
export interface IfParameters {
    condition: () => boolean;
    child: () => HTMLElement;
}
export declare class If implements JSX.ElementClass {
    props: IfParameters;
    render(): KnockoutObservableArray<HTMLElement>;
}
export declare function ko_ifdef<T>(condition: KnockoutObservable<T>, childFactory: (value: T) => HTMLElement): KnockoutObservableArray<HTMLElement>;
export declare function ko_if(condition: () => boolean, childFactory: () => HTMLElement): KnockoutObservableArray<HTMLElement>;
export declare function ko_ifnot(condition: () => boolean, childFactory: () => HTMLElement): KnockoutObservableArray<HTMLElement>;
export declare type Children = JSX.Child[];
export declare const React: {
    appendChild: (flatten: KnockoutObservableArray<Node>, child: string | number | HTMLElement | KnockoutObservable<string> | KnockoutObservableArray<Node> | (() => number) | HTMLElement[] | undefined, index: KnockoutObservable<number>) => KnockoutObservable<number>;
    appendChildren: (element: HTMLElement, children: (string | number | HTMLElement | KnockoutObservable<string> | KnockoutObservableArray<Node> | (() => number) | HTMLElement[] | undefined)[]) => void;
    createElement<T extends {
        [attribute: string]: any;
    }>(elementType: string | (new (props: T, children: (string | number | HTMLElement | KnockoutObservable<string> | KnockoutObservableArray<Node> | (() => number) | HTMLElement[] | undefined)[]) => HTMLElement | JSX.ElementClass), attributes: T, ...children: (string | number | HTMLElement | KnockoutObservable<string> | KnockoutObservableArray<Node> | (() => number) | HTMLElement[] | undefined)[]): JSX.RenderOutput;
};
export declare function init(root: JSX.RenderOutput, elementTagName: string): void;
export * from "./knockout-projection";
