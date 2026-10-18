import { afterEach, describe, expect, it, vi } from "vitest";

import * as color from "../src/color";
import type { Hsl } from "../src/color";
import {
  analyzeProfile,
  classifyContrastLevel,
  detectSeason,
  type ContrastLevel,
  type Depth,
  type EyeReflex,
  type HairReflex,
  type HairVolume,
  type Intensity,
  type ProfileReflexes,
  type SeasonId,
  type Undertone,
} from "../src/profile";

const DEFAULT_COLORS = ["#D4A574", "#6B4423", "#3D2B1F"] as const;

type SeasonCase = [
  skin: string,
  eyes: string,
  hair: string,
  skinReflex: Undertone,
  eyeReflex: EyeReflex,
  hairReflex: HairReflex,
  undertone: Undertone,
  depth: Depth,
  intensity: Intensity,
  seasonId: SeasonId,
];

// Fixture sintetiche della baseline: coprono le 18 combinazioni
// undertone × depth × intensity, non una popolazione biologica.
const SEASON_CASES: SeasonCase[] = [
  [
    "#000000",
    "#000000",
    "#000000",
    "neutral",
    "neutral",
    "neutral",
    "neutral",
    "deep",
    "low",
    "winter-cool",
  ],
  [
    "#000000",
    "#000000",
    "#000000",
    "neutral",
    "neutral",
    "copper",
    "warm",
    "deep",
    "low",
    "autumn-true",
  ],
  [
    "#000000",
    "#000000",
    "#000000",
    "neutral",
    "golden",
    "neutral",
    "neutral",
    "deep",
    "medium",
    "winter-true",
  ],
  [
    "#000000",
    "#000000",
    "#000000",
    "neutral",
    "golden",
    "copper",
    "warm",
    "deep",
    "high",
    "autumn-deep",
  ],
  [
    "#000000",
    "#000000",
    "#000000",
    "neutral",
    "grey",
    "ashy",
    "cool",
    "deep",
    "low",
    "winter-cool",
  ],
  [
    "#000000",
    "#000000",
    "#000000",
    "warm",
    "golden",
    "neutral",
    "warm",
    "deep",
    "medium",
    "autumn-warm",
  ],
  [
    "#000000",
    "#000000",
    "#000000",
    "cool",
    "golden",
    "neutral",
    "cool",
    "deep",
    "medium",
    "winter-true",
  ],
  [
    "#000000",
    "#000000",
    "#000000",
    "cool",
    "golden",
    "copper",
    "neutral",
    "deep",
    "high",
    "winter-bright",
  ],
  [
    "#000000",
    "#000000",
    "#ffffff",
    "cool",
    "golden",
    "ashy",
    "cool",
    "deep",
    "high",
    "winter-bright",
  ],
  [
    "#ffffff",
    "#000000",
    "#ffffff",
    "neutral",
    "neutral",
    "neutral",
    "neutral",
    "light",
    "low",
    "summer-soft",
  ],
  [
    "#ffffff",
    "#000000",
    "#ffffff",
    "neutral",
    "neutral",
    "copper",
    "warm",
    "light",
    "low",
    "spring-light",
  ],
  [
    "#ffffff",
    "#000000",
    "#ffffff",
    "neutral",
    "golden",
    "neutral",
    "neutral",
    "light",
    "medium",
    "summer-true",
  ],
  [
    "#ffffff",
    "#000000",
    "#ffffff",
    "neutral",
    "golden",
    "copper",
    "warm",
    "light",
    "high",
    "spring-warm",
  ],
  [
    "#ffffff",
    "#000000",
    "#ffffff",
    "neutral",
    "grey",
    "ashy",
    "cool",
    "light",
    "low",
    "summer-soft",
  ],
  [
    "#ffffff",
    "#000000",
    "#ffffff",
    "warm",
    "golden",
    "neutral",
    "warm",
    "light",
    "medium",
    "spring-true",
  ],
  [
    "#ffffff",
    "#000000",
    "#ffffff",
    "cool",
    "golden",
    "neutral",
    "cool",
    "light",
    "medium",
    "summer-light",
  ],
  [
    "#ffffff",
    "#000000",
    "#ffffff",
    "cool",
    "golden",
    "copper",
    "neutral",
    "light",
    "high",
    "summer-true",
  ],
  [
    "#ffffff",
    "#000000",
    "#808080",
    "cool",
    "golden",
    "ashy",
    "cool",
    "light",
    "high",
    "summer-true",
  ],
];

function mockNormalizedColors(skin: Hsl, eyes: Hsl, hair: Hsl): void {
  vi.spyOn(color, "normBioSkin").mockReturnValue(skin);
  vi.spyOn(color, "normBioEyes").mockReturnValue(eyes);
  vi.spyOn(color, "normBioHair").mockReturnValue(hair);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("profile analysis characterization", () => {
  it("preserves the default profile categories and numerical scores", () => {
    const result = analyzeProfile(...DEFAULT_COLORS);

    expect(result).toMatchObject({
      undertone: "warm",
      depth: "deep",
      intensity: "medium",
    });
    expect(result.utScore).toBeCloseTo(0.33656901467283606, 12);
    expect(result.depthScore).toBeCloseTo(56.30339733520764, 12);
    expect(result.intScore).toBeCloseTo(42.73664773650972, 12);
  });

  it.each([
    undefined,
    null,
    {},
    {
      skin: "neutral",
      eye: "neutral",
      hair: "neutral",
      hairVolume: "medium",
    },
  ] satisfies Array<ProfileReflexes | null | undefined>)(
    "preserves neutral defaults for reflexes %j",
    (reflexes) => {
      expect(analyzeProfile(...DEFAULT_COLORS, reflexes)).toEqual(
        analyzeProfile(...DEFAULT_COLORS),
      );
    },
  );

  it("preserves fallbacks for unknown persisted option values", () => {
    // @ts-expect-error Simulates legacy data that bypassed runtime validation.
    const invalid: ProfileReflexes = {
      skin: "unknown",
      eye: "unknown",
      hair: "unknown",
      hairVolume: "unknown",
    };

    expect(analyzeProfile(...DEFAULT_COLORS, invalid)).toEqual(
      analyzeProfile(...DEFAULT_COLORS),
    );
  });

  it.each([
    ["shaved", 0.3561570456743923],
    ["low", 0.3469854183092173],
    ["medium", 0.33656901467283606],
    ["high", 0.32930906213384376],
  ] satisfies Array<[HairVolume, number]>)(
    "preserves the dynamic undertone weight for %s hair volume",
    (hairVolume, expectedUtScore) => {
      const result = analyzeProfile(...DEFAULT_COLORS, { hairVolume });

      expect(result.utScore).toBeCloseTo(expectedUtScore, 12);
      expect(result.depthScore).toBeCloseTo(56.30339733520764, 12);
      expect(result.intScore).toBeCloseTo(42.73664773650972, 12);
    },
  );

  it("preserves the combined effect of warm reflexes", () => {
    const result = analyzeProfile(...DEFAULT_COLORS, {
      skin: "warm",
      eye: "golden",
      hair: "copper",
      hairVolume: "high",
    });

    expect(result).toMatchObject({
      undertone: "warm",
      depth: "deep",
      intensity: "high",
    });
    expect(result.utScore).toBeCloseTo(0.8699942065648945, 12);
    expect(result.depthScore).toBeCloseTo(56.30339733520764, 12);
    expect(result.intScore).toBeCloseTo(84.27990045985965, 12);
  });

  it("preserves the combined effect of cool reflexes and shaved hair", () => {
    const result = analyzeProfile(...DEFAULT_COLORS, {
      skin: "cool",
      eye: "grey",
      hair: "ashy",
      hairVolume: "shaved",
    });

    expect(result).toMatchObject({
      undertone: "neutral",
      depth: "deep",
      intensity: "medium",
    });
    expect(result.utScore).toBeCloseTo(-0.014278462198760845, 12);
    expect(result.depthScore).toBeCloseTo(56.30339733520764, 12);
    expect(result.intScore).toBeCloseTo(41.27990045985964, 12);
  });

  it("does not mutate the supplied reflexes", () => {
    const reflexes: ProfileReflexes = Object.freeze({
      skin: "warm",
      eye: "green",
      hair: "golden",
      hairVolume: "low",
    });
    const before = { ...reflexes };

    analyzeProfile(...DEFAULT_COLORS, reflexes);
    detectSeason(...DEFAULT_COLORS, reflexes);

    expect(reflexes).toEqual(before);
  });
});

describe("season detection characterization", () => {
  it.each(SEASON_CASES)(
    "preserves mapping for synthetic case %#",
    (
      skin,
      eyes,
      hair,
      skinReflex,
      eyeReflex,
      hairReflex,
      undertone,
      depth,
      intensity,
      seasonId,
    ) => {
      const reflexes: ProfileReflexes = {
        skin: skinReflex,
        eye: eyeReflex,
        hair: hairReflex,
        hairVolume: "medium",
      };
      const result = detectSeason(skin, eyes, hair, reflexes);

      expect(result).toMatchObject({ undertone, depth, intensity });
      expect(`${result.base}-${result.sub}`).toBe(seasonId);
      expect(result).toMatchObject(analyzeProfile(skin, eyes, hair, reflexes));
    },
  );

  it("returns domain data without presentation metadata", () => {
    const result = detectSeason(...DEFAULT_COLORS);

    expect(result).toMatchObject({ base: "autumn", sub: "warm" });
    expect(result).not.toHaveProperty("name");
    expect(result).not.toHaveProperty("nameEn");
    expect(result).not.toHaveProperty("emoji");
    expect(result).not.toHaveProperty("grad");
    expect(result).not.toHaveProperty("text");
    expect(result).not.toHaveProperty("desc");
  });
});

describe("profile threshold characterization with controlled HSL values", () => {
  it.each([
    [0, "low"],
    [22, "low"],
    [22.000001, "medium"],
    [45, "medium"],
    [45.000001, "high"],
  ] satisfies Array<[number, ContrastLevel]>)(
    "preserves contrast classification at deltaL=%s",
    (deltaL, expected) => {
      mockNormalizedColors([0, 0, 60], [0, 0, 40], [0, 0, 60 - deltaL]);

      expect(classifyContrastLevel("#000000", "#ffffff")).toBe(expected);
    },
  );

  it.each([
    [0.12 - 0.000001, "neutral"],
    [0.12 + 0.000001, "warm"],
    [-0.18 - 0.000001, "cool"],
    [-0.18 + 0.000001, "neutral"],
  ] satisfies Array<[number, Undertone]>)(
    "preserves undertone classification near score %s",
    (targetScore, expected) => {
      // Hair weight is zero; the eye undertone signal is zero.
      // The remaining weighted score is skinUt * 0.5 / 0.65.
      const skinHue = 22 + 22 * ((targetScore * 0.65) / 0.5);

      mockNormalizedColors([skinHue, 10, 40], [0, 0, 10], [0, 0, 40]);

      const result = analyzeProfile(...DEFAULT_COLORS);

      expect(result.utScore).toBeCloseTo(targetScore, 12);
      expect(result.undertone).toBe(expected);
    },
  );

  it.each([
    [52.000001, "light"],
    [52, "light"],
    [51.999999, "deep"],
  ] satisfies Array<[number, Depth]>)(
    "preserves depth classification for equal lightness %s",
    (lightness, expected) => {
      mockNormalizedColors(
        [0, 0, lightness],
        [0, 0, lightness],
        [0, 0, lightness],
      );

      const result = analyzeProfile(...DEFAULT_COLORS);

      expect(result.depthScore).toBeCloseTo(100 - lightness, 12);
      expect(result.depth).toBe(expected);
    },
  );

  it.each([
    [29.999999, "low"],
    [30.000001, "medium"],
    [54.999999, "medium"],
    [55.000001, "high"],
  ] satisfies Array<[number, Intensity]>)(
    "preserves intensity classification near score %s",
    (targetScore, expected) => {
      // Only the eye saturation contributes; equal skin/hair L removes
      // the contrast bonus. Floating-point boundaries are tested nearby.
      const eyeSaturation = (targetScore / 100) * 2 * 72;

      mockNormalizedColors([0, 0, 40], [0, eyeSaturation, 40], [0, 0, 40]);

      const result = analyzeProfile(...DEFAULT_COLORS);

      expect(result.intScore).toBeCloseTo(targetScore, 10);
      expect(result.intensity).toBe(expected);
    },
  );
});
