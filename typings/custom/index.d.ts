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

    interface logger {
        info(message?: any, ...optionalParams: any[]): void;
        debug(message?: any, ...optionalParams: any[]): void;
        error(message?: any, ...optionalParams: any[]): void;
    }

    interface MxInterface {
        logger: mx.logger;
    }
}

declare namespace mxui {
    namespace lib {
        namespace form {
            class ContentForm extends WebForm {
                constructor();
                destroy(): void;
                listen(
                    event: "validate" | "submit" | "commit" | "rollback" | "close" | "resume" | "toggleSidebar",
                    process: (success: () => void, error: (error: Error) => void) => void
                ): () => void;
            }
            class WebForm extends _FormBase {
                constructor();
                destroy(): void;
            }
        }
    }
}
