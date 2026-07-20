export type Hsl = [
  hueDegrees: number,
  saturationPercent: number,
  lightnessPercent: number,
];

export type HslNormalizer = (
  hueDegrees: number,
  saturationPercent: number,
  lightnessPercent: number
) => Hsl;


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
    minimumLightness
   + (maximumLightness - minimumLightness)
   * (sig - sig0)
   / (sig1 - sig0)
  );
}

function _powS(
  saturationPercent: number,
  gamma: number,
  maximumSaturation: number,
): number {
  return (
    Math.pow(Math.max(0, saturationPercent / 100), gamma)
    * maximumSaturation
  );
}


export function hexToHsl(hex: string): Hsl {
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

    s = l > 0.5
      ? d / (2 - max - min)
      : d / (max + min);

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
  lightnessPercent: number
): string {
  const h = ((hueDegrees % 360) + 360) %360;
  const s = Math.min(100, Math.max(0, saturationPercent)) / 100;
  const l = Math.min(100, Math.max(0, lightnessPercent)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
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
      .padStart(2, '0')
  );

  return `#${channels.join("")}`;
}

export function normFabric(
  hueDegrees: number,
  saturationPercent: number,
  lightnessPercent: number
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

export function normHex(
  hex: string,
  normalize: HslNormalizer,
): string {
  const [h, s, l] = hexToHsl(hex);
  const [normalizedH, normalizedS, normalizedL] = normalize(h, s, l);

  return hslToHex(normalizedH, normalizedS, normalizedL);
}
