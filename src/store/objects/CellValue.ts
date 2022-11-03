import { action, makeObservable, observable } from "mobx";
import { BaseMxObject } from "./BaseMxObject";

function name2value(name: string) {
    let result = 0;
    switch (name) {
        case "Null":
            result = 0;
            break;
        case "Merge":
            result = 1;
            break;
        case "Number":
            result = 2;
            break;
        case "String":
            result = 3;
            break;
        case "Date":
            result = 4;
            break;
        case "Hyperlink":
            result = 5;
            break;
        case "Formula":
            result = 6;
            break;
        case "SharedString":
            result = 7;
            break;
        case "RichText":
            result = 8;
            break;
        case "Boolean":
            result = 9;
            break;
        case "Error":
            result = 10;
            break;
        default:
            throw new Error("值非法");
    }
    return result;
}

export class CellValue extends BaseMxObject {
    RowIdx!: number;
    ColIdx!: number;
    ValueType!: number;
    Value!: string;
    /**
     *
     * @param guid mxobj guid
     * @param idx option index
     */
    constructor(
        guid: string,
        private rowIndex: string,
        private colIndex: string,
        private value: string,
        private valueType: string
    ) {
        super(guid);
        makeObservable(this, {
            RowIdx: observable,
            ColIdx: observable,
            ValueType: observable,
            Value: observable,
            update: action.bound
        });
        this.update();
        this.onChange = () => {
            this.update();
        };
    }
    update() {
        if (this.mxObject) {
            this.RowIdx = Number(this.mxObject.get(this.rowIndex.split("/").slice(-1)[0]));
            this.ColIdx = Number(this.mxObject.get(this.colIndex.split("/").slice(-1)[0]));
            this.Value = this.mxObject.get(this.value.split("/").slice(-1)[0]) as string;
            this.ValueType = Number(
                name2value((this.mxObject.get(this.valueType.split("/").slice(-1)[0]) as string).replaceAll("_", ""))
            );
        }
    }
}
