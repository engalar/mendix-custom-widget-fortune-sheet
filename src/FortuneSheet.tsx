import { createElement, useCallback, useEffect, useMemo, useRef } from "react";
import { Workbook, WorkbookInstance } from "@fortune-sheet/react";
import { Op } from '@fortune-sheet/core';
import { ContainerProps } from "../typings/Props";
import "./ui/index.scss";
import classNames from "classnames";
import { Store } from "./store";
import { useUnmount, useInViewport, usePrevious, useUpdateEffect } from "ahooks";
import data from "./data/empty";
import { autorun } from "mobx";
import { loadExcelTemplate, writeToFile } from "./store/util";

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

    useEffect(() => {
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

        const disp3 = (props.mxform as unknown as mxui.lib.form.ContentForm).listen("submit", (success, error,) => {
            const sheets = ref.current!.getAllSheets();
            const h = mx.ui.showProgress("保存模板。。。", true);
            writeToFile(sheets).then(buffer => {
                mx.data.saveDocument(store.tplObjGuid!, 'demo' + new Date().getTime() + '.xlsx', {}, new Blob([new Uint8Array(buffer, 0, buffer.byteLength)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), () => {
                    mx.ui.hideProgress(h);
                    success();
                }, err => {
                    mx.ui.hideProgress(h);
                    error(err);
                });
            }).catch(error);
        });

        return () => {
            disp1();
            disp2();
            disp3();
        };
    }, []);

    const onOp = useCallback((op: Op[]) => {
        console.log(op);
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
