export type Hsl = [
  hueDegrees: number,
  saturationPercent: number,
  lightnessPercent: number,
];

export type HslNormalizer = (
  hueDegrees: number,
  saturationPercent: number,
  lightnessPercent: number,
) => Hsl;

/**
 * Conversioni di colori sRGB opachi a 8 bit.
 * Riferimento: CSS Color 4, CRD 2026-10-09, sezioni 7.1 e 7.2.
 * https://www.w3.org/TR/2026/CRD-css-color-4-20261009/
 *
 * HSL non è percettivamente uniforme.
 * Per gli acromatici si conserva H=0 come convenzione rappresentativa.
 */
/** Contratto applicativo: HEX sRGB opaco a sei cifre, senza spazi. */
export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

function assertFiniteHsl(h: number, s: number, l: number): void {
  if (![h, s, l].every(Number.isFinite)) {
    throw new RangeError("Le coordinate HSL devono essere numeri finiti.");
  }
}

/**
 * Scarto angolare orientato lungo l'arco più breve, in [-180, 180).
 * A 180° i due versi sono equivalenti: questa API sceglie -180°.
 * Principio: CSS Color 4, sezione 13.5 (hue interpolation).
 * Non è una misura di distanza percettiva.
 */
export function signedHueDifference(hue: number, reference: number): number {
  if (![hue, reference].every(Number.isFinite)) {
    throw new RangeError("Gli angoli devono essere numeri finiti.");
  }

  const h = ((hue % 360) + 360) % 360;
  const r = ((reference % 360) + 360) % 360;

  return ((h - r + 540) % 360) - 180;
}

export function hexToHsl(hex: string): Hsl {
  if (!isHexColor(hex)) {
    throw new TypeError("Il colore deve avere il formato #RRGGBB.");
  }

  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;

    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [h * 360, s * 100, l * 100];
}

export function hslToHex(
  hueDegrees: number,
  saturationPercent: number,
  lightnessPercent: number,
): string {
  assertFiniteHsl(hueDegrees, saturationPercent, lightnessPercent);

  const h = ((hueDegrees % 360) + 360) % 360;
  const s = Math.min(100, Math.max(0, saturationPercent)) / 100;
  const l = Math.min(100, Math.max(0, lightnessPercent)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const channels = [r, g, b].map((value) =>
    Math.round((value + m) * 255)
      .toString(16)
      .padStart(2, "0"),
  );

  return `#${channels.join("")}`;
}

/** Applica una trasformazione HSL; non ne certifica il significato fisico. */
export function normHex(hex: string, normalize: HslNormalizer): string {
  const [h, s, l] = hexToHsl(hex);
  const [normalizedH, normalizedS, normalizedL] = normalize(h, s, l);

  return hslToHex(normalizedH, normalizedS, normalizedL);
}
