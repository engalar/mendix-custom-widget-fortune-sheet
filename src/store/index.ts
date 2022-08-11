import { configure, makeObservable, observable, when } from "mobx";
import { ContainerProps } from "../../typings/Props";
import { getReferencePart } from "@jeltemx/mendix-react-widget-utils";

configure({ enforceActions: "observed", isolateGlobalState: true, useProxies: "never" });

interface CellValue {
    RowIdx: number;
    ColIdx: number;
    ValueType: number;
    Value: string;
}

export class Store {
    cellValues: CellValue[] = [];
    sub?: mx.Subscription;
    /**
     * dispose
     */
    public dispose() {}

    constructor(public mxOption: ContainerProps) {
        makeObservable(this, { mxOption: observable, cellValues: observable });

        when(
            () => !!this.mxOption.mxObject,
            () => {
                this.update();

                this.sub = mx.data.subscribe(
                    {
                        guid: this.mxOption.mxObject!.getGuid(),
                        attr: "Horizontal",
                        callback: (guid, attr, value) => {
                            console.log(guid, attr, value);
                            //等待视图刷新
                            setTimeout(() => {
                                console.log("wait for");
                            }, 1);
                        }
                    },
                    //@ts-ignore
                    this.mxOption.mxform
                );
            },
            {
                onError(e) {
                    console.error(e);
                }
            }
        );
    }
    async update() {
        console.log(
            "do some update",
            getReferencePart(this.mxOption.rowIndex, "entity"),
            getReferencePart(this.mxOption.rowIndex, "referenceAttr")
        );
        if (this.mxOption.mxObject) {
            const objs = await fetchEntitysOverPath<mendix.lib.MxObject[]>(
                this.mxOption.mxObject,
                getReferencePart(this.mxOption.rowIndex, "referenceAttr") +
                    "/" +
                    getReferencePart(this.mxOption.rowIndex, "entity")
            );
            const that = this;
            that.cellValues = objs.map<CellValue>(obj => ({
                RowIdx: Number(obj.get(that.mxOption.rowIndex.split("/").slice(-1)[0])),
                ColIdx: Number(obj.get(that.mxOption.colIndex.split("/").slice(-1)[0])),
                Value: obj.get(that.mxOption.value.split("/").slice(-1)[0]) as string,
                ValueType: Number(obj.get(that.mxOption.valueType.split("/").slice(-1)[0]))
            }));
        }
    }
}

async function fetchEntitysOverPath<T>(obj: mendix.lib.MxObject, path: string) {
    return new Promise<T>((resolve, _reject) => {
        obj.fetch(path, objs => {
            resolve(objs);
        });
    });
}
