import { createElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Workbook, WorkbookInstance } from "@fortune-sheet/react";
import { ContainerProps } from "../typings/Props";
import "./ui/index.scss";
import classNames from "classnames";
import { Store } from "./store";
import { useUnmount, useInViewport, usePrevious, useUpdateEffect, useEventListener } from "ahooks";
import { autorun, reaction, toJS } from "mobx";
import { loadExcelTemplate } from "./store/util";
import { redraw } from "./view/util";
import { executeMicroflow, executeNanoflow, getObjectContextFromObjects } from "@jeltemx/mendix-react-widget-utils";
import { Sheet, Op } from "@fortune-sheet/core";

export default function (props: ContainerProps) {
    const [data, setData] = useState<Sheet[] | undefined>(undefined);
    const [errorMsg] = useState<string>();
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

    const store = useMemo(() => new Store(props, ref), []);

    useEffect(() => {
        store.updateMxOption(props);
        return () => { };
    }, [store, props]);

    const onOp = useCallback((op: Op[]) => {
        if (store.loaded) {
            // 人工修改
            op.forEach(d => {
                const [dd, r, c, t] = d.path;
                if (t != "v" || dd != "data") return;

                const rowIndex = Number(r) + 1;
                const columnIndex = Number(c) + 1;
                store.modifiedCellSet.add(`${rowIndex}-${columnIndex}`);

                const currentCell = store.cellValues.find(
                    cell => cell.RowIdx == rowIndex && cell.ColIdx == columnIndex
                );

                if (currentCell) {
                    const obj = mx.data.getCachedObject(currentCell!.guid);
                    obj.set(props.value, d.value);

                    const context = getObjectContextFromObjects(obj);

                    if (props.mfInlineEdit) executeMicroflow(props.mfInlineEdit, context, props.mxform);

                    if (props.nfInlineEdit.nanoflow) executeNanoflow(props.nfInlineEdit, context, props.mxform);
                }
            });
        } else {
            // 程序修改
            setTimeout(() => {
                store.modifiedCellSet.clear();
                store.loaded = true;
            }, 100);
        }
    }, []);

    useUnmount(() => {
        store.dispose();
    });

    useEffect(() => {
        // widget api check
        /* if (
            props.assoChange !== "" &&
            getReferencePart(props.cellEntity, "entity") !== getReferencePart(props.assoChange, "entity")
        ) {
            const msg = `组件【${props.uniqueid}】: 实体【单元格->数据实体】 必须与 实体【事件->保存->关联】 一致`;
            mx.logger.error(msg);
            setErrorMsg(msg);
        } */

        const disp2 = autorun(async () => {
            // load teplate once tplUrl changed
            if (store.tplUrl) {
                const tpl = await loadExcelTemplate(store.tplUrl);

                //https://github.com/ruilisi/fortune-sheet#migrating-data-from-luckysheet
                const sheet: any = tpl[0];
                sheet.id = sheet.index;
                for (const d of sheet.calcChain) {
                    d.id = d.index;
                }

                setData(toJS(tpl));
            }
            // update model to view in next tick
            setTimeout(() => {
                updateBusinessData();
            }, 0);
        });

        const disp3 = reaction(
            () => store.cellValues,
            () => {
                updateBusinessData();
            },
            { fireImmediately: true }
        );

        return () => {
            disp2();
            disp3();
        };
    }, []);

    useEventListener(
        "dblclick",
        e => {
            if (props.mfEdit == "" || props.nfInlineEdit.nanoflow != undefined || props.mfInlineEdit != "") {
                return;
            }
            const [
                {
                    column: [columnIndex],
                    row: [rowIndex]
                }
            ] = ref.current!.getSelection()!;
            const currentCell = store.cellValues.find(
                cell => cell.RowIdx - 1 == rowIndex && cell.ColIdx - 1 == columnIndex
            );

            if (!currentCell) return;

            const obj = mx.data.getCachedObject(currentCell!.guid);

            executeMicroflow(props.mfEdit, getObjectContextFromObjects(obj), props.mxform);

            e.stopPropagation();
        },
        { target: refContainer }
    );

    return (
        <div
            ref={refContainer}
            className={classNames("mendixcn-fortune-sheet", props.class)}
            style={parseStyle(props.style)}
        >
            {errorMsg ? (
                <span className="alert-danger">{errorMsg}</span>
            ) : data ? (
                <Workbook
                    ref={ref}
                    onOp={onOp}
                    showFormulaBar={!props.readOnly}
                    allowEdit={!props.readOnly}
                    showToolbar={!props.readOnly}
                    data={data}
                />
            ) : (
                undefined
            )}
        </div>
    );

    function updateBusinessData() {
        store.cellValues.forEach(cell => {
            ref.current?.setCellValue(Number(cell.RowIdx) - 1, Number(cell.ColIdx) - 1, { v: cell.Value, f: null }, {
                type: cell.ValueType === 3 ? "v" : "f"
            });
        });
    }
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
