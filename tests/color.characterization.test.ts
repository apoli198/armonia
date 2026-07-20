import { describe, expect, it } from "vitest";

import {
  hexToHsl,
  hslToHex,
  normBioEyes,
  normBioHair,
  normBioSkin,
  normFabric,
  normHex,
  type Hsl,
  type HslNormalizer,
} from "../src/color";

function expectHslCloseTo(actual: Hsl, expected: Hsl): void {
  expect(actual[0]).toBeCloseTo(expected[0], 10);
  expect(actual[1]).toBeCloseTo(expected[1], 10);
  expect(actual[2]).toBeCloseTo(expected[2], 10);
}

describe("color conversion characterization", () => {
  describe("hexToHsl", () => {
    it.each([
      ["#000000", [0, 0, 0]],
      ["#ffffff", [0, 0, 100]],
      ["#ff0000", [0, 100, 50]],
      ["#ffff00", [60, 100, 50]],
      ["#00ff00", [120, 100, 50]],
      ["#00ffff", [180, 100, 50]],
      ["#0000ff", [240, 100, 50]],
      ["#ff00ff", [300, 100, 50]],
      ["#336699", [210, 50, 40]],
    ] satisfies Array<[string, Hsl]>)(
      "preserves the current conversion for %s",
      (hex, expected) => {
        expectHslCloseTo(hexToHsl(hex), expected);
      },
    );

    it("uses zero hue and saturation for an achromatic color", () => {
      const [hue, saturation, lightness] = hexToHsl("#808080");

      expect(hue).toBe(0);
      expect(saturation).toBe(0);
      expect(lightness).toBeCloseTo(50.19607843137255, 10);
    });
  });

  describe("hslToHex", () => {
    it.each([
      [[0, 100, 50], "#ff0000"],
      [[60, 100, 50], "#ffff00"],
      [[120, 100, 50], "#00ff00"],
      [[180, 100, 50], "#00ffff"],
      [[240, 100, 50], "#0000ff"],
      [[300, 100, 50], "#ff00ff"],
      [[210, 50, 40], "#336699"],
    ] satisfies Array<[Hsl, string]>)(
      "preserves the current conversion for HSL %j",
      ([hue, saturation, lightness], expected) => {
        expect(hslToHex(hue, saturation, lightness)).toBe(expected);
      },
    );

    it("normalizes negative hue values", () => {
      expect(hslToHex(-60, 100, 50)).toBe("#ff00ff");
    });

    it("normalizes hue values above 360 degrees", () => {
      expect(hslToHex(420, 100, 50)).toBe("#ffff00");
    });

    it("clamps saturation below zero", () => {
      expect(hslToHex(120, -20, 50)).toBe("#808080");
    });

    it("clamps saturation above one hundred", () => {
      expect(hslToHex(120, 120, 50)).toBe("#00ff00");
    });

    it("clamps lightness below zero", () => {
      expect(hslToHex(120, 100, -20)).toBe("#000000");
    });

    it("clamps lightness above one hundred", () => {
      expect(hslToHex(120, 100, 120)).toBe("#ffffff");
    });

    it("returns lowercase hexadecimal output", () => {
      expect(hslToHex(210, 50, 40)).toBe("#336699");
    });
  });

  describe("round trip", () => {
    it.each([
      "#000000",
      "#ffffff",
      "#808080",
      "#ff0000",
      "#336699",
      "#abcdef",
      "#123456",
    ])("preserves %s after hex to HSL to hex conversion", (hex) => {
      expect(hslToHex(...hexToHsl(hex))).toBe(hex);
    });
  });
});

describe("HSL normalization characterization", () => {
  it.each([
    [
      "fabric",
      normFabric,
      [210, 0, 5],
      [210, 25.76718163067677, 47.5],
      [210, 68, 90],
    ],
    [
      "skin",
      normBioSkin,
      [210, 0, 20],
      [210, 16.54046070262636, 54],
      [210, 38, 88],
    ],
    [
      "eyes",
      normBioEyes,
      [210, 0, 15],
      [210, 23.751142393912097, 43.5],
      [210, 72, 72],
    ],
    [
      "hair",
      normBioHair,
      [210, 0, 5],
      [210, 22.336940899796474, 43.5],
      [210, 55, 82],
    ],
  ] satisfies Array<
    [string, HslNormalizer, Hsl, Hsl, Hsl]
  >)(
    "preserves the current %s normalization",
    (
      _name,
      normalize,
      expectedAtZero,
      expectedAtMidpoint,
      expectedAtMaximum,
    ) => {
      expectHslCloseTo(
        normalize(210, 0, 0),
        expectedAtZero,
      );

      expectHslCloseTo(
        normalize(210, 50, 50),
        expectedAtMidpoint,
      );

      expectHslCloseTo(
        normalize(210, 100, 100),
        expectedAtMaximum,
      );
    },
  );

  it("clamps negative saturation but not saturation above one hundred", () => {
    const [, negativeSaturation] = normFabric(210, -20, 50);
    const [, excessiveSaturation] = normFabric(210, 120, 50);

    expect(negativeSaturation).toBe(0);
    expect(excessiveSaturation).toBeCloseTo(
      87.77334656569772,
      10,
    );
    expect(excessiveSaturation).toBeGreaterThan(68);
  });

  it("does not clamp lightness before sigmoid normalization", () => {
    const [, , belowRange] = normFabric(210, 50, -20);
    const [, , aboveRange] = normFabric(210, 50, 120);

    expect(belowRange).toBeCloseTo(
      -0.6986775863707866,
      10,
    );

    expect(aboveRange).toBeCloseTo(
      95.69867758637078,
      10,
    );
  });

  describe("normHex", () => {
    it.each([
      ["fabric", normFabric, "#445b73"],
      ["skin", normBioSkin, "#617488"],
      ["eyes", normBioEyes, "#465c72"],
      ["hair", normBioHair, "#405365"],
    ] satisfies Array<[string, HslNormalizer, string]>)(
      "preserves the current %s normalized hexadecimal output",
      (_name, normalize, expected) => {
        expect(normHex("#336699", normalize)).toBe(expected);
      },
    );
  });
});
