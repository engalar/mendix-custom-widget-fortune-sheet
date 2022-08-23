import {
    action,
    computed,
    configure,
    flow,
    makeObservable,
    observable,
    when
} from "mobx";
import { ContainerProps } from "../../typings/Props";
import { entityIsFileDocument, getReferencePart } from "@jeltemx/mendix-react-widget-utils";
import { fetchEntityOverPath } from "./util";
import { fetchEntitysOverPath } from "../mendix/fetchEntitysOverPath";

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

    async update() {
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
            const objs = yield fetchEntitysOverPath<mendix.lib.MxObject[]>(
                this.mxOption.mxObject,
                getReferencePart(this.mxOption.rowIndex, "referenceAttr") +
                    "/" +
                    getReferencePart(this.mxOption.rowIndex, "entity")
            );
            this.cellValues = objs.map<CellValue>(obj => ({
                RowIdx: Number(obj.get(this.mxOption.rowIndex.split("/").slice(-1)[0])),
                ColIdx: Number(obj.get(this.mxOption.colIndex.split("/").slice(-1)[0])),
                Value: obj.get(this.mxOption.value.split("/").slice(-1)[0]) as string,
                ValueType: Number(obj.get(this.mxOption.valueType.split("/").slice(-1)[0])),
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
