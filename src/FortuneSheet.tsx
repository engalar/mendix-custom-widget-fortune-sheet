import { createElement, useEffect, useMemo, useRef } from "react";
import { Workbook, WorkbookInstance } from "@fortune-sheet/react";
import { ContainerProps } from "../typings/Props";
import "./ui/index.scss";
import classNames from "classnames";
import { Store } from "./store";
import { useMount, useUnmount } from "ahooks";
import data from "./data/empty";
import { ValueType, Workbook as wb } from "exceljs";


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

export default function (props: ContainerProps) {
    const ref = useRef<WorkbookInstance>(null);
    const store = useMemo(() => new Store(props), []);

    useEffect(() => {
        store.mxOption = props;
        return () => { };
    }, [store, props]);

    useUnmount(() => {
        store.dispose();
    });

    useMount(async () => {
        const res = await fetch('demo.xlsx');
        const data = await res.arrayBuffer();
        const wbInstance = await new wb().xlsx.load(data);

        wbInstance.worksheets[0].eachRow(row => {
            row.eachCell(cell => {
                if (cell.type !== ValueType.Merge) {
                    ref.current?.setCellValue(Number(cell.row) - 1, Number(cell.col) - 1, cell.value, { type: cell.formula ? 'f' : 'v' });
                    if (cell.isMerged) {
                        //                         bottom: 1
                        // left: 1
                        // right: 15
                        // sheetName: undefined
                        // top: 1
                        //@ts-ignore:next-line
                        const range = wbInstance.worksheets[0]._merges[cell.address].model
                        // wbInstance.worksheets[0].mergeCells(range.top, range.left, range.bottom, range.right);

                        //https://github.com/ruilisi/fortune-sheet/blob/76a66b9c0ba5125397313494db0798f560d70fbf/packages/core/test/api/merge.test.js
                        ref.current?.mergeCells([{ column: [range.left - 1, range.right - 1], row: [range.top - 1, range.bottom - 1] }], 'merge-all');
                    }
                }
                else {
                    //https://github.com/exceljs/exceljs#merged-cells
                }
            });
        });
    })

    return (<div className={classNames('mendixcn-fortune-sheet', props.class)} style={parseStyle(props.style)}>
        <Workbook ref={ref} showFormulaBar allowEdit showToolbar data={[data]} />
    </div>
    );
}
