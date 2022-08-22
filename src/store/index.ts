import { action, computed, configure, makeObservable, observable, runInAction, when } from "mobx";
import { ContainerProps } from "../../typings/Props";
import { entityIsFileDocument, getReferencePart } from "@jeltemx/mendix-react-widget-utils";
import { fetchEntityOverPath } from "./util";

configure({ enforceActions: "observed", isolateGlobalState: true, useProxies: "never" });

export interface CellValue {
    RowIdx: number;
    ColIdx: number;
    ValueType: number;
    Value: string;
    guid: string;
}

export class Store {
    cellValues: CellValue[] = [];
    tplObjGuid?: string;
    tplUrl?: string;
    sub?: mx.Subscription;
    get m() {
        const map = new Map<string, number>();
        this.cellValues.forEach((v, i) => {
            map.set(`${v.RowIdx}-${v.ColIdx}`, i);
        });
        return map;
    }
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
            updateMxOption: action,
            m: computed
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
        if (!this.mxOption.mxObject || !this.mxOption.templateEntity) return null;
        const parts = this.mxOption.templateEntity.split("/");
        const lastEntity = parts.slice(-1)[0];
        //上下文是文档实体
        if (this.mxOption.templateEntity === "" && entityIsFileDocument(this.mxOption.mxObject.getEntity())) {
            mx.logger.debug("没有额外指定模板文件关联，默认为当前上下文实体");
            return this.mxOption.mxObject;
        } else if (this.mxOption.templateEntity.indexOf("/") !== -1 && entityIsFileDocument(lastEntity)) {
            return await fetchEntityOverPath(this.mxOption.mxObject, this.mxOption.templateEntity);
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
                    ValueType: Number(obj.get(that.mxOption.valueType.split("/").slice(-1)[0])),
                    guid: obj.getGuid()
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
