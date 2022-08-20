import { action, configure, makeObservable, observable, runInAction, when } from "mobx";
import { ContainerProps } from "../../typings/Props";
import { getReferencePart } from "@jeltemx/mendix-react-widget-utils";
import { fetchEntityOverPath } from "./util";

configure({ enforceActions: "observed", isolateGlobalState: true, useProxies: "never" });

interface CellValue {
    RowIdx: number;
    ColIdx: number;
    ValueType: number;
    Value: string;
}

export class Store {
    cellValues: CellValue[] = [];
    tplObjGuid?: string;
    tplUrl?: string;
    sub?: mx.Subscription;
    /**
     * dispose
     */
    public dispose() {}

    constructor(public mxOption: ContainerProps) {
        makeObservable(this, {
            mxOption: observable,
            cellValues: observable,
            tplObjGuid: observable,
            tplUrl: observable,
            updateMxOption: action
        });

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
    async checkAndGetFileDocumentOb() {
        if (!this.mxOption.mxObject || !this.mxOption.tplFile) return null;
        const parts = this.mxOption.tplFile.split("/");
        const lastEntity = parts.slice(-2)[0];
        //上下文是文档实体
        if (this.mxOption.tplFile.indexOf("/") === -1 && this.mxOption.mxObject.inheritsFrom("System.FileDocument")) {
            return this.mxOption.mxObject;
        } else if (
            this.mxOption.tplFile.indexOf("/") !== -1 &&
            mx.meta.getEntity(lastEntity).inheritsFrom("System.FileDocument")
        ) {
            return await fetchEntityOverPath(this.mxOption.mxObject, this.mxOption.tplFile);
        } else {
            //error
            mx.logger.error("UI组件 属性【模板文件】 必须是 System.FileDocument 或者其子实体的属性！");
            return null;
        }
    }
    async update() {
        const tplObj = await this.checkAndGetFileDocumentOb();
        if (tplObj) {
            runInAction(() => {
                this.tplObjGuid = tplObj.getGuid();
                this.tplUrl = mx.data.getDocumentUrl(tplObj.getGuid(), tplObj.get("changedDate") as number);
            });
        }

        if (this.mxOption.mxObject) {
            const objs = await fetchEntitysOverPath<mendix.lib.MxObject[]>(
                this.mxOption.mxObject,
                getReferencePart(this.mxOption.rowIndex, "referenceAttr") +
                    "/" +
                    getReferencePart(this.mxOption.rowIndex, "entity")
            );
            const that = this;
            runInAction(() => {
                that.cellValues = objs.map<CellValue>(obj => ({
                    RowIdx: Number(obj.get(that.mxOption.rowIndex.split("/").slice(-1)[0])),
                    ColIdx: Number(obj.get(that.mxOption.colIndex.split("/").slice(-1)[0])),
                    Value: obj.get(that.mxOption.value.split("/").slice(-1)[0]) as string,
                    ValueType: Number(obj.get(that.mxOption.valueType.split("/").slice(-1)[0]))
                }));
            });
        }
    }
    updateMxOption(e: ContainerProps) {
        this.mxOption = e;
    }
}

async function fetchEntitysOverPath<T>(obj: mendix.lib.MxObject, path: string) {
    return new Promise<T>((resolve, _reject) => {
        obj.fetch(path, objs => {
            resolve(objs);
        });
    });
}
