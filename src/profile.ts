import { hexToHsl, signedHueDifference } from "./color";
import { normBioEyes, normBioHair, normBioSkin } from "./color_heuristics";

export const PROFILE_MODEL_VERSION = "hsl-heuristic-2" as const;

export type Undertone = "warm" | "cool" | "neutral";
export type Depth = "light" | "deep";
export type Intensity = "low" | "medium" | "high";
export type ContrastLevel = "low" | "medium" | "high";

export type EyeReflex = "golden" | "green" | "grey" | "neutral";
export type HairReflex = "copper" | "golden" | "ashy" | "neutral";
export type HairVolume = "shaved" | "low" | "medium" | "high";

export type ProfileReflexes = Readonly<{
  skin?: Undertone;
  eye?: EyeReflex;
  hair?: HairReflex;
  hairVolume?: HairVolume;
}>;

export type NormalizedProfileReflexes = Readonly<Required<ProfileReflexes>>;

/** Ripristina i default per opzioni mancanti o non riconosciute. */
export function normalizeProfileReflexes(
  value: unknown,
): NormalizedProfileReflexes {
  const input =
    value !== null && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  const { skin, eye, hair, hairVolume } = input;

  return {
    skin: skin === "warm" || skin === "cool" ? skin : "neutral",
    eye:
      eye === "golden" || eye === "green" || eye === "grey" ? eye : "neutral",
    hair:
      hair === "copper" || hair === "golden" || hair === "ashy"
        ? hair
        : "neutral",
    hairVolume:
      hairVolume === "shaved" || hairVolume === "low" || hairVolume === "high"
        ? hairVolume
        : "medium",
  };
}

export type ProfileAnalysis = Readonly<{
  modelVersion: typeof PROFILE_MODEL_VERSION;
  validationStatus: "unvalidated";
  undertone: Undertone;
  depth: Depth;
  intensity: Intensity;
  utScore: number;
  depthScore: number;
  intScore: number;
}>;

export type SeasonClassification =
  | Readonly<{ base: "spring"; sub: "light" | "warm" | "true" }>
  | Readonly<{ base: "summer"; sub: "soft" | "light" | "true" }>
  | Readonly<{ base: "autumn"; sub: "deep" | "warm" | "true" }>
  | Readonly<{ base: "winter"; sub: "cool" | "bright" | "true" }>;

type SeasonIdOf<T extends SeasonClassification> = T extends SeasonClassification
  ? `${T["base"]}-${T["sub"]}`
  : never;

export type SeasonId = SeasonIdOf<SeasonClassification>;
export type SeasonAnalysis = ProfileAnalysis & SeasonClassification;

/**
 * Baseline euristica: nessuna soglia, curva o ponderazione di questo modulo
 * è calibrata sperimentalmente. I punteggi non sono probabilità.
 * La chiave "eye" conserva il contratto corrente della UI e dei dati salvati.
 */
const VOLUME_MULT: Readonly<Record<HairVolume, number>> = {
  shaved: 0.1,
  low: 0.4,
  medium: 0.75,
  high: 1.0,
};

const REFLEX_UNDERTONE = {
  skin: { warm: 0.5, cool: -0.5, neutral: 0 },
  eye: { golden: 0.15, green: -0.08, grey: -0.18, neutral: 0 },
  hair: { copper: 0.28, golden: 0.18, ashy: -0.22, neutral: 0 },
} as const;

const WARM_THRESHOLD = 0.12;
const COOL_THRESHOLD = -0.18;

/** Contrasto euristico tra lightness HSL normalizzate; non è contrasto WCAG. */
export function classifyContrastLevel(
  skin: string,
  hair: string,
): ContrastLevel {
  const [, , lSkinN] = normBioSkin(...hexToHsl(skin));
  const [, , lHairN] = normBioHair(...hexToHsl(hair));
  const deltaL = Math.abs(lSkinN - lHairN);

  return deltaL > 45 ? "high" : deltaL > 22 ? "medium" : "low";
}

export function analyzeProfile(
  skin: string,
  eyes: string,
  hair: string,
  reflexes?: ProfileReflexes | null,
): ProfileAnalysis {
  const options = normalizeProfileReflexes(reflexes);
  const [hSk, sSk, lSk] = normBioSkin(...hexToHsl(skin));
  const [hEy, sEy, lEy] = normBioEyes(...hexToHsl(eyes));
  const [hHr, sHr, lHr] = normBioHair(...hexToHsl(hair));

  // Proxy euristica della riflettività, derivata da S e L HSL.
  const hairReflectivity =
    sHr * Math.sin((Math.max(0, lHr - 5) / 77) * Math.PI);
  const hairReflNorm = hairReflectivity / 55;
  const volMult = VOLUME_MULT[options.hairVolume ?? "medium"] ?? 0.75;
  const hairSignalWeight = hairReflNorm * volMult;

  // Correzione geometrica locale: 0° e 360° sono lo stesso angolo.
  // Il proxy e le sue soglie restano euristici; lo scarto orientato
  // ha un punto di scelta del verso a 180° dalla reference.
  const skinHueValid = sSk > 3;
  const skinUt = skinHueValid
    ? Math.max(-1.5, Math.min(1.5, signedHueDifference(hSk, 22) / 22))
    : 0;

  let hairUt = 0;
  if (lHr > 12 && sHr > 5) {
    hairUt = Math.max(-1, Math.min(1, signedHueDifference(hHr, 30) / 40));
  }

  let eyeUt = 0;
  if (sEy > 12) {
    if (hEy > 75 && hEy < 170) eyeUt = -0.2;
    else if (hEy > 170 && hEy < 250) eyeUt = -0.35;
    else if (hEy < 45 || hEy > 320) eyeUt = 0.25;
  } else {
    eyeUt = lEy < 20 ? 0 : -0.15;
  }

  // Pesi dinamici euristici; la divisione conserva la baseline.
  const hairW = hairSignalWeight * 0.5;
  const skinW = 0.5 - hairW * 0.3;
  const eyeW = 0.15;
  const total = hairW + skinW + eyeW;
  let utScore = (skinUt * skinW + hairUt * hairW + eyeUt * eyeW) / total;

  const distToThreshold = Math.min(
    Math.abs(utScore - WARM_THRESHOLD),
    Math.abs(utScore - COOL_THRESHOLD),
  );
  const reflexScale = Math.max(0.15, 1 - distToThreshold / 0.5);

  if (options.skin) {
    utScore += (REFLEX_UNDERTONE.skin[options.skin] ?? 0) * reflexScale;
  }
  if (options.eye) {
    utScore += (REFLEX_UNDERTONE.eye[options.eye] ?? 0) * reflexScale;
  }
  if (options.hair) {
    utScore +=
      (REFLEX_UNDERTONE.hair[options.hair] ?? 0) * reflexScale * volMult;
  }

  const undertone: Undertone =
    utScore > WARM_THRESHOLD
      ? "warm"
      : utScore < COOL_THRESHOLD
        ? "cool"
        : "neutral";

  // Depth: pesi euristici 55/35/10, soglia strettamente maggiore di 48.
  const depthScore = 100 - (lSk * 0.55 + lHr * 0.35 + lEy * 0.1);
  const depth: Depth = depthScore > 48 ? "deep" : "light";

  const eyeSNorm = sEy / 72;
  const hairSNorm = sHr / 55;
  const skinSNorm = sSk / 38;

  // Segnali discreti euristici; "neutral" usa la saturazione normalizzata.
  const eyeIntensity = {
    golden: 0.78,
    green: 0.62,
    grey: 0.28,
    neutral: eyeSNorm,
  };
  const hairIntensity = {
    copper: 0.88,
    golden: 0.65,
    ashy: 0.28,
    neutral: hairSNorm,
  };

  const eyeIntVal = eyeIntensity[options.eye ?? "neutral"] ?? eyeSNorm;
  const hairIntVal = hairIntensity[options.hair ?? "neutral"] ?? hairSNorm;
  const contrastBonus = Math.abs(lSk - lHr) / 82;

  // Conserva ordine delle operazioni e assenza di clamp della baseline.
  let intScore =
    eyeIntVal * 0.5 + hairIntVal * 0.3 + skinSNorm * 0.2 + contrastBonus * 0.15;
  intScore *= 100;

  const intensity: Intensity =
    intScore > 55 ? "high" : intScore < 30 ? "low" : "medium";

  return {
    modelVersion: PROFILE_MODEL_VERSION,
    validationStatus: "unvalidated",
    undertone,
    depth,
    intensity,
    utScore,
    depthScore,
    intScore,
  };
}

/** Mappatura estetica euristica; non restituisce confidenza o probabilità. */
export function detectSeason(
  skin: string,
  eyes: string,
  hair: string,
  reflexes?: ProfileReflexes | null,
): SeasonAnalysis {
  const profile = analyzeProfile(skin, eyes, hair, reflexes);
  const { undertone, depth, intensity } = profile;

  let season: SeasonClassification;

  if (undertone === "warm" && depth === "light") {
    season = {
      base: "spring",
      sub:
        intensity === "low" ? "light" : intensity === "high" ? "warm" : "true",
    };
  } else if (undertone === "warm" && depth === "deep") {
    season = {
      base: "autumn",
      sub:
        intensity === "high"
          ? "deep"
          : intensity === "medium"
            ? "warm"
            : "true",
    };
  } else if (undertone === "cool" && depth === "light") {
    season = {
      base: "summer",
      sub:
        intensity === "low" ? "soft" : intensity === "high" ? "true" : "light",
    };
  } else if (undertone === "cool" && depth === "deep") {
    season = {
      base: "winter",
      sub:
        intensity === "low" ? "cool" : intensity === "high" ? "bright" : "true",
    };
  } else if (depth === "light") {
    season = {
      base: "summer",
      sub: intensity === "low" ? "soft" : "true",
    };
  } else {
    season = {
      base: "winter",
      sub:
        intensity === "low" ? "cool" : intensity === "high" ? "bright" : "true",
    };
  }

  return { ...profile, ...season };
}
