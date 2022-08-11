/**
 * This file was generated from Cascader.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Team
 */
import { CSSProperties } from "react";
import { EditableValue } from "mendix";

interface CommonProps {
    name: string;
    class: string;
    tabIndex: number;

    uniqueid: string;
    friendlyId?: string;
    mxform: mxui.lib.form._FormBase;
    mxObject?: mendix.lib.MxObject;
    readOnly: boolean;
    style: string;
}

interface _W {
    top: string;
    bottom: string;
    left: string;
    right: string;
    cellEntity: string;
    colIndex: string;
    rowIndex: string;
    mergeEntity: string;
    value: string;
    valueType: string;
}

export interface ContainerProps extends CommonProps, _W {}

export interface PreviewProps extends _W {
    class: string;
    style: string;
    styleObject: CSSProperties;
}

export interface VisibilityMap {
    [P in _W]: boolean;
}
