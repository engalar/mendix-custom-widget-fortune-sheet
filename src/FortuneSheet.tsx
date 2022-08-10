import { createElement, useEffect, useMemo, useRef } from "react";
import { Workbook, WorkbookInstance } from "@fortune-sheet/react";
import { ContainerProps } from "../typings/Props";
import "./ui/index.scss";
import classNames from "classnames";
import { Store } from "./store";
import { useMount, useUnmount } from "ahooks";
import data from "./data/empty";
import { Workbook as wb } from "exceljs";


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
                ref.current?.setCellValue(Number(cell.row) - 1, Number(cell.col) - 1, cell.value, { type: cell.formula ? 'f' : 'v' })
            });
        });
    })

    return (<div className={classNames('mendixcn-fortune-sheet', props.class)} style={parseStyle(props.style)}>
        <Workbook ref={ref} showFormulaBar allowEdit showToolbar data={[data]} />
    </div>
    );
}
