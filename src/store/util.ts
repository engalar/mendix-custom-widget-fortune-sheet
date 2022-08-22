import { WorkbookInstance } from "@fortune-sheet/react";
import { RefObject } from "react";
import { ValueType, Workbook } from "exceljs";
import { getObject } from "@jeltemx/mendix-react-widget-utils";
import { Sheet } from "@fortune-sheet/core";
const parse = require("color-parse");

function p(n: number) {
    return n.toString(16).padStart(2, "0");
}

function newFunction(colorString: string | undefined) {
    return colorString
        ? {
              argb: parse(colorString)
                  .values.map(p)
                  .join("") as string
          }
        : undefined;
}
export async function writeToFile(sheets: Sheet[], ignoreSet: Set<string>) {
    // https://github.com/exceljs/exceljs#writing-xlsx
    const wb = new Workbook();
    sheets.forEach(sheet => {
        const worksheet = wb.addWorksheet(sheet.name);
        sheet.data?.forEach((cellsOfRow, rowIndex) => {
            worksheet.addRow([]);
            cellsOfRow.forEach((cell, columnIndex) => {
                if (cell === null || ignoreSet.has(rowIndex + 1 + "-" + (columnIndex + 1))) {
                    // 业务数据不写入模板文件
                    return;
                }
                const activeCell = worksheet.getCell(rowIndex + 1, columnIndex + 1);
                const fgColor = newFunction(cell.fc);
                const bgColor = newFunction(cell.bg);
                // todo dumy style
                // https://github.com/exceljs/exceljs#styles
                // https://ruilisi.github.io/fortune-sheet-docs/guide/cell.html

                //https://github.com/exceljs/exceljs/blob/860b862d122c2645f8b34f0f885a64b104f7a538/test/test-colour-cell.js#L10
                if (bgColor) {
                    activeCell.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: bgColor
                        // bgColor
                    };
                }
                if (fgColor)
                    activeCell.font = {
                        name: cell.ct?.fa,
                        color: fgColor,
                        bold: cell.bl == 1,
                        size: cell.fs
                    };

                if (cell.ht !== undefined || cell.vt !== undefined) {
                    activeCell.alignment = {};
                }
                // horizontal
                switch (cell.ht) {
                    case 2:
                        activeCell.alignment.horizontal = "right";
                        break;
                    case 1:
                        activeCell.alignment.horizontal = "left";
                        break;
                    case 0:
                        activeCell.alignment.horizontal = "center";
                        break;
                    default:
                        break;
                }

                // vertical
                switch (cell.vt) {
                    case 2:
                        activeCell.alignment.vertical = "bottom";
                        break;
                    case 1:
                        activeCell.alignment.vertical = "top";
                        break;
                    case 0:
                        activeCell.alignment.vertical = "middle";
                        break;
                    default:
                        break;
                }

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
    const h = mx.ui.showProgress("加载模板。。。", true);
    const res = await fetch(url);
    const data = await res.arrayBuffer();
    const wbInstance = await new Workbook().xlsx.load(data);

    //todo hard code
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

                // style cfg must after merge
                // 水平对齐
                let horizontal = undefined;
                switch (cell.style.alignment?.horizontal) {
                    case "left":
                        horizontal = "1";
                        break;
                    case "center":
                        horizontal = "0";
                        break;
                    case "right":
                        horizontal = "2";
                        break;

                    default:
                        break;
                }
                ref.current?.setCellFormat(Number(cell.row) - 1, Number(cell.col) - 1, "ht", horizontal);

                // bg color
                let bg = undefined;
                if (cell.fill && cell.fill.type === "pattern") bg = `#${cell.fill.fgColor}`;
                if (bg) {
                    ref.current?.setCellFormat(Number(cell.row) - 1, Number(cell.col) - 1, "bg", bg);
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
