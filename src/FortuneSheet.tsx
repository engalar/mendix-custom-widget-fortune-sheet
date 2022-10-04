import { createElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Workbook, WorkbookInstance } from "@fortune-sheet/react";
import { Op } from "@fortune-sheet/core";
import { ContainerProps } from "../typings/Props";
import "./ui/index.scss";
import classNames from "classnames";
import { Store } from "./store";
import { useUnmount, useInViewport, usePrevious, useUpdateEffect } from "ahooks";
import { autorun } from "mobx";
import { loadExcelTemplate } from "./store/util";
import { redraw } from "./view/util";

export default function(props: ContainerProps) {
    const [data, setData] = useState<any>(undefined);
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

    const store = useMemo(() => new Store(props), []);

    useEffect(() => {
        store.updateMxOption(props);
        return () => {};
    }, [store, props]);

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
                setData(tpl);
            }
            // update model to view in next tick
            setTimeout(() => {
                store.cellValues.forEach(cell => {
                    ref.current?.setCellValue(Number(cell.RowIdx) - 1, Number(cell.ColIdx) - 1, cell.Value, {
                        type: cell.ValueType === 3 ? "v" : "f"
                    });
                });
            }, 0);
        });

        return () => {
            disp2();
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
            ) : data ? (
                <Workbook
                    ref={ref}
                    showFormulaBar={!props.readOnly}
                    allowEdit={!props.readOnly}
                    onOp={onOp}
                    showToolbar={!props.readOnly}
                    data={data}
                />
            ) : (
                undefined
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
