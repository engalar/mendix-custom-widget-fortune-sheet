import { createElement, RefObject, useEffect, useMemo, useRef } from "react";
import { Workbook, WorkbookInstance } from "@fortune-sheet/react";
import { ContainerProps } from "../typings/Props";
import "./ui/index.scss";
import classNames from "classnames";
import { Store } from "./store";
import { useMount, useUnmount, useInViewport, usePrevious, useUpdateEffect } from "ahooks";
import data from "./data/empty";
import { ValueType, Workbook as wb } from "exceljs";
import { autorun } from "mobx";

export default function (props: ContainerProps) {
    const ref = useRef<WorkbookInstance>(null);
    const refContainer = useRef(null);
    const [inViewport] = useInViewport(refContainer);
    const preInViewPort = usePrevious(inViewport);
    useUpdateEffect(() => {
        if (inViewport && !preInViewPort) {
            //trick redraw
            window.dispatchEvent(new Event('resize'));
        }
    }, [inViewport])

    const store = useMemo(() => new Store(props), []);

    useEffect(() => {
        store.mxOption = props;
        return () => { };
    }, [store, props]);

    useUnmount(() => {
        store.dispose();
    });

    useMount(async () => {
        await loadExcelTemplate(ref, props.tplAddress);
    });

    autorun(() => {
        store.cellValues.forEach(cell => {
            ref.current?.setCellValue(Number(cell.RowIdx) - 1, Number(cell.ColIdx) - 1, cell.Value, {
                type: cell.ValueType === 3 ? "v" : "f"
            });
        })
    })

    return (
        <div ref={refContainer} className={classNames("mendixcn-fortune-sheet", props.class)} style={parseStyle(props.style)}>
            <Workbook ref={ref} showFormulaBar={!props.readOnly} allowEdit={true} showToolbar={!props.readOnly} data={[data]} />
        </div>
    );
}
async function loadExcelTemplate(ref: RefObject<WorkbookInstance>, url: string) {
    const res = await fetch(url);
    const data = await res.arrayBuffer();
    const wbInstance = await new wb().xlsx.load(data);

    wbInstance.worksheets[0].eachRow(row => {
        row.eachCell(cell => {
            if (cell.type !== ValueType.Merge) {
                ref.current?.setCellValue(Number(cell.row) - 1, Number(cell.col) - 1, cell.value, {
                    type: cell.formula ? "f" : "v"
                });
                if (cell.isMerged) {
                    //@ts-ignore:next-line
                    const range = wbInstance.worksheets[0]._merges[cell.address].model;
                    // wbInstance.worksheets[0].mergeCells(range.top, range.left, range.bottom, range.right);
                    //https://github.com/ruilisi/fortune-sheet/blob/76a66b9c0ba5125397313494db0798f560d70fbf/packages/core/test/api/merge.test.js
                    ref.current?.mergeCells(
                        [{ column: [range.left - 1, range.right - 1], row: [range.top - 1, range.bottom - 1] }],
                        "merge-all"
                    );
                }
            } else {
                //https://github.com/exceljs/exceljs#merged-cells
            }
        });
    });
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
