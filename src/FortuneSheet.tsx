import { createElement, useEffect, useMemo, useRef, useState } from "react";
import { ContainerProps } from "../typings/Props";
import "./ui/index.scss";
import classNames from "classnames";
import { useInViewport, usePrevious, useUpdateEffect } from "ahooks";
import { redraw } from "./view/util";

export default function (props: ContainerProps) {
    const [errorMsg] = useState<string>();
    const refContainer = useRef(null);
    const [inViewport] = useInViewport(refContainer);
    const preInViewPort = usePrevious(inViewport);

    //@ts-ignore: next-line
    const id = useMemo(() => dijit.registry.getUniqueId(props.uniqueid), [])

    useUpdateEffect(() => {
        if (inViewport && !preInViewPort) {
            //trick redraw
            redraw();
        }
    }, [inViewport]);

    useEffect(() => {
        //@ts-ignore: next-line
        setTimeout(function () {
            var options = {
                container: id,
                lang: 'zh', forceCalculation: false,
                plugins: ['chart'],
                hook: {

                    //@ts-ignore: next-line
                    cellDragStop: function (cell, postion, sheetFile, ctx, event) {
                        // console.info(cell, postion, sheetFile, ctx, event);
                    },
                    //@ts-ignore: next-line
                    rowTitleCellRenderBefore: function (rowNum, postion, ctx) {
                        // console.log(rowNum);
                    },
                    //@ts-ignore: next-line
                    rowTitleCellRenderAfter: function (rowNum, postion, ctx) {
                        // console.log(ctx);
                    },
                    //@ts-ignore: next-line
                    columnTitleCellRenderBefore: function (columnAbc, postion, ctx) {
                        // console.log(columnAbc);
                    },
                    //@ts-ignore: next-line
                    columnTitleCellRenderAfter: function (columnAbc, postion, ctx) {
                        // console.log(postion);
                    },
                    //@ts-ignore: next-line
                    cellRenderBefore: function (cell, postion, sheetFile, ctx) {
                        // console.log(cell,postion,sheetFile,ctx);
                    },
                    //@ts-ignore: next-line
                    cellRenderAfter: function (cell, postion, sheetFile, ctx) {
                        // console.log(postion);
                    },
                    //@ts-ignore: next-line
                    cellMousedownBefore: function (cell, postion, sheetFile, ctx) {
                        // console.log(postion);
                    },
                    //@ts-ignore: next-line
                    cellMousedown: function (cell, postion, sheetFile, ctx) {
                        // console.log(sheetFile);
                    },
                    //@ts-ignore: next-line
                    sheetMousemove: function (cell, postion, sheetFile, moveState, ctx) {
                        // console.log(cell,postion,sheetFile,moveState,ctx);
                    },
                    //@ts-ignore: next-line
                    sheetMouseup: function (cell, postion, sheetFile, moveState, ctx) {
                        // console.log(cell,postion,sheetFile,moveState,ctx);
                    },
                    //@ts-ignore: next-line
                    cellAllRenderBefore: function (data, sheetFile, ctx) {
                        // console.info(data,sheetFile,ctx)
                    },
                    //@ts-ignore: next-line
                    updated: function (operate) {
                        // console.info(operate)
                    },
                    //@ts-ignore: next-line
                    cellUpdateBefore: function (r, c, value, isRefresh) {
                        // console.info('cellUpdateBefore',r,c,value,isRefresh)
                    },
                    //@ts-ignore: next-line
                    cellUpdated: function (r, c, oldValue, newValue, isRefresh) {
                        // console.info('cellUpdated',r,c,oldValue, newValue, isRefresh)
                    },
                    //@ts-ignore: next-line
                    sheetActivate: function (index, isPivotInitial, isNewSheet) {
                        // console.info(index, isPivotInitial, isNewSheet)
                    },
                    //@ts-ignore: next-line
                    rangeSelect: function (index, sheet) {
                        // console.info(index, sheet)
                    },
                    //@ts-ignore: next-line
                    commentInsertBefore: function (r, c) {
                        // console.info(r, c)
                    },
                    //@ts-ignore: next-line

                    commentInsertAfter: function (r, c, cell) {
                        // console.info(r, c, cell)
                    },
                    //@ts-ignore: next-line
                    commentDeleteBefore: function (r, c, cell) {
                        // console.info(r, c, cell)
                    },
                    //@ts-ignore: next-line
                    commentDeleteAfter: function (r, c, cell) {
                        // console.info(r, c, cell)
                    },
                    //@ts-ignore: next-line
                    commentUpdateBefore: function (r, c, value) {
                        // console.info(r, c, value)
                    },
                    //@ts-ignore: next-line
                    commentUpdateAfter: function (r, c, oldCell, newCell) {
                        // console.info(r, c, oldCell, newCell)
                    },
                    //@ts-ignore: next-line
                    cellEditBefore: function (range) {
                        // console.info(range)
                    },
                    //@ts-ignore: next-line
                    workbookCreateAfter: function (json) {
                        // console.info(json)
                    },
                    //@ts-ignore: next-line
                    rangePasteBefore: function (range, data) {
                        // console.info('rangePasteBefore',range,data)
                        // return false; //Can intercept paste
                    },


                },
                //@ts-ignore: next-line
                data: [sheetCell, sheetFormula, sheetConditionFormat, sheetSparkline, sheetTable, sheetComment, sheetPivotTableData, sheetPivotTable, sheetChart, sheetPicture, sheetDataVerification]
            }

            //@ts-ignore: next-line
            options.loading = {
                image: () => {
                    return `<svg viewBox="25 25 50 50" class="circular">
					<circle cx="50" cy="50" r="20" fill="none"></circle>
					</svg>`
                },
                imageClass: "loadingAnimation"
            }
            //@ts-ignore: next-line
            options.cellRightClickConfig = {
                customs: [{
                    title: 'test',

                    //@ts-ignore: next-line
                    onClick: function (clickEvent, event, params) {
                        console.log('function test click', clickEvent, event, params)
                    }
                }]
            }
            //@ts-ignore: next-line
            luckysheet.create(options)
        }, 2000);
    }, []);

    return (
        <div
            ref={refContainer}
            className={classNames("mendixcn-fortune-sheet", props.class)}
            style={parseStyle(props.style)}
        >
            {errorMsg ? (
                <span className="alert-danger">{errorMsg}</span>
            ) : <div
                id={id}
            ></div>}
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
