/* -----------------------------------------------------------------------------
Copyright (c) Microsoft Corporation
All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
THIS CODE IS PROVIDED *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE, MERCHANTABLITY OR NON-INFRINGEMENT.
See the Apache Version 2.0 License for specific language governing permissions and limitations under the License.
------------------------------------------------------------------------------
*/

import * as ko from "knockout";

const exclusionMarker = {};

export interface MappingOptions<T> {
    disposeItem?: (item: T) => void;
    mapping?: (item: T, index: KnockoutObservable<number>) => T;
    mappingWithDisposeCallback?: (item: T, index: KnockoutObservable<number>) => { mappedValue: T, dispose: () => void; };
}

class StateItem<T> {
    public isIncluded: boolean | null;
    public mappedValueComputed: KnockoutComputed<any>;
    public outputArrayIndex: KnockoutObservable<number>;
    private previousMappedValue: any;
    private disposeFuncFromMostRecentMapping: (() => void) | null;
    private suppressNotification: boolean;
    private outputArray: (T|null)[];

    constructor(private inputItem: T, public stateArrayIndex: number, initialOutputArrayIndex: number, private mappingOptions: MappingOptions<T>, private arrayOfState: StateItem<T>[], private outputObservableArray: KnockoutObservableArray<T>) {
        // Capture state for later use
        this.outputArray = this.outputObservableArray.peek();
        this.isIncluded = null; // Means 'not yet determined'
        this.suppressNotification = false; // TODO: Instead of this technique, consider raising a sparse diff with a "mutated" entry when a single item changes, and not having any other change logic inside StateItem

        // Set up observables
        this.outputArrayIndex = ko.observable(initialOutputArrayIndex); // When excluded, it's the position the item would go if it became included
        this.disposeFuncFromMostRecentMapping = null;
        this.mappedValueComputed = ko.computed(this.mappingEvaluator, this);
        this.mappedValueComputed.subscribe(this.onMappingResultChanged, this);
        this.previousMappedValue = this.mappedValueComputed.peek();
    }

    public dispose() {
        this.mappedValueComputed.dispose();
        this.disposeResultFromMostRecentEvaluation();
    }

    public setOutputArrayIndexSilently(newIndex: number) {
        // We only want to raise one output array notification per input array change,
        // so during processing, we suppress notifications
        this.suppressNotification = true;
        this.outputArrayIndex(newIndex);
        this.suppressNotification = false;
    }

    private disposeResultFromMostRecentEvaluation() {
        if (this.disposeFuncFromMostRecentMapping) {
            this.disposeFuncFromMostRecentMapping();
            this.disposeFuncFromMostRecentMapping = null;
        }

        if (this.mappingOptions.disposeItem) {
            const mappedItem = this.mappedValueComputed();
            this.mappingOptions.disposeItem(mappedItem);
        }
    }

    private mappingEvaluator() {
        if (this.isIncluded !== null) { // i.e., not first run
            // This is a replace-in-place, so call any dispose callbacks
            // we have for the earlier value
            this.disposeResultFromMostRecentEvaluation();
        }

        let mappedValue: T;
        if (this.mappingOptions.mapping) {
            mappedValue = this.mappingOptions.mapping(this.inputItem, this.outputArrayIndex);
        } else if (this.mappingOptions.mappingWithDisposeCallback) {
            const mappedValueWithDisposeCallback = this.mappingOptions.mappingWithDisposeCallback(this.inputItem, this.outputArrayIndex);
            if (!("mappedValue" in mappedValueWithDisposeCallback)) {
                throw new Error("Return value from mappingWithDisposeCallback should have a 'mappedItem' property.");
            }
            mappedValue = mappedValueWithDisposeCallback.mappedValue;
            this.disposeFuncFromMostRecentMapping = mappedValueWithDisposeCallback.dispose;
        } else {
            throw new Error("No mapping callback given.");
        }

        const newInclusionState = mappedValue !== exclusionMarker;

        // Inclusion state changes can *only* happen as a result of changing an individual item.
        // Structural changes to the array can't cause this (because they don't cause any remapping;
        // they only map newly added items which have no earlier inclusion state to change).
        if (this.isIncluded !== newInclusionState) {
            if (this.isIncluded !== null) { // i.e., not first run
                this.moveSubsequentItemsBecauseInclusionStateChanged(newInclusionState);
            }

            this.isIncluded = newInclusionState;
        }

        return mappedValue;
    }

    private onMappingResultChanged(newValue: T) {
        if (newValue !== this.previousMappedValue) {
            if (this.isIncluded) {
                this.outputArray.splice(this.outputArrayIndex.peek(), 1, newValue);
            }

            if (!this.suppressNotification && this.outputObservableArray.valueHasMutated) {
                this.outputObservableArray.valueHasMutated();
            }

            this.previousMappedValue = newValue;
        }
    }

    private moveSubsequentItemsBecauseInclusionStateChanged(newInclusionState: boolean) {
        const outputArrayIndex = this.outputArrayIndex.peek();
        let iterationIndex: number;
        let stateItem: StateItem<T>;

        if (newInclusionState) {
            // Shift all subsequent items along by one space, and increment their indexes.
            // Note that changing their indexes might cause remapping, but won't affect their
            // inclusion status (by definition, inclusion status must not be affected by index,
            // otherwise you get undefined results) so there's no risk of a chain reaction.
            this.outputArray.splice(outputArrayIndex, 0, null);
            for (iterationIndex = this.stateArrayIndex + 1; iterationIndex < this.arrayOfState.length; iterationIndex++) {
                stateItem = this.arrayOfState[iterationIndex];
                stateItem.setOutputArrayIndexSilently(stateItem.outputArrayIndex.peek() + 1);
            }
        } else {
            // Shift all subsequent items back by one space, and decrement their indexes
            this.outputArray.splice(outputArrayIndex, 1);
            for (iterationIndex = this.stateArrayIndex + 1; iterationIndex < this.arrayOfState.length; iterationIndex++) {
                stateItem = this.arrayOfState[iterationIndex];
                stateItem.setOutputArrayIndexSilently(stateItem.outputArrayIndex.peek() - 1);
            }
        }
    }
}

type DiffEntry<T> = KnockoutArrayChange<T>;

function getDiffEntryPostOperationIndex<T>(diffEntry: DiffEntry<T>, editOffset: number) {
    // The diff algorithm's "index" value refers to the output array for additions,
    // but the "input" array for deletions. Get the output array position.
    if (!diffEntry) { return null; }
    switch (diffEntry.status) {
    case "added":
        return diffEntry.index;
    case "deleted":
        return diffEntry.index + editOffset;
    default:
        throw new Error("Unknown diff status: " + diffEntry.status);
    }
}

function insertOutputItem<T>(diffEntry: DiffEntry<T>, movedStateItems: ArrayLookup<StateItem<T>>, stateArrayIndex: number, outputArrayIndex: number, mappingOptions: MappingOptions<T>, arrayOfState: StateItem<T>[], outputObservableArray: KnockoutObservableArray<T>, outputArray: T[]) {
    // Retain the existing mapped value if this is a move, otherwise perform mapping
    const moved  = diffEntry.moved;
    const stateItem = typeof moved === "number" ?  movedStateItems[moved] :
            new StateItem(diffEntry.value, stateArrayIndex, outputArrayIndex, mappingOptions, arrayOfState, outputObservableArray);
    arrayOfState.splice(stateArrayIndex, 0, stateItem);
    if (stateItem.isIncluded) {
        outputArray.splice(outputArrayIndex, 0, stateItem.mappedValueComputed.peek());
    }

    // Update indexes
    if (typeof moved === "number") {
        // We don't change the index until *after* updating this item's position in outputObservableArray,
        // because changing the index may trigger re-mapping, which in turn would cause the new
        // value to be written to the 'index' position in the output array
        stateItem.stateArrayIndex = stateArrayIndex;
        stateItem.setOutputArrayIndexSilently(outputArrayIndex);
    }

    return stateItem;
}

function deleteOutputItem<T>(diffEntry: DiffEntry<T>, arrayOfState: StateItem<T>[], stateArrayIndex: number, outputArrayIndex: number, outputArray: T[]) {
    const stateItem = arrayOfState.splice(stateArrayIndex, 1)[0];
    if (stateItem.isIncluded) {
        outputArray.splice(outputArrayIndex, 1);
    }
    if (typeof diffEntry.moved !== "number") {
        // Be careful to dispose only if this item really was deleted and not moved
        stateItem.dispose();
    }
}

function updateRetainedOutputItem<T>(stateItem: StateItem<T>, stateArrayIndex: number, outputArrayIndex: number) {
    // Just have to update its indexes
    stateItem.stateArrayIndex = stateArrayIndex;
    stateItem.setOutputArrayIndexSilently(outputArrayIndex);

    // Return the new value for outputArrayIndex
    return outputArrayIndex + (stateItem.isIncluded ? 1 : 0);
}

type ArrayLookup<T> = {[key: number]: T};

function makeLookupOfMovedStateItems<T>(diff: DiffEntry<T>[], arrayOfState: StateItem<T>[]) {
    // Before we mutate arrayOfComputedMappedValues at all, grab a reference to each moved item
    const movedStateItems: ArrayLookup<StateItem<T>> = {};
    for (const diffEntry of diff) {
        if (diffEntry.status === "added" && (typeof diffEntry.moved === "number")) {
            movedStateItems[diffEntry.moved] = arrayOfState[diffEntry.moved];
        }
    }
    return movedStateItems;
}

function getFirstModifiedOutputIndex<T>(firstDiffEntry: DiffEntry<T>, arrayOfState: StateItem<T>[], outputArray: T[]) {
    // Work out where the first edit will affect the output array
    // Then we can update outputArrayIndex incrementally while walking the diff list
    if (!outputArray.length || !arrayOfState[firstDiffEntry.index]) {
        // The first edit is beyond the end of the output or state array, so we must
        // just be appending items.
        return outputArray.length;
    } else {
        // The first edit corresponds to an existing state array item, so grab
        // the first output array index from it.
        return arrayOfState[firstDiffEntry.index].outputArrayIndex.peek();
    }
}

function respondToArrayStructuralChanges<T>(inputObservableArray: KnockoutObservableArray<T>, arrayOfState: StateItem<T>[], outputArray: T[], outputObservableArray: KnockoutObservableArray<T>, mappingOptions: MappingOptions<T>) {
    return inputObservableArray.subscribe(diff => {
        if (!diff.length) {
            return;
        }

        const movedStateItems = makeLookupOfMovedStateItems(diff, arrayOfState);
        let diffIndex = 0;
        let diffEntry = diff[0];
        let editOffset = 0; // A running total of (num(items added) - num(items deleted)) not accounting for filtering
        let outputArrayIndex = diffEntry && getFirstModifiedOutputIndex(diffEntry, arrayOfState, outputArray);

        // Now iterate over the state array, at each stage checking whether the current item
        // is the next one to have been edited. We can skip all the state array items whose
        // indexes are less than the first edit index (i.e., diff[0].index).
        for (let stateArrayIndex = diffEntry.index; diffEntry || (stateArrayIndex < arrayOfState.length); stateArrayIndex++) {
            // Does the current diffEntry correspond to this position in the state array?
            if (getDiffEntryPostOperationIndex(diffEntry, editOffset) === stateArrayIndex) {
                // Yes - insert or delete the corresponding state and output items
                switch (diffEntry.status) {
                case "added":
                    // Add to output, and update indexes
                    const stateItem = insertOutputItem(diffEntry, movedStateItems, stateArrayIndex, outputArrayIndex, mappingOptions, arrayOfState, outputObservableArray, outputArray);
                    if (stateItem.isIncluded) {
                        outputArrayIndex++;
                    }
                    editOffset++;
                    break;
                case "deleted":
                    // Just erase from the output, and update indexes
                    deleteOutputItem(diffEntry, arrayOfState, stateArrayIndex, outputArrayIndex, outputArray);
                    editOffset--;
                    stateArrayIndex--; // To compensate for the "for" loop incrementing it
                    break;
                default:
                    throw new Error("Unknown diff status: " + diffEntry.status);
                }

                // We're done with this diff entry. Move on to the next one.
                diffIndex++;
                diffEntry = diff[diffIndex];
            } else if (stateArrayIndex < arrayOfState.length) {
                // No - the current item was retained. Just update its index.
                outputArrayIndex = updateRetainedOutputItem(arrayOfState[stateArrayIndex], stateArrayIndex, outputArrayIndex);
            }
        }

        if (outputObservableArray.valueHasMutated) {
            outputObservableArray.valueHasMutated();
        }
    }, null, "arrayChange");
}

// Mapping
export function map<T>(inputObservableArray: KnockoutObservableArray<T>, mappingOptions: MappingOptions<T> | ((item: T, index: KnockoutObservable<number>) => T)) {
    const arrayOfState: StateItem<T>[] = [];
    const outputArray: T[] = [];
    const outputObservableArray = ko.observableArray(outputArray);
    const originalInputArrayContents = inputObservableArray.peek();

    // Shorthand syntax - just pass a function instead of an options object
    if (typeof mappingOptions === "function") {
        mappingOptions = { mapping: mappingOptions };
    }

    // Validate the options
    if (mappingOptions.mappingWithDisposeCallback) {
        if (mappingOptions.mapping || mappingOptions.disposeItem) {
            throw new Error("'mappingWithDisposeCallback' cannot be used in conjunction with 'mapping' or 'disposeItem'.");
        }
    } else if (!mappingOptions.mapping) {
        throw new Error("Specify either 'mapping' or 'mappingWithDisposeCallback'.");
    }

    // Initial state: map each of the inputs
    for (let i = 0; i < originalInputArrayContents.length; i++) {
        const inputItem = originalInputArrayContents[i];
        const stateItem = new StateItem(inputItem, i, outputArray.length, mappingOptions, arrayOfState, outputObservableArray);
        const mappedValue = stateItem.mappedValueComputed.peek();
        arrayOfState.push(stateItem);

        if (stateItem.isIncluded) {
            outputArray.push(mappedValue);
        }
    }

    // If the input array changes structurally (items added or removed), update the outputs
    const inputArraySubscription = respondToArrayStructuralChanges(inputObservableArray, arrayOfState, outputArray, outputObservableArray, mappingOptions);

    // Return value is a readonly computed which can track its own changes to permit chaining.
    // When disposed, it cleans up everything it created.
    const returnValue = ko.computed<T[]>(outputObservableArray).extend({ trackArrayChanges: true });
    const originalDispose = returnValue.dispose;
    returnValue.dispose = function() {
        inputArraySubscription.dispose();
        ko.utils.arrayForEach(arrayOfState, stateItem => {
            stateItem.dispose();
        });
        originalDispose.call(this, arguments);
    };

    return returnValue;
}

// Filtering
export function filter<T>(array: KnockoutObservableArray<T>, predicate: (value: T) => boolean) {
    return map(array, { mapping: (item: T) => {
        return predicate(item) ? item : exclusionMarker as T;
    }});
}
