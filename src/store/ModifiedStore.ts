import {
    makeObservable,
    observable
} from "mobx";


export interface Location {
    row: number;
    column: number;
}
export class ModifiedStore {
    /**
     * fortune sheet 修改过的位置
     */
    dirtyLocation?: Location[];
    cellLocation?: Location[];
    templateLocation?: Location[];
    constructor() {
        makeObservable(this, {
            dirtyLocation: observable,
            cellLocation: observable,
            templateLocation: observable
        });
    }
}
