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
import { getReferencePart } from "@jeltemx/mendix-react-widget-utils";
import { persistentEntity } from "./persistent/entity";
import { redraw } from "./view/util";

export default function(props: ContainerProps) {
    const [errorMsg, setErrorMsg] = useState<string>();
    const ref = useRef<WorkbookInstance>(null);
    const refContainer = useRef(null);
    const [inViewport] = useInViewport(refContainer);
    const preInViewPort = usePrevious(inViewport);
    useUpdateEffect(() => {
        if (inViewport && !preInViewPort) {
            //trick redraw
            redraw();
        }
    }, [inViewport]);

    const store = useMemo(() => new Store(props), []);

    useEffect(() => {
        store.updateMxOption(props);
        return () => {};
    }, [store, props]);

    useUnmount(() => {
        store.dispose();
    });

    useEffect(() => {
        // one time check
        if (
            props.assoChange !== "" &&
            getReferencePart(props.cellEntity, "entity") !== getReferencePart(props.assoChange, "entity")
        ) {
            const msg = `组件【${props.uniqueid}】: 实体【单元格->数据实体】 必须与 实体【事件->保存->关联】 一致`;
            mx.logger.error(msg);
            setErrorMsg(msg);
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
                            store.modifiedCellSet.forEach(d => {
                                if (!ignoreSet.has(d)) {
                                    store.modifiedCellSet.delete(d);
                                }
                            });
                        },
                        err => {
                            mx.ui.hideProgress(h);
                            error(err);
                        }
                    );
                })
                .catch(error);

            const modifiedGuids = Array.from(store.modifiedCellSet.keys())
                .filter(d => store.m.has(d))
                .map(d => {
                    const index = store.m.get(d);
                    const cellModel = store.cellValues[index!];
                    if (index && store.objs) {
                        // fix hard code sheet index
                        const newCellValue = ref.current?.getCellValue(cellModel.RowIdx - 1, cellModel.ColIdx - 1, {
                            index: 0
                        });
                        store.objs[index].set(getReferencePart(props.value, "referenceAttr"), newCellValue);
                    }
                    return cellModel.guid;
                });

            persistentEntity(modifiedGuids, props.saveEntity, props.assoChange, props.saveMF, props.mxform);
        });

        return () => {
            disp1();
            disp2();
            disp3();
        };
    }, []);

    const onOp = useCallback((op: Op[]) => {
        if (store.loaded) {
            // 人工修改
            op.forEach(d => {
                store.modifiedCellSet.add(`${Number(d.path[1]) + 1}-${Number(d.path[2]) + 1}`);
            });
        } else {
            // 程序修改
            setTimeout(() => {
                store.modifiedCellSet.clear();
                store.loaded = true;
            }, 100);
        }
    }, []);

    return (
        <div
            ref={refContainer}
            className={classNames("mendixcn-fortune-sheet", props.class)}
            style={parseStyle(props.style)}
        >
            {errorMsg ? (
                <span className="alert-danger">{errorMsg}</span>
            ) : (
                <Workbook
                    ref={ref}
                    showFormulaBar={!props.readOnly}
                    allowEdit={true}
                    onOp={onOp}
                    showToolbar={!props.readOnly}
                    data={[data]}
                />
            )}
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
