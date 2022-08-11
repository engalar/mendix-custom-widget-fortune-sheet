//todo move into https://github.com/engalar/Mendix-client-typing
declare namespace mx {
    interface data {
        subscribe(
            args: {
                guid: string;
                attr: string;
                callback: (guid: string, attr: string, value: any) => void;
            },
            form: mxui.lib.form._FormBase
        ): Subscription;
    }
}
