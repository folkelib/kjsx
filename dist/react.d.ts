/// <reference types="knockout" />
declare global  {
    namespace JSX {
        type KnockoutMaybeObservable<T> = KnockoutObservable<T> | T;
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
        }
        interface InputElement extends IntrinsicElement {
            textInput?: KnockoutObservable<string>;
            type: "text" | "password" | "hidden";
        }
        interface LinkElement extends IntrinsicElement {
            href?: string;
        }
        interface IntrinsicElements {
            div: IntrinsicElement;
            span: IntrinsicElement;
            button: ButtonElement;
            input: InputElement;
            a: LinkElement;
            ul: IntrinsicElement;
            li: IntrinsicElement;
            h1: IntrinsicElement;
            table: IntrinsicElement;
            tr: IntrinsicElement;
            td: IntrinsicElement;
            th: IntrinsicElement;
        }
        interface ElementClass extends ElementAttributesProperty {
            children?: any;
            render(): HTMLElement | KnockoutObservableArray<HTMLElement>;
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
export declare function ko_ifdef<T>(condition: () => T | undefined, childFactory: (value: T) => HTMLElement): KnockoutObservableArray<HTMLElement>;
export declare function ko_if(condition: () => boolean, childFactory: () => HTMLElement): KnockoutObservableArray<HTMLElement>;
export declare type Children = JSX.Child[];
export declare const React: {
    appendChild: (flatten: KnockoutObservableArray<Node>, child: string | number | HTMLElement | KnockoutObservable<string> | KnockoutObservableArray<Node> | (() => number) | HTMLElement[] | undefined, index: KnockoutObservable<number>) => KnockoutObservable<number>;
    appendChildren: (element: HTMLElement, children: (string | number | HTMLElement | KnockoutObservable<string> | KnockoutObservableArray<Node> | (() => number) | HTMLElement[] | undefined)[]) => void;
    createElement<T extends {
        [attribute: string]: any;
    }>(elementType: string | (new () => JSX.ElementClass), attributes: T, ...children: (string | number | HTMLElement | KnockoutObservable<string> | KnockoutObservableArray<Node> | (() => number) | HTMLElement[] | undefined)[]): HTMLElement | KnockoutObservableArray<HTMLElement>;
};
export * from "./knockout-projection";
