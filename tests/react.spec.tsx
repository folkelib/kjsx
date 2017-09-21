import test from 'ava';
import { React } from "../react";

test('Simple DIV', t => {
    const simple = <div>Bonjour</div>;
    t.is(simple.nodeName, "DIV");
    t.is(simple.innerHTML, "Bonjour");
});

class CustomReturnsDiv implements JSX.ElementClass {
    children?: any;
    render(): HTMLElement | KnockoutObservableArray<HTMLElement> {
        return <div>{ this.props.text }</div>;
    }
    props: { text: string };
}

test('Custom class that returns a DIV', t => {
    const value = <CustomReturnsDiv text="Test"></CustomReturnsDiv>;
    t.is(value.nodeName, "DIV");
    t.is(value.innerHTML, "Test");
});

function FunctionReturnsDiv(props: { text: string }) {
    return <div>{props.text}</div>;
}

test('Custom function that returns a DIV', t => {
    const value = <FunctionReturnsDiv text="Test" />;
    t.is(value.nodeName, "DIV");
    t.is(value.innerHTML, "Test");
});