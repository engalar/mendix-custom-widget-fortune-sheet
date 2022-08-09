import { createElement, useEffect, useMemo, useRef } from "react";
// import { Sheet, CellWithRowAndCol } from "@fortune-sheet/core";
import { Workbook, WorkbookInstance } from "@fortune-sheet/react";
import { ContainerProps } from "../typings/Props";
import "./ui/index.scss";
import classNames from "classnames";
import { Observer } from "mobx-react";
import { Store } from "./store";
import { useUnmount } from "ahooks";
import data from "./formula";


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

    return (
        <Observer>
            {() => (
                <div className={classNames('mendixcn-fortune-sheet', props.class)} style={parseStyle(props.style)}>
                    <Workbook ref={ref} showFormulaBar allowEdit showToolbar data={[data]} />
                </div>
            )}
        </Observer>
    );
}
