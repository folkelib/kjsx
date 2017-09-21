"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var ko = require("knockout");
function isObservableArray(x) {
    return x.destroyAll !== undefined;
}
var fakeBindingContext = {
    $component: {},
    $componentTemplateNodes: [],
    $data: {},
    $index: ko.observable(0),
    $parent: {},
    $parentContext: undefined,
    $parents: [],
    $rawData: {},
    $root: {},
    createChildContext: function () { return undefined; },
    extend: function () { return null; },
};
function appendChild(flatten, child, index) {
    var ret;
    if (typeof child === "string") {
        flatten.push(document.createTextNode(child));
        ret = ko.pureComputed(function () { return index() + 1; });
    }
    else if (typeof child === "number") {
        flatten.push(document.createTextNode(child.toString()));
        ret = ko.pureComputed(function () { return index() + 1; });
    }
    else if (child instanceof Node) {
        flatten.push(child);
        ret = ko.pureComputed(function () { return index() + 1; });
    }
    else if (child === undefined) {
        flatten.push(document.createTextNode("undefined"));
        ret = ko.pureComputed(function () { return index() + 1; });
    }
    else if (isObservableArray(child)) {
        var startingValue = child();
        for (var _i = 0, startingValue_1 = startingValue; _i < startingValue_1.length; _i++) {
            var sub = startingValue_1[_i];
            flatten.push(sub);
        }
        var onChanges = function (changes) {
            var startIndex = index();
            for (var _i = 0, changes_1 = changes; _i < changes_1.length; _i++) {
                var change = changes_1[_i];
                if (change.status === "added") {
                    if (startIndex + change.index === flatten.length) {
                        flatten.push(change.value);
                    }
                    else {
                        flatten.splice(startIndex + change.index, 0, change.value);
                    }
                }
                else if (change.status === "deleted") {
                    flatten.splice(startIndex + change.index, 1);
                }
            }
        };
        child.subscribe(onChanges, null, "arrayChange");
        ret = ko.pureComputed(function () { return index() + child().length; });
    }
    else if (ko.isObservable(child)) {
        var textNode_1 = document.createTextNode(child());
        child.subscribe(function (newValue) { return textNode_1.nodeValue = newValue; });
        flatten.push(textNode_1);
        ret = ko.pureComputed(function () { return index() + 1; });
    }
    else if (typeof child === "function") {
        var textNode_2 = document.createTextNode(child().toString());
        var computed = ko.pureComputed(child);
        computed.subscribe(function (newValue) { return textNode_2.nodeValue = newValue.toString(); });
        ret = ko.pureComputed(function () { return index() + 1; });
    }
    else if (Array.isArray(child)) {
        for (var _a = 0, child_1 = child; _a < child_1.length; _a++) {
            var element = child_1[_a];
            index = appendChild(flatten, element, index);
        }
        ret = index;
    }
    else {
        throw Error("Unknown type " + typeof child + " in appendChild");
    }
    return ret;
}
function flattenArray(children) {
    var flatten = ko.observableArray();
    var index = ko.observable(0);
    for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
        var child = children_1[_i];
        index = appendChild(flatten, child, index);
    }
    return flatten;
}
function appendChildren(element, children) {
    var flatten = flattenArray(children);
    var onChanges = function (changes) {
        for (var _i = 0, changes_2 = changes; _i < changes_2.length; _i++) {
            var change = changes_2[_i];
            if (change.status === "added") {
                if (change.index === element.children.length) {
                    element.appendChild(change.value);
                }
                else {
                    element.insertBefore(change.value, element.children[change.index]);
                }
            }
            else if (change.status === "deleted") {
                element.removeChild(element.children[change.index]);
            }
        }
    };
    flatten.subscribe(onChanges, null, "arrayChange");
    for (var _i = 0, _a = flatten(); _i < _a.length; _i++) {
        var child = _a[_i];
        element.appendChild(child);
    }
}
var ForEachT = /** @class */ (function () {
    function ForEachT() {
    }
    ForEachT.prototype.render = function () {
        return ko_foreach(this.props.table, this.props.children);
    };
    return ForEachT;
}());
exports.ForEachT = ForEachT;
var ForEach = /** @class */ (function (_super) {
    __extends(ForEach, _super);
    function ForEach() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return ForEach;
}(ForEachT));
exports.ForEach = ForEach;
function array_foreach(table, childFactory) {
    return table.map(childFactory);
}
exports.array_foreach = array_foreach;
function ko_foreach(table, childFactory) {
    var array = ko.observableArray(table().map(childFactory));
    var onChanges = function (changes) {
        for (var _i = 0, changes_3 = changes; _i < changes_3.length; _i++) {
            var change = changes_3[_i];
            if (change.status === "added") {
                var mapped = childFactory(change.value);
                if (change.index === array().length) {
                    array.push(mapped);
                }
                else {
                    array.splice(change.index, 0, mapped);
                }
            }
            else if (change.status === "deleted") {
                array.splice(change.index, 1);
            }
        }
    };
    table.subscribe(onChanges, null, "arrayChange");
    return array;
}
exports.ko_foreach = ko_foreach;
var If = /** @class */ (function () {
    function If() {
    }
    If.prototype.render = function () {
        return ko_if(this.props.condition, this.props.child);
    };
    return If;
}());
exports.If = If;
function ko_ifdef(condition, childFactory) {
    var array = ko.observableArray();
    var current = condition();
    if (current !== undefined) {
        array.push(childFactory(current));
    }
    var observableCondition = ko.isSubscribable(condition) ?
        condition : ko.computed(condition);
    observableCondition.subscribe(function (newValue) {
        if (newValue !== undefined) {
            array.push(childFactory(newValue));
        }
        else {
            array.removeAll();
        }
    });
    return array;
}
exports.ko_ifdef = ko_ifdef;
function ko_if(condition, childFactory) {
    var array = ko.observableArray();
    if (condition()) {
        array.push(childFactory());
    }
    var observableCondition = ko.isSubscribable(condition) ?
        condition : ko.computed(condition);
    observableCondition.subscribe(function (newValue) {
        if (newValue) {
            array.push(childFactory());
        }
        else {
            array.removeAll();
        }
    });
    return array;
}
exports.ko_if = ko_if;
function isJSXElement(x) {
    return x.render !== undefined;
}
exports.React = {
    appendChild: appendChild,
    appendChildren: appendChildren,
    createElement: function (elementType, attributes) {
        var children = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            children[_i - 2] = arguments[_i];
        }
        if (typeof elementType === "string") {
            var element_1 = document.createElement(elementType);
            appendChildren(element_1, children);
            var allBindingHandlers_1;
            var _loop_1 = function (attribute) {
                if (attributes.hasOwnProperty(attribute)) {
                    var bindingHandler = ko.bindingHandlers[attribute];
                    if (bindingHandler) {
                        if (allBindingHandlers_1 == null) {
                            allBindingHandlers_1 = (function () { return attributes; });
                            allBindingHandlers_1.get = function (key) { return attributes[key]; };
                            allBindingHandlers_1.has = function (key) { return attributes[key] !== undefined; };
                        }
                        var value_1 = attributes[attribute];
                        var valueAccessor_1 = function () { return value_1; };
                        if (bindingHandler.init) {
                            bindingHandler.init(element_1, valueAccessor_1, allBindingHandlers_1, null, fakeBindingContext);
                        }
                        var update_1 = bindingHandler.update;
                        if (update_1) {
                            update_1(element_1, valueAccessor_1, allBindingHandlers_1, null, fakeBindingContext);
                            if (ko.isSubscribable(value_1)) {
                                value_1.subscribe(function (newValue) { return update_1(element_1, valueAccessor_1, allBindingHandlers_1, null, fakeBindingContext); });
                            }
                            else {
                                for (var prop in value_1) {
                                    if (Object.prototype.hasOwnProperty.call(value_1, prop)) {
                                        var subValue = value_1[prop];
                                        if (ko.isSubscribable(subValue)) {
                                            subValue.subscribe(function (newValue) { return update_1(element_1, valueAccessor_1, allBindingHandlers_1, null, fakeBindingContext); });
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else {
                        var value = attributes[attribute];
                        if (ko.isObservable(value)) {
                            element_1.setAttribute(attribute, value());
                            value.subscribe(function (newValue) { return element_1.setAttribute(attribute, newValue); });
                        }
                        else {
                            element_1.setAttribute(attribute, value);
                        }
                    }
                }
            };
            for (var attribute in attributes) {
                _loop_1(attribute);
            }
            return element_1;
        }
        else {
            var customElement = new elementType(attributes || {}, children);
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
__export(require("./knockout-projection"));
