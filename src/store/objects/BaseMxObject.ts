export class BaseMxObject {
    sub?: mx.Subscription;
    constructor(public guid: string) {
        this.sub = mx.data.subscribe({
            guid: guid,
            callback: guid => {
                this.onChange && this.onChange(guid);
            }
        });
    }
    get mxObject(): mendix.lib.MxObject | undefined {
        return mx.data.getCachedObject(this.guid);
    }
    public dispose(): void {
        if (this.sub) {
            mx.data.unsubscribe(this.sub);
            this.sub = undefined;
        }
    }
    onChange?: (guid: number) => void;
}
