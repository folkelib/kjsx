/// <reference types="knockout" />
export interface MappingOptions<T> {
    disposeItem?: (item: T) => void;
    mapping?: (item: T, index: KnockoutObservable<number>) => T;
    mappingWithDisposeCallback?: (item: T, index: KnockoutObservable<number>) => {
        mappedValue: T;
        dispose: () => void;
    };
}
export declare function map<T>(inputObservableArray: KnockoutObservableArray<T>, mappingOptions: MappingOptions<T> | ((item: T, index: KnockoutObservable<number>) => T)): KnockoutComputed<T[]>;
export declare function filter<T>(array: KnockoutObservableArray<T>, predicate: (value: T) => boolean): KnockoutComputed<T[]>;
