import { describe, expect, it } from "vitest";
import { detectSeason, PROFILE_MODEL_VERSION } from "../src/profile";

describe("profile circular-hue regression", () => {
  it("removes the known classification flip across 0/360 degrees", () => {
    const beforeSeam = detectSeason("#b98c8d", "#808080", "#808080");
    const afterSeam = detectSeason("#b98d8c", "#808080", "#808080");

    expect(beforeSeam.utScore).toBeCloseTo(-0.8504662004662, 10);
    expect(afterSeam.utScore).toBeCloseTo(-0.7572261072261, 10);

    expect(beforeSeam.undertone).toBe("cool");
    expect(afterSeam.undertone).toBe("cool");
    expect(beforeSeam.base).toBe(afterSeam.base);
    expect(beforeSeam.sub).toBe(afterSeam.sub);
  });

  it("identifies the model without claiming empirical validation", () => {
    const result = detectSeason("#D4A574", "#6B4423", "#3D2B1F");

    expect(result.modelVersion).toBe(PROFILE_MODEL_VERSION);
    expect(result.validationStatus).toBe("unvalidated");
  });
});
