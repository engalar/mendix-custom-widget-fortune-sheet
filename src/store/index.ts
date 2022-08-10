import { configure, makeObservable, observable, when } from "mobx";
import { ContainerProps } from "../../typings/Props";

configure({ enforceActions: "observed", isolateGlobalState: true, useProxies: "never" });

export class Store {
    sub?: mx.Subscription;
    /**
     * dispose
     */
    public dispose() {}

    constructor(public mxOption: ContainerProps) {
        makeObservable(this, { mxOption: observable });

        when(
            () => !!this.mxOption.mxObject,
            () => {
                this.update();

                this.sub = mx.data.subscribe(
                    {
                        guid: this.mxOption.mxObject!.getGuid(),
                        attr: "Horizontal",
                        callback: (guid, attr, value) => {
                            console.log(guid, attr, value);
                            this.update();
                            //等待视图刷新
                            setTimeout(() => {
                                console.log("wait for");
                            }, 1);
                        }
                    },
                    //@ts-ignore
                    this.mxOption.mxform
                );
            },
            {
                onError(e) {
                    console.error(e);
                }
            }
        );
    }
    update() {
        console.log("do some update");
    }
}
