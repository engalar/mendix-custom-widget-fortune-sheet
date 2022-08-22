import { Component, ReactNode, createElement } from "react";
import { ContainerProps, PreviewProps } from "../typings/Props";

declare function require(name: string): string;

export class preview extends Component<PreviewProps> {
    render(): ReactNode {
        return <div>No preview available</div>;
    }
}

export function getPreviewCss(): string {
    return require("./ui/index.scss");
}
type VisibilityMap = {
    [P in keyof ContainerProps]: boolean;
};

export function getVisibleProperties(props: ContainerProps, visibilityMap: VisibilityMap): VisibilityMap {
    visibilityMap.assoChange = props.saveEntity !== "";
    visibilityMap.saveMF = props.assoChange !== "" && props.saveEntity !== "";
    return visibilityMap;
}
