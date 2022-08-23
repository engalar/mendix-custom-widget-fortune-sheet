/**
        id: "f603c141-a6f7-4ada-bb31-42f18e2f1774"
op: "replace"
path: (4) ['data', 9, 4, 'v']
value: "89"
         */
let opList;
beforeAll(() => {
    opList = [{ path: ["data", 9, 4, "v"] }, { path: ["data", 9, 4, "f"] }, { path: ["data", 9, 3, "v"] }];
});

describe("Name of the group", () => {
    test("should first", () => {
        console.log(opList);
        opList[0].path[1] = 66;
    });
});

it("should ", () => {
    expect(2 + 2).toBe(4);
    console.log(opList);
});
