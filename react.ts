import * as ko from "knockout";

declare global {
    namespace JSX {
        type KnockoutMaybeObservable<T> = KnockoutObservable<T> | T;

        interface ElementAttributesProperty {
            props: any;
        }

        interface IntrinsicElement {
            visible?: KnockoutMaybeObservable<boolean>;
            text?: KnockoutMaybeObservable<string>;
            html?: KnockoutMaybeObservable<string>;
            css?: KnockoutMaybeObservable<string> | {[css: string]: KnockoutMaybeObservable<boolean>};
            style?: {[css: string]: KnockoutMaybeObservable<string>};
            attr?: {[key: string]: KnockoutMaybeObservable<string>};
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
            render(): HTMLElement|KnockoutObservableArray<HTMLElement>;
        }

        type Element = HTMLElement;

        type Child = (string|number|undefined|HTMLElement|KnockoutObservable<string>|KnockoutObservableArray<Node>|(() => number)|HTMLElement[]);
    }
}

function isObservableArray<T>(x: any): x is KnockoutObservableArray<T> {
    return x.destroyAll !== undefined;
}

const fakeBindingContext: KnockoutBindingContext = {
    $component: {},
    $componentTemplateNodes: [],
    $data: {},
    $index: ko.observable(0),
    $parent: {},
    $parentContext: undefined,
    $parents: [],
    $rawData: {},
    $root: {},
    createChildContext: () => undefined,
    extend: () => null,
};

interface Change<T> {
    status: "added" | "deleted";
    index: number;
    value: T;
}

function appendChild(flatten: KnockoutObservableArray<Node>, child: JSX.Child, index: KnockoutObservable<number>) {
    let ret: KnockoutObservable<number>;
    if (typeof child === "string") {
        flatten.push(document.createTextNode(child));
        ret = ko.pureComputed(() => index() + 1);
    } else if (typeof child === "number" ) {
        flatten.push(document.createTextNode(child.toString()));
        ret = ko.pureComputed(() => index() + 1);
    } else if (child instanceof Node) {
        flatten.push(child);
        ret = ko.pureComputed(() => index() + 1);
    } else if (child === undefined) {
        flatten.push(document.createTextNode("undefined"));
        ret = ko.pureComputed(() => index() + 1);
    } else if (isObservableArray<any>(child)) {
        const startingValue = child();
        for (const sub of startingValue) {
            flatten.push(sub);
        }

        const onChanges: any = (changes: Array<Change<Node>>) => {
            const startIndex = index();
            for (const change of changes) {
                if (change.status === "added") {
                    if (startIndex + change.index === flatten.length) {
                        flatten.push(change.value);
                    } else {
                        flatten.splice(startIndex + change.index, 0, change.value);
                    }
                } else if (change.status === "deleted") {
                    flatten.splice(startIndex + change.index, 1);
                }
            }
        };

        child.subscribe(onChanges, null, "arrayChange");
        ret = ko.pureComputed(() => index() + child().length);
    } else if (ko.isObservable(child)) {
        const textNode = document.createTextNode(child());
        child.subscribe(newValue => textNode.nodeValue = newValue);
        flatten.push(textNode);
        ret = ko.pureComputed(() => index() + 1);
    } else if (typeof child === "function") {
        const textNode = document.createTextNode(child().toString());
        const computed = ko.pureComputed(child);
        computed.subscribe(newValue => textNode.nodeValue = newValue.toString());
        ret = ko.pureComputed(() => index() + 1);
    } else if (Array.isArray(child)) {
        for (const element of child) {
            index = appendChild(flatten, element, index);
        }
        ret = index;
    } else {
        throw Error(`Unknown type ${typeof child} in appendChild`);
    }
    return ret;
}

function flattenArray(children: JSX.Child[]) {
    const flatten = ko.observableArray<Node>();
    let index: KnockoutObservable<number> = ko.observable(0);
    for (const child of children) {
        index = appendChild(flatten, child, index);
    }
    return flatten;
}

function appendChildren(element: HTMLElement, children: JSX.Child[]){
    const flatten = flattenArray(children);
    const onChanges: any = (changes: Change<Node>[]) => {
        for (const change of changes) {
            if (change.status === "added"){
                if (change.index === element.children.length) {
                    element.appendChild(change.value);
                }
                else {
                    element.insertBefore(change.value, element.children[change.index]);
                }
            }
            else if (change.status === "deleted"){
                element.removeChild(element.children[change.index]);
            }
        }
    };
    flatten.subscribe(onChanges, null, "arrayChange");
    for (const child of flatten()) {
        element.appendChild(child);
    }
}

export interface ForEachElementParameters<T> {
    table: KnockoutObservableArray<T>;
    children: (data: T) => HTMLElement;
}

interface Change<T> {
    status: "added" | "deleted";
    index: number;
    value: T;
}

export class ForEachT<T> implements JSX.ElementClass {
    public props: ForEachElementParameters<T>;

    public render(){
        return ko_foreach(this.props.table, this.props.children);
    }
}

export class ForEach extends ForEachT<any> {}

export function array_foreach<T>(table: Array<T> , childFactory: (data: T) => HTMLElement) {
    return table.map(childFactory);
}

export function ko_foreach<T>(table: KnockoutObservable<T[]> , childFactory: (data: T) => HTMLElement) {
    const array = ko.observableArray(table().map(childFactory));
    const onChanges: any = (changes: Array<Change<T>>) => {
        for (const change of changes) {
            if (change.status === "added"){
                const mapped = childFactory(change.value);
                if (change.index === array().length) {
                    array.push(mapped);
                }
                else {
                    array.splice(change.index, 0, mapped);
                }
            }
            else if (change.status === "deleted"){
                array.splice(change.index, 1);
            }
        }
    };
    table.subscribe(onChanges, null, "arrayChange");
    return array;
}

export interface IfParameters {
    condition: () => boolean;
    child: () => HTMLElement;
}

export class If implements JSX.ElementClass {
    public props: IfParameters;

    public render(){
        return ko_if(this.props.condition, this.props.child);
    }
}

export function ko_ifdef<T>(condition: () => T | undefined, childFactory: (value: T) => HTMLElement) {
    const array = ko.observableArray< HTMLElement>();
    const current = condition();
    if (current !== undefined){
        array.push(childFactory(current));
    }
    const observableCondition = ko.isSubscribable(condition) ?
        condition : ko.computed(condition);
    observableCondition.subscribe((newValue) => {
        if (newValue !== undefined) {
            array.push(childFactory(newValue));
        }
        else{
            array.removeAll();
        }
    });
    return array;
}

export function ko_if(condition: () => boolean, childFactory: () => HTMLElement){
    const array = ko.observableArray< HTMLElement>();
    if (condition()){
        array.push(childFactory());
    }
    const observableCondition = ko.isSubscribable(condition) ?
        condition : ko.computed(condition);
    observableCondition.subscribe((newValue) => {
        if (newValue) {
            array.push(childFactory());
        }
        else{
            array.removeAll();
        }
    });
    return array;
}

export type Children = JSX.Child[];

function isJSXElement(x: any): x is JSX.ElementClass {
    return x.render !== undefined;
}

export const React = {
    appendChild,
    appendChildren,
    createElement<T extends {[attribute: string]: any}>(
        elementType: (new (props: T, children: JSX.Child[]) => JSX.ElementClass | HTMLElement) | string,
        attributes: T,
        ...children: JSX.Child[]) {
        if (typeof elementType === "string"){
            const element = document.createElement(elementType);

            appendChildren(element, children);

            let allBindingHandlers: KnockoutAllBindingsAccessor | undefined;

            for (const attribute in attributes) {
                if (attributes.hasOwnProperty(attribute)) {
                    const bindingHandler = ko.bindingHandlers[attribute];
                    if (bindingHandler){
                        if (allBindingHandlers == null) {
                            allBindingHandlers = (() => attributes) as KnockoutAllBindingsAccessor;
                            allBindingHandlers.get = (key) => attributes[key];
                            allBindingHandlers.has = (key) => attributes[key] !== undefined;
                        }

                        const value = attributes[attribute];
                        const valueAccessor = () => value;
                        if (bindingHandler.init) {
                            bindingHandler.init(element, valueAccessor, allBindingHandlers, null, fakeBindingContext);
                        }

                        const update = bindingHandler.update;
                        if (update) {
                            update(element, valueAccessor, allBindingHandlers, null, fakeBindingContext);
                            if (ko.isSubscribable(value)) {
                                value.subscribe((newValue) => update(element, valueAccessor, allBindingHandlers, null, fakeBindingContext));
                            } else {
                                for (const prop in value) {
                                    if (Object.prototype.hasOwnProperty.call(value, prop)) {
                                        const subValue = value[prop];
                                        if (ko.isSubscribable(subValue)) {
                                            subValue.subscribe((newValue) => update(element, valueAccessor, allBindingHandlers, null, fakeBindingContext));
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else{
                        const value = attributes[attribute];
                        if (ko.isObservable(value)) {
                            element.setAttribute(attribute as string, value());
                            value.subscribe(newValue => element.setAttribute(attribute as string, newValue));
                        }
                        else {
                            element.setAttribute(attribute as string, value);
                        }
                    }
                }
            }
            return element;
        }
        else {
            const customElement = new elementType(attributes || {}, children);
            if (isJSXElement(customElement)) {
                customElement.props = attributes || {};
                customElement.children = children;
                return customElement.render();
            }
            else {
                return customElement;
            }
        }
    },
};

export * from "./knockout-projection";