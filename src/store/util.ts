import { getObject } from "@jeltemx/mendix-react-widget-utils";
import LuckyExcel from "luckyexcel";
import { Sheet } from "@fortune-sheet/core";

export async function loadExcelTemplate(url: string) {
    const h = mx.ui.showProgress("加载模板。。。", true);
    const res = await fetch(url);
    const data = await res.arrayBuffer();
    const [exportJson] = await new Promise<any>((resolve, reject) => {
        LuckyExcel.transformExcelToLucky(
            data,
            (a: any, b: any) => {
                resolve([a, b]);
            },
            reject
        );
    });

    mx.ui.hideProgress(h);
    return exportJson.sheets as Sheet[];
}

export async function fetchEntityOverPath(obj: mendix.lib.MxObject, attr = ""): Promise<mendix.lib.MxObject | null> {
    if (attr.indexOf("/") === -1) {
        return obj;
    }
    const parts = attr.split("/");
    if (obj.isObjectReference(parts[0]) && parts.length >= 2) {
        const ref = obj.getReference(parts[0]);
        if (ref) {
            const refObj = await getObject(ref);
            const remaining = parts.slice(2).join("/");
            return refObj ? await fetchEntityOverPath(refObj, remaining) : null;
        }
    }

    return null;
}
