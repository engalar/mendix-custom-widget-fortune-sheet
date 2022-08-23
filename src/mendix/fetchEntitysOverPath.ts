export async function fetchEntitysOverPath<T>(obj: mendix.lib.MxObject, path: string) {
    return new Promise<T>((resolve, _reject) => {
        obj.fetch(path, objs => {
            resolve(objs);
        });
    });
}
