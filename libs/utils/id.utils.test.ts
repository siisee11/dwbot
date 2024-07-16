import {
  makeChallangeId,
  makeDailyCheckId,
  makeId,
  makeSlackUserId,
} from "./id.utils";

describe("makeId", () => {
  it("should generate a random string of the specified length", () => {
    const length = 10;
    const id = makeId(length);
    expect(id).toHaveLength(length);
    expect(typeof id).toBe("string");
  });

  it("should generate a different string each time", () => {
    const length = 10;
    const id1 = makeId(length);
    const id2 = makeId(length);
    expect(id1).not.toBe(id2);
  });
});

describe("makeDailyCheckId", () => {
  it("should generate a daily check id", () => {
    const id = makeDailyCheckId();
    expect(id).toMatch(/^dcheck_[A-Za-z0-9]{24}$/);
  });
});

describe("makeSlackUserId", () => {
  it("should generate a slack user id", () => {
    const id = makeSlackUserId();
    expect(id).toMatch(/^slusr_[A-Za-z0-9]{24}$/);
  });
});

describe("makeChallangeId", () => {
  it("should generate a challenge id", () => {
    const id = makeChallangeId();
    expect(id).toMatch(/^chal_[A-Za-z0-9]{24}$/);
  });
});
