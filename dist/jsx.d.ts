/// <reference types="knockout" />
export declare type KnockoutMaybeObservable<T> = KnockoutObservable<T> | T;
export interface ElementAttributesProperty {
    props: any;
}
export interface IntrinsicElement {
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
export interface ButtonElement extends IntrinsicElement {
    type?: "submit" | "button";
}
export interface InputElement extends IntrinsicElement {
    textInput?: KnockoutObservable<string>;
    type: "text" | "password" | "hidden";
}
export interface LinkElement extends IntrinsicElement {
    href?: string;
}
export interface ImageElement extends IntrinsicElement {
    alt?: KnockoutMaybeObservable<string>;
    width?: KnockoutMaybeObservable<number>;
    height?: KnockoutMaybeObservable<number>;
    src: KnockoutMaybeObservable<string>;
}
export interface IntrinsicElements {
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
    img: ImageElement;
}
export interface ElementClass extends ElementAttributesProperty {
    children?: any;
    render(): HTMLElement | KnockoutObservableArray<HTMLElement>;
}
export declare type Element = HTMLElement;
export declare type Child = (string | number | undefined | HTMLElement | KnockoutObservable<string> | KnockoutObservableArray<Node> | (() => number) | HTMLElement[]);
