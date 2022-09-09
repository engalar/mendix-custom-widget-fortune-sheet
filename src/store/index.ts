import { action, computed, configure, flow, makeObservable, observable, when } from "mobx";
import { ContainerProps } from "../../typings/Props";
import { entityIsFileDocument } from "@jeltemx/mendix-react-widget-utils";
import { fetchEntityOverPath } from "./util";
import { fetchEntitysOverPath } from "../mendix/fetchEntitysOverPath";
import { ModifiedStore } from "./ModifiedStore";

configure({ enforceActions: "observed", isolateGlobalState: true, useProxies: "never" });

export interface CellValue {
    RowIdx: number;
    ColIdx: number;
    ValueType: number;
    Value: string;
    guid: string;
}

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

export class Store {
    loaded = true;
    cellValues: CellValue[] = [];
    tplObjGuid?: string;
    tplUrl?: string;
    sub?: mx.Subscription;
    disposer: any;
    modifiedStore: ModifiedStore;
    objs?: mendix.lib.MxObject[];
    modifiedCellSet = new Set<string>();
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
    public dispose() {
        this.disposer();
    }

    constructor(public mxOption: ContainerProps) {
        makeObservable(this, {
            mxOption: observable,
            cellValues: observable,
            tplObjGuid: observable,
            objs: observable,
            tplUrl: observable,
            updateMxOption: action,
            m: computed
        });

        this.disposer = when(
            () => !!this.mxOption.mxObject,
            () => {
                this.update();
            },
            {
                onError(e) {
                    console.error(e);
                }
            }
        );

        this.modifiedStore = new ModifiedStore();
    }

    async update() {
        this.loaded = false;
        await this.loadTemplateExcel();

        await this.loadCellValue();
    }

    loadTemplateExcel = flow(function*(this: Store): Generator<Promise<mendix.lib.MxObject | null>, void, any> {
        const tplObj: any = yield this.checkAndGetFileDocumentObject();
        if (tplObj) {
            this.tplObjGuid = tplObj.getGuid();
            this.tplUrl = mx.data.getDocumentUrl(tplObj.getGuid(), tplObj.get("changedDate") as number);
        }
    });

    loadCellValue = flow(function*(
        this: Store
    ): Generator<Promise<mendix.lib.MxObject[]>, void, mendix.lib.MxObject[]> {
        if (this.mxOption.mxObject) {
            this.objs = yield fetchEntitysOverPath<mendix.lib.MxObject[]>(
                this.mxOption.mxObject,
                this.mxOption.cellEntity
            );
            this.cellValues = this.objs.map<CellValue>(obj => ({
                RowIdx: Number(obj.get(this.mxOption.rowIndex.split("/").slice(-1)[0])),
                ColIdx: Number(obj.get(this.mxOption.colIndex.split("/").slice(-1)[0])),
                Value: obj.get(this.mxOption.value.split("/").slice(-1)[0]) as string,
                ValueType: Number(
                    name2value((obj.get(this.mxOption.valueType.split("/").slice(-1)[0]) as string).replaceAll("_", ""))
                ),
                guid: obj.getGuid()
            }));
        }
    });

    updateMxOption(e: ContainerProps) {
        this.mxOption = e;
    }

    async checkAndGetFileDocumentObject() {
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
}
