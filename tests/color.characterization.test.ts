import { describe, expect, it } from "vitest";

import { hexToHsl, hslToHex } from "../src/color";

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
    ] satisfies Array<[string, [number, number, number]]>)(
      "preserves the current conversion for %s",
      (hex, expected) => {
        const actual = hexToHsl(hex);

        expect(actual[0]).toBeCloseTo(expected[0], 10);
        expect(actual[1]).toBeCloseTo(expected[1], 10);
        expect(actual[2]).toBeCloseTo(expected[2], 10);
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
    ] satisfies Array<[[number, number, number], string]>)(
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
