/**
 * EURISTICHE LEGACY NON VALIDATE.
 *
 * Curve e range preservati per il confronto con la baseline.
 * Non sono calibrazione di fotografie, materiali o intervalli biologici.
 * Non usare queste funzioni come fondamento di nuove misure colorimetriche.
 */
import { hexToHsl, isHexColor, type Hsl, type HslNormalizer } from "./color";

export type BioComponent = "skin" | "eyes" | "hair";

type ChannelRange = Readonly<{
  min: number;
  max: number;
}>;

type BioColorRange = Readonly<{
  h: ChannelRange;
  s: ChannelRange;
  l: ChannelRange;
}>;

/**
 * Intervalli HSL euristici usati dalla baseline corrente.
 *
 * Questi valori non sono stati validati sperimentalmente e non devono essere
 * interpretati come intervalli biologici scientificamente dimostrati.
 */
export const BIO_RANGES = {
  skin: {
    h: { min: 0, max: 70 },
    l: { min: 20, max: 88 },
    s: { min: 2, max: 38 },
  },
  eyes: {
    h: { min: 0, max: 360 },
    l: { min: 15, max: 72 },
    s: { min: 3, max: 72 },
  },
  hair: {
    h: { min: 0, max: 90 },
    l: { min: 5, max: 82 },
    s: { min: 5, max: 55 },
  },
} as const satisfies Readonly<Record<BioComponent, BioColorRange>>;

function _sigL(
  lightnessPercent: number,
  minimumLightness: number,
  maximumLightness: number,
  k = 4.5,
): number {
  const x = lightnessPercent / 100;

  const sig = 1 / (1 + Math.exp(-k * (x - 0.5)));
  const sig0 = 1 / (1 + Math.exp(-k * (0 - 0.5)));
  const sig1 = 1 / (1 + Math.exp(-k * (1 - 0.5)));

  return (
    minimumLightness +
    ((maximumLightness - minimumLightness) * (sig - sig0)) / (sig1 - sig0)
  );
}

function _powS(
  saturationPercent: number,
  gamma: number,
  maximumSaturation: number,
): number {
  return (
    Math.pow(Math.max(0, saturationPercent / 100), gamma) * maximumSaturation
  );
}

export function normFabric(
  hueDegrees: number,
  saturationPercent: number,
  lightnessPercent: number,
): Hsl {
  return [
    hueDegrees,
    _powS(saturationPercent, 1.4, 68),
    _sigL(lightnessPercent, 5, 90),
  ];
}

export function normBioSkin(
  hueDegrees: number,
  saturationPercent: number,
  lightnessPercent: number,
): Hsl {
  return [
    hueDegrees,
    _powS(saturationPercent, 1.2, 38),
    _sigL(lightnessPercent, 20, 88, 3.5),
  ];
}

export function normBioEyes(
  hueDegrees: number,
  saturationPercent: number,
  lightnessPercent: number,
): Hsl {
  return [
    hueDegrees,
    _powS(saturationPercent, 1.6, 72),
    _sigL(lightnessPercent, 15, 72, 4),
  ];
}

export function normBioHair(
  hueDegrees: number,
  saturationPercent: number,
  lightnessPercent: number,
): Hsl {
  return [
    hueDegrees,
    _powS(saturationPercent, 1.3, 55),
    _sigL(lightnessPercent, 5, 82, 5),
  ];
}

export function validateBioColor(
  hex: string,
  component: BioComponent,
  normalize?: HslNormalizer,
): boolean {
  if (
    !isHexColor(hex) ||
    (component !== "skin" && component !== "eyes" && component !== "hair")
  ) {
    return false;
  }

  const [h, s, l] = hexToHsl(hex);
  const normalizedHsl = normalize ? normalize(h, s, l) : [h, s, l];

  if (
    !Array.isArray(normalizedHsl) ||
    normalizedHsl.length !== 3 ||
    !normalizedHsl.every(Number.isFinite)
  ) {
    return false;
  }

  const [normalizedH, normalizedS, normalizedL] = normalizedHsl;
  const ranges = BIO_RANGES[component];

  return (
    normalizedH >= ranges.h.min &&
    normalizedH <= ranges.h.max &&
    normalizedS >= ranges.s.min &&
    normalizedS <= ranges.s.max &&
    normalizedL >= ranges.l.min &&
    normalizedL <= ranges.l.max
  );
}
