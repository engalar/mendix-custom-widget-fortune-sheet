import { createElement, useEffect, useMemo, useRef } from "react";
import { Workbook, WorkbookInstance } from "@fortune-sheet/react";
import { ContainerProps } from "../typings/Props";
import "./ui/index.scss";
import classNames from "classnames";
import { Store } from "./store";
import { useUnmount, useInViewport, usePrevious, useUpdateEffect } from "ahooks";
import data from "./data/empty";
import { autorun } from "mobx";
import { loadExcelTemplate } from './store/util'

export default function (props: ContainerProps) {
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
        store.mxOption = props;
        return () => { };
    }, [store, props]);

    useUnmount(() => {
        store.dispose();
    });

    autorun(async () => {
        store.cellValues.forEach(cell => {
            ref.current?.setCellValue(Number(cell.RowIdx) - 1, Number(cell.ColIdx) - 1, cell.Value, {
                type: cell.ValueType === 3 ? "v" : "f"
            });
        });
    });

    autorun(async () => {
        if (store.tplObj) {
            const tplUrl = mx.data.getDocumentUrl(store.tplObj.getGuid(), store.tplObj.get("changedDate") as number)
            await loadExcelTemplate(ref, tplUrl);
        }
    });

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
