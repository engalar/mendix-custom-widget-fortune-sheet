import { createObject, executeMicroflow, getObjectContext, getReferencePart } from "@jeltemx/mendix-react-widget-utils";


export async function persistentEntity(guids: string[] | number[], saveEntity: string, assosiation: string, mf: string, mxform: mxui.lib.form._FormBase) {
    const obj = await createObject(saveEntity);
    obj.addReferences(getReferencePart(assosiation, 'referenceAttr'), guids);
    const actionReturn = await executeMicroflow(mf, getObjectContext(obj), mxform);
    return actionReturn;
}
