import { createElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Workbook, WorkbookInstance } from "@fortune-sheet/react";
import { Op } from "@fortune-sheet/core";
import { ContainerProps } from "../typings/Props";
import "./ui/index.scss";
import classNames from "classnames";
import { Store } from "./store";
import { useUnmount, useInViewport, usePrevious, useUpdateEffect } from "ahooks";
import data from "./data/empty";
import { autorun } from "mobx";
import { loadExcelTemplate, writeToFile } from "./store/util";
import { createObject, executeMicroflow, getObjectContext, getReferencePart } from "@jeltemx/mendix-react-widget-utils";

export default function (props: ContainerProps) {
    const [modifiedCellSet] = useState(new Set<string>());
    const ref = useRef<WorkbookInstance>(null);
    const refContainer = useRef(null);
    const [inViewport] = useInViewport(refContainer);
    const preInViewPort = usePrevious(inViewport);
    useUpdateEffect(() => {
        if (inViewport && !preInViewPort) {
            //trick redraw
            window.dispatchEvent(new Event("resize"));
        }
    }, [inViewport]);

    const store = useMemo(() => new Store(props), []);

    useEffect(() => {
        store.updateMxOption(props);
        return () => { };
    }, [store, props]);

    useUnmount(() => {
        store.dispose();
    });

    useEffect(() => {
        // one time check
        if (props.assoChange !== "" && props.cellEntity !== getReferencePart(props.assoChange, "entity")
        ) {
            mx.logger.error(`组件【${props.uniqueid}】: 实体【单元格->数据实体】 必须与 实体【事件->保存->关联】 一致`);
        }

        const disp1 = autorun(async () => {
            store.cellValues.forEach(cell => {
                ref.current?.setCellValue(Number(cell.RowIdx) - 1, Number(cell.ColIdx) - 1, cell.Value, {
                    type: cell.ValueType === 3 ? "v" : "f"
                });
            });
        });

        const disp2 = autorun(async () => {
            if (store.tplUrl) {
                await loadExcelTemplate(ref, store.tplUrl);
            }
        });

        const disp3 = ((props.mxform as unknown) as mxui.lib.form.ContentForm).listen("submit", (success, error) => {
            const sheets = ref.current!.getAllSheets();
            const h = mx.ui.showProgress("保存模板。。。", true);

            const ignoreSet = new Set<string>();
            store.cellValues.forEach(d => {
                ignoreSet.add(d.RowIdx + "-" + d.ColIdx);
            });
            writeToFile(sheets, ignoreSet)
                .then(buffer => {
                    mx.data.saveDocument(
                        store.tplObjGuid!,
                        "demo" + new Date().getTime() + ".xlsx",
                        {},
                        new Blob([new Uint8Array(buffer, 0, buffer.byteLength)], {
                            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        }),
                        () => {
                            mx.ui.hideProgress(h);
                            success();
                            modifiedCellSet.forEach(d => {
                                if (!ignoreSet.has(d)) {
                                    modifiedCellSet.delete(d);
                                }
                            })
                        },
                        err => {
                            mx.ui.hideProgress(h);
                            error(err);
                        }
                    );
                })
                .catch(error);

            // todo save entity data
            const modifiedGuids = Array.from(modifiedCellSet.keys()).filter(d => store.m.has(d)).map(d => {
                const index = store.m.get(d);
                // todo create new entity to dumy it/ reuse old one
                return store.cellValues[index!].guid;
            });
            save(modifiedGuids, props.saveEntity, props.assoChange, props.saveMF, props.mxform);
        });

        return () => {
            disp1();
            disp2();
            disp3();
        };
    }, []);

    const onOp = useCallback((op: Op[]) => {
        /**
        id: "f603c141-a6f7-4ada-bb31-42f18e2f1774"
op: "replace"
path: (4) ['data', 9, 4, 'v']
value: "89"
         */
        op.forEach(d => {
            if (d.path[3] === 'v') {
                modifiedCellSet.add(`${d.path[1]}-${d.path[2]}`)
            }
        })
    }, []);

    return (
        <div
            ref={refContainer}
            className={classNames("mendixcn-fortune-sheet", props.class)}
            style={parseStyle(props.style)}
        >
            <Workbook
                ref={ref}
                showFormulaBar={!props.readOnly}
                allowEdit={true}
                onOp={onOp}
                showToolbar={!props.readOnly}
                data={[data]}
            />
        </div>
    );
}

const parseStyle = (style = ""): { [key: string]: string } => {
    try {
        return style.split(";").reduce<{ [key: string]: string }>((styleObject, line) => {
            const pair = line.split(":");
            if (pair.length === 2) {
                const name = pair[0].trim().replace(/(-.)/g, match => match[1].toUpperCase());
                styleObject[name] = pair[1].trim();
            }
            return styleObject;
        }, {});
    } catch (_) {
        return {};
    }
};

export async function save(guids: string[] | number[], saveEntity: string, assosiation: string, mf: string, mxform: mxui.lib.form._FormBase) {
    const obj = await createObject(saveEntity);
    obj.addReferences(getReferencePart(assosiation, 'referenceAttr'), guids);
    const actionReturn = await executeMicroflow(mf, getObjectContext(obj), mxform);
    return actionReturn;
}