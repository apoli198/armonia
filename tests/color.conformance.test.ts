import { describe, expect, it } from "vitest";
import {
  hexToHsl,
  hslToHex,
  signedHueDifference,
  type Hsl,
} from "../src/color";

// Riferimento: CSS Color 4, CRD 2026-10-09, sezioni 7.1 e 7.2.
// https://www.w3.org/TR/2026/CRD-css-color-4-20261009/
// Tolleranza HSL: 10 cifre decimali; serializzazione RGB: un livello su 255.
// H=0 per gli acromatici è la convenzione dell'app, non una hue fisica.
const VECTORS: Array<[string, Hsl]> = [
  ["#000000", [0, 0, 0]],
  ["#ffffff", [0, 0, 100]],
  ["#ff0000", [0, 100, 50]],
  ["#ffff00", [60, 100, 50]],
  ["#00ff00", [120, 100, 50]],
  ["#00ffff", [180, 100, 50]],
  ["#0000ff", [240, 100, 50]],
  ["#ff00ff", [300, 100, 50]],
  ["#663399", [270, 50, 40]],
];

describe("sRGB/HSL reference checks", () => {
  it.each(VECTORS)("matches the reference vector %s", (hex, expected) => {
    const actual = hexToHsl(hex);

    for (let i = 0; i < 3; i++) {
      expect(actual[i]).toBeCloseTo(expected[i], 10);
    }

    expect(hslToHex(...expected)).toBe(hex);
  });

  it("matches an alternate HSL conversion on a 480-point grid", () => {
    for (let hue = 0; hue < 360; hue += 15) {
      for (const saturation of [0, 20, 50, 100]) {
        for (const lightness of [0, 10, 50, 90, 100]) {
          const s = saturation / 100;
          const l = lightness / 100;
          const amplitude = s * Math.min(l, 1 - l);

          const reference = [0, 8, 4].map((offset) => {
            const phase = (offset + hue / 30) % 12;
            const wave = Math.max(-1, Math.min(phase - 3, 9 - phase, 1));

            return Math.round(255 * (l - amplitude * wave));
          });

          const hex = hslToHex(hue, saturation, lightness);
          const actual = [1, 3, 5].map((start) =>
            parseInt(hex.slice(start, start + 2), 16),
          );

          for (let i = 0; i < 3; i++) {
            expect(Math.abs(actual[i] - reference[i])).toBeLessThanOrEqual(1);
          }
        }
      }
    }
  });

  it("preserves all 4096 colors in an RGB grid through the round trip", () => {
    for (let r = 0; r <= 255; r += 17) {
      for (let g = 0; g <= 255; g += 17) {
        for (let b = 0; b <= 255; b += 17) {
          const hex =
            "#" +
            [r, g, b]
              .map((channel) => channel.toString(16).padStart(2, "0"))
              .join("");

          expect(hslToHex(...hexToHsl(hex))).toBe(hex);
        }
      }
    }
  });

  it("treats hue as powerless at zero saturation", () => {
    for (const hue of [0, 60, 180, 359]) {
      expect(hslToHex(hue, 0, 50)).toBe("#808080");
    }
  });
});

describe("signed circular angle difference", () => {
  it.each([
    [359, 1, -2],
    [1, 359, 2],
    [360, 0, 0],
    [-1, 359, 0],
    [180, 0, -180],
    [25, 22, 3],
  ])("maps (%s, %s) to %s", (hue, reference, expected) => {
    expect(signedHueDifference(hue, reference)).toBe(expected);
  });

  it("rejects non-finite angles", () => {
    expect(() => signedHueDifference(NaN, 0)).toThrow(RangeError);
    expect(() => signedHueDifference(0, Infinity)).toThrow(RangeError);
  });
});
