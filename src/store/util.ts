import { WorkbookInstance } from "@fortune-sheet/react";
import { RefObject } from "react";
import { ValueType, Workbook } from "exceljs";
import { getObject } from "@jeltemx/mendix-react-widget-utils";
import { Sheet } from "@fortune-sheet/core";

export async function writeToFile(sheets: Sheet[]) {
    // https://github.com/exceljs/exceljs#writing-xlsx
    const wb = new Workbook();
    sheets.forEach(sheet => {
        const worksheet = wb.addWorksheet(sheet.name);
        sheet.data?.forEach((cellsOfRow, rowIndex) => {
            worksheet.addRow([]);
            cellsOfRow.forEach((cell, columnIndex) => {
                const activeCell = worksheet.getCell(rowIndex + 1, columnIndex + 1);
                // [cell](https://ruilisi.github.io/fortune-sheet-docs/guide/cell.html)
                if (cell?.mc !== undefined) {
                    if (cell.mc.r === rowIndex && cell.mc.c === columnIndex) {
                        // [mergeCells](https://github.com/exceljs/exceljs#merged-cells)
                        worksheet.mergeCells(
                            cell.mc.r + 1,
                            cell.mc.c + 1,
                            cell.mc.r + cell.mc.rs!,
                            cell.mc.c + cell.mc.cs!
                        );
                        activeCell.value = cell.v;
                    }
                    return;
                }
                if (cell?.f) {
                    // [formula value](https://github.com/exceljs/exceljs#formula-value)
                    activeCell.value = {
                        formula: cell.f,
                        date1904: false
                    };
                }
                if (cell?.v) {
                    activeCell.value = cell.v;
                }
            });
        });
    });
    return await wb.xlsx.writeBuffer();
}

export async function loadExcelTemplate(ref: RefObject<WorkbookInstance>, url: string) {
    const h = mx.ui.showProgress("加载模板中。。。", true);
    const res = await fetch(url);
    const data = await res.arrayBuffer();
    const wbInstance = await new Workbook().xlsx.load(data);

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
    mx.ui.hideProgress(h);
}

export async function fetchEntityOverPath(obj: mendix.lib.MxObject, attr = ""): Promise<mendix.lib.MxObject | null> {
    if (attr.indexOf("/") === -1) {
        return obj;
    }
    const parts = attr.split("/");
    if (obj.isObjectReference(parts[0]) && parts.length >= 3) {
        const ref = obj.getReference(parts[0]);
        if (ref) {
            const refObj = await getObject(ref);
            const remaining = parts.slice(2).join("/");
            return refObj ? await fetchEntityOverPath(refObj, remaining) : null;
        }
    }

    return null;
}
