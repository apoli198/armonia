import { describe, expect, it } from "vitest";

import { hexToHsl, hslToHex, isHexColor, type Hsl } from "../src/color";
import { validateBioColor, type BioComponent } from "../src/color_heuristics";
import { analyzeProfile, normalizeProfileReflexes } from "../src/profile";

const COLORS = ["#D4A574", "#6B4423", "#3D2B1F"] as const;
const DEFAULT_REFLEXES = {
  skin: "neutral",
  eye: "neutral",
  hair: "neutral",
  hairVolume: "medium",
};

describe("color input contract", () => {
  it.each(["#000000", "#ffffff", "#ABCdef"])(
    "accepts a complete opaque HEX color: %s",
    (value) => expect(isHexColor(value)).toBe(true),
  );

  it.each([
    "",
    "#",
    "#abc",
    "336699",
    "#336699zz",
    "#1g0000",
    "#gg0000",
    "#11223344",
    " #336699",
    "#336699 ",
    null,
    undefined,
    123,
    {},
  ])("rejects invalid color input: %j", (value) => {
    expect(isHexColor(value)).toBe(false);
    // The assertion deliberately simulates an unchecked JavaScript caller.
    expect(() => hexToHsl(value as string)).toThrow(TypeError);
    expect(validateBioColor(value as string, "skin")).toBe(false);
  });

  it.each([
    [NaN, 50, 50],
    [Infinity, 50, 50],
    [-Infinity, 50, 50],
    [0, NaN, 50],
    [0, Infinity, 50],
    [0, 50, NaN],
    [0, 50, -Infinity],
  ] satisfies Hsl[])("rejects non-finite HSL coordinates: %j", (h, s, l) => {
    expect(() => hslToHex(h, s, l)).toThrow(RangeError);
  });

  it("keeps the existing policy for finite values outside the nominal range", () => {
    expect(hslToHex(-60, 100, 50)).toBe("#ff00ff");
    expect(hslToHex(120, 120, 50)).toBe("#00ff00");
    expect(hslToHex(120, 100, -20)).toBe("#000000");
  });

  it.each(["unknown", "toString", "constructor", "__proto__"])(
    "rejects an unknown biological component: %s",
    (component) => {
      expect(validateBioColor("#8b7355", component as BioComponent)).toBe(
        false,
      );
    },
  );

  it("rejects non-finite output from a biological normalizer", () => {
    expect(validateBioColor("#8b7355", "skin", () => [NaN, 10, 30])).toBe(
      false,
    );
  });

  it("does not classify a malformed profile color", () => {
    expect(() => analyzeProfile("#gg0000", COLORS[1], COLORS[2])).toThrow(
      TypeError,
    );
  });
});

describe("profile reflex input normalization", () => {
  it.each([undefined, null, {}, [], "warm", 42])(
    "uses defaults for missing or malformed input: %j",
    (value) => {
      expect(normalizeProfileReflexes(value)).toEqual(DEFAULT_REFLEXES);
    },
  );

  it("preserves recognized values", () => {
    const value = {
      skin: "cool",
      eye: "green",
      hair: "ashy",
      hairVolume: "shaved",
    };

    expect(normalizeProfileReflexes(value)).toEqual(value);
  });

  it.each(["unknown", "toString", "constructor", "__proto__"])(
    "uses defaults instead of indexing inherited properties: %s",
    (option) => {
      const invalid = {
        skin: option,
        eye: option,
        hair: option,
        hairVolume: option,
      };

      expect(normalizeProfileReflexes(invalid)).toEqual(DEFAULT_REFLEXES);
      // @ts-expect-error Intentionally simulates unchecked persisted options.
      const actual = analyzeProfile(...COLORS, invalid);
      expect(actual).toEqual(analyzeProfile(...COLORS));
    },
  );
});
