import { useState, useCallback, useEffect, useRef, createContext, useContext, useMemo } from "react";
import { RefreshCw, ChevronRight, User, Shirt, LayoutGrid, X, Check, Sun, Moon } from "lucide-react";

// ─── Color math ───────────────────────────────────────────────────────────────
function hexToHsl(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255,
    g = parseInt(hex.slice(3, 5), 16) / 255,
    b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.min(100, Math.max(0, s));
  l = Math.min(100, Math.max(0, l));
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
  return "#" + [r, g, b].map(v => Math.round((v + m) * 255).toString(16).padStart(2, "0")).join("");
}

function contrastColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) > 145 ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.95)";
}

// ─── Screen → Real-world normalization ────────────────────────────────────────
function _sigL(l, lMin, lMax, k = 4.5) {
  const x = l / 100;
  const sig  = 1 / (1 + Math.exp(-k * (x - 0.5)));
  const sig0 = 1 / (1 + Math.exp(-k * (0   - 0.5)));
  const sig1 = 1 / (1 + Math.exp(-k * (1   - 0.5)));
  return lMin + (lMax - lMin) * (sig - sig0) / (sig1 - sig0);
}

function _powS(s, gamma, maxS) {
  return Math.pow(Math.max(0, s) / 100, gamma) * maxS;
}

function normFabric(h, s, l) {
  return [h, _powS(s, 1.4, 68), _sigL(l, 5, 90)];
}

function normBioSkin(h, s, l) {
  return [h, _powS(s, 1.2, 38), _sigL(l, 20, 88, 3.5)];
}

function normBioEyes(h, s, l) {
  return [h, _powS(s, 1.6, 72), _sigL(l, 15, 72, 4.0)];
}

function normBioHair(h, s, l) {
  return [h, _powS(s, 1.3, 55), _sigL(l, 5, 82, 5.0)];
}

function normHex(hex, normFn) {
  const [h, s, l] = hexToHsl(hex);
  const [hn, sn, ln] = normFn(h, s, l);
  return hslToHex(hn, sn, ln);
}

// ─── Bio-plausible HSL ranges ─────────────────────────────────────────────────
const BIO_RANGES = {
  skin: { h: { min: 0, max: 70 }, l: { min: 20, max: 88 }, s: { min: 2, max: 38 } },
  hair: { h: { min: 0, max: 90 }, l: { min: 5,  max: 82 }, s: { min: 5, max: 55 } },
  eyes: { h: { min: 0, max: 360 }, l: { min: 15, max: 72 }, s: { min: 3, max: 72 } },
};

function validateBioColor(hex, component, normFn) {
  const [h, s, l] = hexToHsl(hex);
  const [hn, sn, ln] = normFn ? normFn(h, s, l) : [h, s, l];
  const ranges = BIO_RANGES[component];
  if (!ranges) return false;
  return hn >= ranges.h.min && hn <= ranges.h.max &&
    sn >= ranges.s.min && sn <= ranges.s.max &&
    ln >= ranges.l.min && ln <= ranges.l.max;
}

// ─── Garment weights ──────────────────────────────────────────────────────────
const GARMENT_BASE_WEIGHTS = { cappello: 30, giubbotto: 32, pantalone: 30, felpa: 28, maglia: 25, scarpe: 12, cintura: 5, calzini: 4 };

function computeGarmentWeights(presentIds) {
  const w = {};
  for (const id of presentIds) w[id] = GARMENT_BASE_WEIGHTS[id] || 8;
  if (presentIds.includes("giubbotto")) {
    if (w.felpa  !== undefined) w.felpa  *= 0.35;
    if (w.maglia !== undefined) w.maglia *= 0.12;
  } else if (presentIds.includes("felpa")) {
    if (w.maglia !== undefined) w.maglia *= 0.30;
  }
  if (presentIds.includes("cappello") && presentIds.includes("giubbotto")) {
    w.cappello *= 0.75;
  }
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  const result = {};
  for (const [id, val] of Object.entries(w)) result[id] = total > 0 ? Math.round(val / total * 100) : 0;
  return result;
}

function classifyContrastLevel(skin, hair) {
  const [,, lSkinN] = normBioSkin(...hexToHsl(skin));
  const [,, lHairN] = normBioHair(...hexToHsl(hair));
  const deltaL = Math.abs(lSkinN - lHairN);
  return deltaL > 45 ? "high" : deltaL > 22 ? "medium" : "low";
}

// ─── 12-season system ─────────────────────────────────────────────────────────
const SEASONS = {
  "spring-true":   { name: "Primavera Pura",    nameEn: "True Spring",    emoji: "🌷", grad: ["#f5c890", "#e8a060"], text: "#5a2008", desc: "Sottotono caldo · toni freschi e bilanciati" },
  "spring-light":  { name: "Primavera Chiara",  nameEn: "Light Spring",   emoji: "🌸", grad: ["#fce8c0", "#f5b87a"], text: "#6b2e08", desc: "Sottotono caldo · luminoso e delicato" },
  "spring-warm":   { name: "Primavera Calda",   nameEn: "Warm Spring",    emoji: "🌼", grad: ["#f7c070", "#e89040"], text: "#5a2008", desc: "Sottotono caldo intenso · colori brillanti" },
  "summer-true":   { name: "Estate Pura",       nameEn: "True Summer",    emoji: "🌸", grad: ["#c8d8ec", "#98b8d8"], text: "#0a1e40", desc: "Sottotono freddo · toni medi e polverosi" },
  "summer-light":  { name: "Estate Chiara",     nameEn: "Light Summer",   emoji: "☀️", grad: ["#dce8f5", "#b0c8e8"], text: "#1a2848", desc: "Sottotono freddo · pastello aerei" },
  "summer-soft":   { name: "Estate Tenue",      nameEn: "Soft Summer",    emoji: "🌅", grad: ["#d0c8e0", "#a8a0c8"], text: "#2a2050", desc: "Neutro-freddo · muted, la più desaturata" },
  "autumn-true":   { name: "Autunno Puro",      nameEn: "True Autumn",    emoji: "🍁", grad: ["#a87040", "#705020"], text: "#fff",    desc: "Sottotono caldo · toni terrosi e ricchi" },
  "autumn-warm":   { name: "Autunno Caldo",     nameEn: "Warm Autumn",    emoji: "🎃", grad: ["#c07830", "#884010"], text: "#fff",    desc: "Sottotono caldo intenso · dorato e saturo" },
  "autumn-deep":   { name: "Autunno Profondo",  nameEn: "Deep Autumn",    emoji: "🍂", grad: ["#8b5030", "#5a2808"], text: "#fff",    desc: "Sottotono caldo · scuro e ad alto contrasto" },
  "winter-true":   { name: "Inverno Puro",      nameEn: "True Winter",    emoji: "🌨️", grad: ["#384878", "#101530"], text: "#fff",    desc: "Sottotono freddo · contrasto netto" },
  "winter-cool":   { name: "Inverno Freddo",    nameEn: "Cool Winter",    emoji: "❄️", grad: ["#304080", "#101840"], text: "#fff",    desc: "Sottotono molto freddo · puri e distinti" },
  "winter-bright": { name: "Inverno Brillante", nameEn: "Bright Winter",  emoji: "💎", grad: ["#4060a8", "#181840"], text: "#fff",    desc: "Freddo ad alta intensità · vivido e nitido" },
  "neutral-light-low":    { name: "Estate Tenue",      nameEn: "Soft Summer",    emoji: "🌅", grad: ["#d0c8e0", "#a8a0c8"], text: "#2a2050", desc: "Neutro · delicato e polveroso" },
  "neutral-light-medium": { name: "Primavera Pura",    nameEn: "True Spring",    emoji: "🌷", grad: ["#f5c890", "#e8a060"], text: "#5a2008", desc: "Neutro-caldo · bilanciato" },
  "neutral-light-high":   { name: "Estate Pura",       nameEn: "True Summer",    emoji: "🌸", grad: ["#c8d8ec", "#98b8d8"], text: "#0a1e40", desc: "Neutro-freddo · vivido e fresco" },
  "neutral-deep-low":     { name: "Autunno Puro",      nameEn: "True Autumn",    emoji: "🍁", grad: ["#a87040", "#705020"], text: "#fff",    desc: "Neutro · terroso e profondo" },
  "neutral-deep-medium":  { name: "Inverno Puro",      nameEn: "True Winter",    emoji: "🌨️", grad: ["#384878", "#101530"], text: "#fff",    desc: "Neutro · contrasto deciso" },
  "neutral-deep-high":    { name: "Inverno Brillante", nameEn: "Bright Winter",  emoji: "💎", grad: ["#4060a8", "#181840"], text: "#fff",    desc: "Neutro-freddo · molto vivido" },
};

// ─── Color fit evaluation ─────────────────────────────────────────────────────
function evaluateNeutralFit(fL, comboFabricHSL) {
  const isNearBlack = fL < 12;
  const isNearWhite = fL > 82;
  if (isNearBlack) {
    const darkChromatic = comboFabricHSL.filter(([, cs, cl]) => cl < 22 && cs > 18);
    return darkChromatic.length > 0 ? 1 : 0;
  }
  if (isNearWhite) {
    const veryHighSat = comboFabricHSL.filter(([, cs]) => cs > 52);
    return veryHighSat.length > 0 ? 1 : 0;
  }
  return 0;
}

function evaluateColorFit(hex, profile, comboHexes = [], material = "normal", weight = 25) {
  const [h, s, l] = hexToHsl(hex);
  const [, fS, fL] = normFabric(h, s, l);

  if (material === "jeans") {
    const darkNeutrals = comboHexes.filter(c => {
      const [, fSc, fLc] = normFabric(...hexToHsl(c));
      return fLc < 18 && fSc < 12;
    });
    return darkNeutrals.length >= 2 ? 1 : 0;
  }

  const wf = weight > 25 ? 1.0 : weight > 10 ? 0.75 : 0.5;

  if (fS < 6) {
    const comboFabricHSL = comboHexes.map(c => normFabric(...hexToHsl(c)));
    return Math.round(evaluateNeutralFit(fL, comboFabricHSL) * wf);
  }

  let penalty = 0;
  if (fS > 30) {
    const isWarmHue = h < 70 || h > 310;
    const isCoolHue = h > 165 && h < 280;
    if (profile.undertone === "warm" && isCoolHue && fS > 36) penalty += 1;
    if (profile.undertone === "cool" && isWarmHue && fS > 36) penalty += 1;
  }
  if (profile.depth === "deep") { if (fL > 72) penalty += 1; }
  else                          { if (fL < 18) penalty += 1; }
  if (profile.intensity === "high")      { if (fS < 22) penalty += 1; }
  else if (profile.intensity === "low")  { if (fS > 50) penalty += 1; }

  const rawLevel = penalty === 0 ? 0 : penalty <= 1 ? 1 : penalty <= 2 ? 2 : 3;
  return Math.round(rawLevel * wf);
}

function evaluateComboFits(items) {
  const results = items.map(() => 0);
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i], b = items[j];
      const [hA, sA, lA] = hexToHsl(a.hex), [hB, sB, lB] = hexToHsl(b.hex);
      const [, fA, flA] = normFabric(hA, sA, lA);
      const [, fB, flB] = normFabric(hB, sB, lB);
      let problem = 0;

      if (flA < 22 && flB < 22 && fA < 14 && fB < 14) {
        const deltaL = Math.abs(flA - flB);
        if (deltaL < 8)       problem = Math.max(problem, 3);
        else if (deltaL < 16) problem = Math.max(problem, 2);
      }

      const hueDiff = Math.min(Math.abs(hA - hB), 360 - Math.abs(hA - hB));
      if (hueDiff < 20 && fA > 14 && fB > 14 && Math.abs(fA - fB) > 16) problem = Math.max(problem, 2);

      const aWarm = (hA < 70 || hA > 310) && fA > 24;
      const aCool = (hA > 165 && hA < 280) && fA > 24;
      const bWarm = (hB < 70 || hB > 310) && fB > 24;
      const bCool = (hB > 165 && hB < 280) && fB > 24;
      if ((aWarm && bCool) || (aCool && bWarm)) {
        const minF = Math.min(fA, fB);
        if (minF > 42)       problem = Math.max(problem, 3);
        else if (minF > 28)  problem = Math.max(problem, 2);
        else                 problem = Math.max(problem, 1);
      }

      if (problem > 0) {
        const loser = a.weight <= b.weight ? i : j;
        results[loser] = Math.max(results[loser], problem);
      }
    }
  }
  return results;
}

function FitBadge({ type, level }) {
  if (!type || level < 2) return null;
  const styles = {
    season: { bg: "#C07010", label: "Fuori Palette" },
    combo:  { bg: "#3A5A8A", label: "Combo Errata"  },
  };
  const s = styles[type];
  if (!s) return null;
  return (
    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: s.bg, color: "#fff", letterSpacing: "0.04em", flexShrink: 0, whiteSpace: "nowrap" }}>
      {s.label}
    </span>
  );
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function normalizeEntry(v) {
  if (!v) return { hex: "#8B7355", secondaries: [], pattern: "solid", material: "normal" };
  if (typeof v === "string") return { hex: v, secondaries: [], pattern: "solid", material: "normal" };
  return { hex: v.hex || "#8B7355", secondaries: v.secondaries || [], pattern: v.pattern || "solid", material: v.material || "normal" };
}

function avgHue(weightedHues) {
  const total = weightedHues.reduce((a, { w }) => a + w, 0);
  if (!total) return 0;
  const sx = weightedHues.reduce((a, { h, w }) => a + Math.cos(h * Math.PI / 180) * w, 0);
  const sy = weightedHues.reduce((a, { h, w }) => a + Math.sin(h * Math.PI / 180) * w, 0);
  return (((Math.atan2(sy / total, sx / total) * 180 / Math.PI) % 360) + 360) % 360;
}

function seededRand(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

function extractAnchorFromBiology(skin, eyes, hair) {
  const [hSkN,, lSkN] = normBioSkin(...hexToHsl(skin));
  const [hEyN]        = normBioEyes(...hexToHsl(eyes));
  const [hHrN,, lHrN] = normBioHair(...hexToHsl(hair));
  const anchorH = avgHue([{ h: hSkN, w: 0.50 }, { h: hHrN, w: 0.40 }, { h: hEyN, w: 0.10 }]);
  const profile = analyzeProfile(skin, eyes, hair, { skin: "neutral", eye: "neutral", hair: "neutral", hairVolume: "medium" });
  return {
    anchorH,
    contrastLevel: classifyContrastLevel(skin, hair),
    undertone: profile.undertone,
    depth: profile.depth,
    intensity: profile.intensity,
    utScore: profile.utScore,
    depthScore: profile.depthScore,
    intScore: profile.intScore,
    deltaL: Math.abs(lSkN - lHrN),
  };
}

// ─── Options ──────────────────────────────────────────────────────────────────
const UNDERTONE_OPTIONS = [
  { id: "warm",    label: "Caldo",  color: "#E8B86D" },
  { id: "neutral", label: "Neutro", color: "#C8B89A" },
  { id: "cool",    label: "Freddo", color: "#B0C4DE" },
];
const EYE_REFLEXES = [
  { id: "golden",  label: "Nocciola/Dorati", color: "#A0742A" },
  { id: "green",   label: "Verdi",           color: "#5A8A50" },
  { id: "grey",    label: "Grigi/Azzurri",   color: "#7890A8" },
  { id: "neutral", label: "Neutri",          color: "#8A8A8A" },
];
const HAIR_REFLEXES = [
  { id: "copper",  label: "Ramati/Rossi",  color: "#B85030" },
  { id: "golden",  label: "Dorati",        color: "#C0902A" },
  { id: "ashy",    label: "Cenere/Freddi", color: "#8090A0" },
  { id: "neutral", label: "Neutri",        color: "#8A8A8A" },
];
const HAIR_VOLUME_OPTIONS = [
  { id: "shaved", label: "Rasato" },
  { id: "low",    label: "Corto"  },
  { id: "medium", label: "Medio"  },
  { id: "high",   label: "Lungo"  },
];

// ─── Profile analysis ─────────────────────────────────────────────────────────
// Undertone pipeline:
//   1. Biological signals combined with dynamic hair weight (reflectivity × volume)
//   2. Reflex pickers applied with reflexScale — effect is strongest near classification
//      thresholds (|utScore - threshold| small) and attenuated when score is far from them.
//      This prevents pickers from overriding a strongly-classified profile while still
//      resolving borderline cases.
//
// Intensity pipeline:
//   Reflex pickers are the primary signal (0..1 scale), normalized S values are fallback
//   when picker is "neutral". This replaces the previous additive delta approach.
//
// Depth: unchanged — L of skin/hair/eyes only, no picker.

function analyzeProfile(skin, eyes, hair, reflexes) {
  const [hSk, sSk, lSk] = normBioSkin(...hexToHsl(skin));
  const [hEy, sEy, lEy] = normBioEyes(...hexToHsl(eyes));
  const [hHr, sHr, lHr] = normBioHair(...hexToHsl(hair));

  // ── Hair signal weight: reflectivity × volume ──────────────────────────────
  // reflectivity peaks at L≈41 (midpoint of [5,82]), zero at L=5 or L=82, zero at S=0
  const hairReflectivity = sHr * Math.sin(Math.max(0, lHr - 5) / 77 * Math.PI); // 0..55*1=55
  const hairReflNorm = hairReflectivity / 55; // 0..1
  const VOLUME_MULT = { shaved: 0.10, low: 0.40, medium: 0.75, high: 1.00 };
  const volMult = VOLUME_MULT[reflexes?.hairVolume] ?? 0.75;
  const hairSignalWeight = hairReflNorm * volMult; // 0..1, scales the 0.50 hair slot

  // Biological undertone scores (each roughly -1..+1, warm positive)
  const skinHueValid = sSk > 3;
  let skinUt = skinHueValid ? Math.max(-1.5, Math.min(1.5, (hSk - 22) / 22)) : 0;

  let hairUt = 0;
  if (lHr > 12 && sHr > 5) {
    hairUt = Math.max(-1, Math.min(1, (hHr - 30) / 40));
  }

  let eyeUt = 0;
  if (sEy > 12) {
    if      (hEy > 75  && hEy < 170) eyeUt = -0.20;
    else if (hEy > 170 && hEy < 250) eyeUt = -0.35;
    else if (hEy < 45  || hEy > 320) eyeUt = +0.25;
  } else {
    eyeUt = lEy < 20 ? 0 : -0.15;
  }

  // Dynamic weights: hair weight scales with signal strength, skin fills the gap
  const hairW = hairSignalWeight * 0.50;
  const skinW = 0.50 - hairW * 0.30; // skin gives up some weight as hair gains
  const eyeW  = 0.15;
  const total = hairW + skinW + eyeW;
  let utScore = (skinUt * skinW + hairUt * hairW + eyeUt * eyeW) / total;

  // Reflex pickers: apply with scale proportional to proximity to nearest threshold
  // Thresholds: warm > 0.12, cool < -0.18, neutral in between
  const WARM_T = 0.12, COOL_T = -0.18;
  const distToThreshold = Math.min(Math.abs(utScore - WARM_T), Math.abs(utScore - COOL_T));
  const reflexScale = Math.max(0.15, 1 - distToThreshold / 0.5);

  const RUT = { skin: { warm: +0.50, cool: -0.50, neutral: 0 },
                eye:  { golden: +0.15, green: -0.08, grey: -0.18, neutral: 0 },
                hair: { copper: +0.28, golden: +0.18, ashy: -0.22, neutral: 0 } };
  // Hair reflex also modulated by volume (low volume → less impact)
  const hairReflexMult = volMult;
  if (reflexes?.skin) utScore += (RUT.skin[reflexes.skin] ?? 0) * reflexScale;
  if (reflexes?.eye)  utScore += (RUT.eye [reflexes.eye ] ?? 0) * reflexScale;
  if (reflexes?.hair) utScore += (RUT.hair[reflexes.hair] ?? 0) * reflexScale * hairReflexMult;

  const undertone = utScore > WARM_T ? "warm" : utScore < COOL_T ? "cool" : "neutral";

  // ── Depth ──────────────────────────────────────────────────────────────────
  const depthScore = 100 - (lSk * 0.55 + lHr * 0.35 + lEy * 0.10);
  const depth = depthScore > 48 ? "deep" : "light";

  // ── Intensity ──────────────────────────────────────────────────────────────
  // Eye picker is primary (0..1), hair picker secondary, skin S as tertiary fallback.
  // "neutral" picker → use normalized S value of that component as fallback signal.
  const eyeSNorm  = sEy / 72;  // normBioEyes maxS=72
  const hairSNorm = sHr / 55;  // normBioHair maxS=55
  const skinSNorm = sSk / 38;  // normBioSkin maxS=38

  const EYE_INT  = { golden: 0.78, green: 0.62, grey: 0.28, neutral: eyeSNorm  };
  const HAIR_INT = { copper: 0.88, golden: 0.65, ashy: 0.28, neutral: hairSNorm };

  const eyeIntVal  = EYE_INT [reflexes?.eye  ?? "neutral"] ?? eyeSNorm;
  const hairIntVal = HAIR_INT[reflexes?.hair ?? "neutral"] ?? hairSNorm;

  // Contrast bonus: high skin/hair ΔL → higher intensity (normalized to 0..1)
  const contrastBonus = Math.abs(lSk - lHr) / 82;

  let intScore = eyeIntVal * 0.50 + hairIntVal * 0.30 + skinSNorm * 0.20 + contrastBonus * 0.15;
  // Normalize to roughly 0..100 for threshold compatibility
  intScore *= 100;

  const intensity = intScore > 55 ? "high" : intScore < 30 ? "low" : "medium";

  return { undertone, depth, intensity, utScore, depthScore, intScore };
}

// ─── Season detection ─────────────────────────────────────────────────────────
function detectSeason(skin, eyes, hair, reflexes) {
  const p = analyzeProfile(skin, eyes, hair, reflexes);
  const { undertone, depth, intensity } = p;

  let base, sub;
  if (undertone === "warm" && depth === "light") {
    base = "spring"; sub = intensity === "low" ? "light" : intensity === "high" ? "warm" : "true";
  } else if (undertone === "warm" && depth === "deep") {
    base = "autumn"; sub = intensity === "high" ? "deep" : intensity === "medium" ? "warm" : "true";
  } else if (undertone === "cool" && depth === "light") {
    base = "summer"; sub = intensity === "low" ? "soft" : intensity === "high" ? "true" : "light";
  } else if (undertone === "cool" && depth === "deep") {
    base = "winter"; sub = intensity === "low" ? "cool" : intensity === "high" ? "bright" : "true";
  } else {
    base = depth === "light" ? "summer" : "winter";
    sub  = intensity === "low" ? (depth === "light" ? "soft" : "cool") : intensity === "high" ? (depth === "light" ? "true" : "bright") : "true";
  }

  const seasonData = SEASONS[`${base}-${sub}`] || SEASONS[`${base}-true`];
  return { ...seasonData, ...p, base, sub };
}

// ─── Harmony pool ─────────────────────────────────────────────────────────────
function buildHarmonyPoolV2(type, profile, jitter = 0) {
  const FABRIC_SAT_CAP = { mono: 50, analog: 50, comp: 56, split: 48, triad: 48, tetrad: 48, neutral: 48, earth: 40, pastel: 34, deep: 56 };
  const maxS = FABRIC_SAT_CAP[type] || 50;
  const ssBase = profile.intensity === "high" ? 0.88 : profile.intensity === "low" ? 0.45 : 0.65;
  const sHigh = maxS * ssBase, sMid = maxS * ssBase * 0.72, sLow = maxS * ssBase * 0.48;
  const lMin = profile.depth === "deep" ? 18 : 32, lMax = profile.depth === "deep" ? 62 : 84;
  const cl = l => Math.max(lMin, Math.min(lMax, l));
  const cs = s => Math.min(maxS, Math.max(0, s));
  const utBias = profile.undertone === "warm" ? 8 : profile.undertone === "cool" ? -8 : 0;
  const H = ((profile.anchorH + utBias + jitter) % 360 + 360) % 360;
  const lMid = cl((lMin + lMax) / 2);
  const hueStep = profile.undertone === "warm" ? 24 : 34;
  switch (type) {
    case "mono":    return Array.from({ length: 8 }, (_, i) => hslToHex(H, cs(sMid * (0.7 + i * 0.04)), cl(lMin + i * ((lMax - lMin) / 7))));
    case "analog":  return [-50, -28, -12, 0, 12, 28, 50, 35].map((d, i) => hslToHex(H + d, cs(sMid), cl(lMid + [-8, 5, 12, 0, -10, 6, -5, 8][i])));
    case "comp": {
      const c = H + 180;
      return [
        ...[-12, 0, 12].map((d, i) => hslToHex(H + d, cs(sHigh), cl(lMid + [8, 0, -8][i]))),
        ...[-10, 0, 10].map((d, i) => hslToHex(c + d, cs(sMid), cl(lMid + [-5, 5, 0][i]))),
        hslToHex(H, cs(sLow * 0.4), cl(lMax - 5)),
        hslToHex(H, cs(sLow * 0.3), cl(lMin + 5)),
      ];
    }
    case "split": return [0, 8, -8, 150, 158, 210, 218, 165].map((d, i) => {
      const b = i < 3 ? H : i < 5 ? H + 150 : i < 7 ? H + 210 : H + 145;
      return hslToHex(b + (i < 3 ? [0, 8, -8][i] : i < 5 ? [0, 8][i - 3] : i < 7 ? [0, 8][i - 5] : 0), cs(sMid), cl(lMid + [-3, 8, -8, 0, 6, -5, 4, 2][i]));
    });
    case "triad":  return [0, 6, -6, 120, 126, 114, 240, 246].map((d, i) => hslToHex(H + d, cs(sMid), cl(lMid + [0, 8, -8, 4, -6, 10, -4, 6][i])));
    case "tetrad": return [0, 90, 180, 270, 6, 96, 186, 276].map((d, i) => hslToHex(H + d, cs(sMid * 0.9), cl(lMid + [0, 6, -6, 3, -3, 8, -5, 4][i])));
    case "neutral": {
      const nH = profile.undertone === "cool" ? 215 : 32;
      return [
        ...Array.from({ length: 4 }, (_, i) => hslToHex(nH, cs(8 + i * 3), cl(lMin + i * ((lMax - lMin) / 4)))),
        hslToHex(H, cs(sHigh), cl(lMid)),
        hslToHex(H + 180, cs(sMid), cl(lMid + 10)),
        hslToHex(nH, cs(5), cl(lMax - 8)),
        hslToHex(nH, cs(10), cl(lMin + 8)),
      ];
    }
    case "earth": {
      const eH = profile.undertone === "cool" ? [190, 200, 175, 160, 215, 230, 185, 170] : [22, 35, 48, 70, 15, 95, 28, 42];
      return eH.map((h, i) => hslToHex(h, cs(sMid * 0.75), cl(28 + i * 5)));
    }
    case "pastel": return Array.from({ length: 8 }, (_, i) => hslToHex(H + i * hueStep, cs(maxS * ssBase * 0.55), cl(lMax - 6 + i % 2 * 3)));
    case "deep":   return Array.from({ length: 8 }, (_, i) => hslToHex(H + i * hueStep, cs(sHigh), cl(lMin + i * 4)));
    default:       return Array.from({ length: 8 }, (_, i) => hslToHex(H + i * 22, cs(sMid), cl(lMid)));
  }
}

function garmentWeightedHues(entry) {
  const e = normalizeEntry(entry);
  const primaryPct = 100 - (e.secondaries || []).reduce((a, s) => a + s.pct, 0);
  const result = [{ h: hexToHsl(e.hex)[0], w: Math.max(0, primaryPct) }];
  for (const s of (e.secondaries || [])) { if (s.hex) result.push({ h: hexToHsl(s.hex)[0], w: s.pct }); }
  return result;
}

// ─── Season anchor color sets ─────────────────────────────────────────────────
const SEASON_ANCHORS = {
  "spring-true":   [[28,52,62],[72,46,58],[12,48,55],[155,38,52],[195,34,58],[48,42,65]],
  "spring-light":  [[32,38,72],[18,32,68],[85,28,70],[175,24,68],[210,22,72],[55,30,74]],
  "spring-warm":   [[22,60,58],[8,56,52],[45,58,60],[95,44,54],[165,38,50],[30,52,64]],
  "summer-true":   [[215,32,58],[265,24,62],[185,28,55],[330,22,60],[170,26,52],[240,20,65]],
  "summer-light":  [[205,22,72],[255,18,70],[175,20,68],[315,16,72],[190,18,75],[230,16,76]],
  "summer-soft":   [[220,18,60],[270,14,58],[195,16,55],[340,12,62],[210,14,52],[250,12,64]],
  "autumn-true":   [[28,52,42],[15,58,38],[48,48,45],[90,38,40],[165,30,38],[55,44,48]],
  "autumn-warm":   [[22,62,48],[8,65,42],[38,58,44],[85,48,42],[35,55,38],[18,60,52]],
  "autumn-deep":   [[20,58,32],[8,62,28],[40,52,35],[95,42,30],[165,34,32],[55,48,28]],
  "winter-true":   [[215,52,42],[265,48,45],[185,40,38],[330,44,40],[240,50,35],[195,42,48]],
  "winter-cool":   [[225,58,38],[275,52,42],[195,44,35],[315,50,36],[245,56,30],[210,46,44]],
  "winter-bright": [[220,65,48],[270,60,52],[185,52,42],[335,58,45],[250,62,38],[195,50,54]],
  "neutral-light-low":    [[220,18,60],[270,14,58],[195,16,55],[340,12,62],[210,14,52],[250,12,64]],
  "neutral-light-medium": [[28,52,62],[72,46,58],[12,48,55],[155,38,52],[195,34,58],[48,42,65]],
  "neutral-light-high":   [[215,32,58],[265,24,62],[185,28,55],[330,22,60],[170,26,52],[240,20,65]],
  "neutral-deep-low":     [[28,52,42],[15,58,38],[48,48,45],[90,38,40],[165,30,38],[55,44,48]],
  "neutral-deep-medium":  [[215,52,42],[265,48,45],[185,40,38],[330,44,40],[240,50,35],[195,42,48]],
  "neutral-deep-high":    [[220,65,48],[270,60,52],[185,52,42],[335,58,45],[250,62,38],[195,50,54]],
};

// ─── Anchor resolution ────────────────────────────────────────────────────────
function resolveAnchorH(fixedEntries, garmentWeights, seasonKey, rand) {
  if (fixedEntries.length > 0) {
    const [domId, domEntry] = fixedEntries.reduce((best, cur) =>
      (garmentWeights[cur[0]] || 0) > (garmentWeights[best[0]] || 0) ? cur : best
    );
    const domWeight = garmentWeights[domId] || 10;
    const weightedHues = garmentWeightedHues(domEntry).map(({ h, w }) => ({ h, w: w * (domWeight / 100) }));
    for (const [id, entry] of fixedEntries) {
      if (id === domId) continue;
      const gw = (garmentWeights[id] || 5) / 100;
      for (const { h, w } of garmentWeightedHues(entry)) weightedHues.push({ h, w: w * gw });
    }
    return avgHue(weightedHues);
  }
  const anchors = SEASON_ANCHORS[seasonKey] || SEASON_ANCHORS["spring-true"];
  return anchors[Math.floor(rand() * anchors.length)][0];
}

// ─── Secondary hex extraction ─────────────────────────────────────────────────
function secondaryHexes(entry) {
  return (entry.secondaries || []).filter(s => s.hex).map(s => s.hex);
}

// ─── In-context evaluation ────────────────────────────────────────────────────
function evaluateInContext(hex, material, weight, profile, assignedItems) {
  const assignedHexes = assignedItems.flatMap(it => [it.hex, ...secondaryHexes(it)]);
  const seasonLevel = evaluateColorFit(hex, profile, assignedHexes, material, weight);
  const comboItems = [
    ...assignedItems.map(it => ({ hex: it.hex, weight: it.weight })),
    { hex, weight },
  ];
  const comboResults = evaluateComboFits(comboItems);
  return { season: seasonLevel, combo: comboResults[comboResults.length - 1] };
}

// ─── Targeted correction ──────────────────────────────────────────────────────
// 4 axes: undertone → depth → intensity → contrast. 3 steps per axis (12 total).
// Uses continuous profile scores for calibrated targets.
// Fallback: contextual neutral.
const _STEP_H = 5, _STEP_L = 6, _STEP_S = 8, _STEPS_PER_AXIS = 3;

function correctColor(hex, material, weight, profile, assignedItems) {
  let [h, s, l] = hexToHsl(hex);

  const check = () => {
    const c = hslToHex(h, s, l);
    const { season, combo } = evaluateInContext(c, material, weight, profile, assignedItems);
    return { ok: season < 2 && combo < 2, hex: c };
  };

  // Undertone: shift H toward warm or cool pole
  for (let k = 0; k < _STEPS_PER_AXIS; k++) {
    const { ok, hex: c } = check();
    if (ok) return c;
    const [, fS] = normFabric(h, s, l);
    if (fS > 24) {
      if (profile.undertone === "warm") h = ((h - _STEP_H) + 360) % 360;
      else if (profile.undertone === "cool") h = (h + _STEP_H) % 360;
    }
  }

  // Depth: continuous target from depthScore (higher depthScore → darker target)
  const targetL = Math.max(15, Math.min(80, 100 - profile.depthScore));
  for (let k = 0; k < _STEPS_PER_AXIS; k++) {
    const { ok, hex: c } = check();
    if (ok) return c;
    l = Math.max(5, Math.min(90, l + (l < targetL ? _STEP_L : -_STEP_L)));
  }

  // Intensity: continuous target from intScore (0..100 mapped to fabric S range)
  const targetS = Math.max(5, Math.min(62, profile.intScore * 0.62));
  for (let k = 0; k < _STEPS_PER_AXIS; k++) {
    const { ok, hex: c } = check();
    if (ok) return c;
    s = Math.max(0, Math.min(68, s + (s < targetS ? _STEP_S : -_STEP_S)));
  }

  // Contrast: push L away from heaviest assigned item
  if (assignedItems.length > 0) {
    const [,, refL] = normFabric(...hexToHsl(assignedItems[0].hex));
    for (let k = 0; k < _STEPS_PER_AXIS; k++) {
      const { ok, hex: c } = check();
      if (ok) return c;
      const [,, myL] = normFabric(h, s, l);
      l = Math.max(5, Math.min(90, l + (myL < refL ? -_STEP_L : _STEP_L)));
    }
  }

  const { ok, hex: c } = check();
  if (ok) return c;

  return profile.depth === "deep" ? "#1a1a1a" : profile.depth === "light" ? "#f0f0f0" : "#888888";
}

// ─── Validate outfit balance ──────────────────────────────────────────────────
function validateOutfitBalance(items, profile) {
  const comboResults = evaluateComboFits(items);
  return items.map((item, i) => ({
    season: evaluateColorFit(
      item.hex, profile,
      items.filter((_, j) => j !== i).map(x => x.hex),
      item.material || "normal", item.weight || 25
    ),
    combo: comboResults[i],
  }));
}

// ─── Generate combo ───────────────────────────────────────────────────────────
function generateCombo(type, profile, fixedMap, excludedIds, seed, seasonKey) {
  const rand = seededRand(seed);
  const presentGarments = GARMENTS.filter(g => !excludedIds.includes(g.id));
  const presentIds = presentGarments.map(g => g.id);
  const garmentWeights = computeGarmentWeights(presentIds);
  const fixedEntries = Object.entries(fixedMap).filter(([id]) => !excludedIds.includes(id));

  const anchorH = resolveAnchorH(fixedEntries, garmentWeights, seasonKey, rand);
  const jitter = (rand() - 0.5) * 20; // ±10°

  let effectiveType = type;
  for (const [, entry] of fixedEntries) {
    if ((normalizeEntry(entry).pattern || "solid") !== "solid") { effectiveType = "mono"; break; }
  }

  const poolProfile = {
    anchorH: ((anchorH + jitter) % 360 + 360) % 360,
    undertone: profile.undertone,
    depth: profile.depth,
    intensity: profile.intensity,
  };
  const pool = buildHarmonyPoolV2(effectiveType, poolProfile, 0);

  const shuffledPool = [...pool];
  for (let i = shuffledPool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffledPool[i], shuffledPool[j]] = [shuffledPool[j], shuffledPool[i]];
  }

  const assignmentOrder = [...presentGarments].sort(
    (a, b) => (garmentWeights[b.id] || 0) - (garmentWeights[a.id] || 0)
  );

  const assignedMap = {};
  const usedPoolIdx = new Set();

  for (const g of assignmentOrder) {
    const weight = garmentWeights[g.id] || 5;

    if (fixedMap[g.id]) {
      const e = normalizeEntry(fixedMap[g.id]);
      const hexDisplay = normHex(e.hex, normFabric);
      assignedMap[g.id] = {
        id: g.id, hex: e.hex, hexDisplay, secondaries: e.secondaries, pattern: e.pattern,
        name: colorName(hexDisplay), fixed: true, weight, material: e.material,
      };
      continue;
    }

    const assignedItems = Object.values(assignedMap).sort((a, b) => b.weight - a.weight);
    const assignedHexes = assignedItems.flatMap(it => [it.hex, ...secondaryHexes(it)]);

    let bestHex = null, bestScore = Infinity, bestUsed = true, bestPi = -1;
    for (let pi = 0; pi < shuffledPool.length; pi++) {
      const hex = shuffledPool[pi];
      const used = usedPoolIdx.has(pi);
      const score = evaluateColorFit(hex, profile, assignedHexes, "normal", weight);
      if (bestHex === null || (!used && bestUsed) || (used === bestUsed && score < bestScore)) {
        bestHex = hex; bestScore = score; bestUsed = used; bestPi = pi;
      }
    }
    usedPoolIdx.add(bestPi);

    const { season: sLevel, combo: cLevel } = evaluateInContext(bestHex, "normal", weight, profile, assignedItems);
    const finalHex = (sLevel >= 2 || cLevel >= 2)
      ? correctColor(bestHex, "normal", weight, profile, assignedItems)
      : bestHex;

    const hexDisplay = normHex(finalHex, normFabric);
    assignedMap[g.id] = {
      id: g.id, hex: finalHex, hexDisplay, secondaries: [], pattern: "solid",
      name: colorName(hexDisplay), fixed: false, weight, material: "normal",
    };
  }

  return presentGarments.map(g => assignedMap[g.id]);
}

// ─── Color naming ─────────────────────────────────────────────────────────────
function colorName(hex) {
  const [h, s, l] = hexToHsl(hex);
  if (s < 8) {
    if (l > 90) return "Bianco"; if (l > 75) return "Grigio Perla"; if (l > 55) return "Grigio Chiaro";
    if (l > 35) return "Grigio Medio"; if (l > 18) return "Grafite"; return "Nero";
  }
  const n = [
    [15,  l > 65 ? "Rosa Pesca"      : l > 40 ? "Rosso Mattone"  : "Borgogna"],
    [30,  l > 65 ? "Albicocca"       : l > 40 ? "Arancio"        : "Terracotta"],
    [50,  l > 65 ? "Crema Dorata"    : l > 40 ? "Ocra"           : "Senape"],
    [75,  l > 65 ? "Giallo Pastello" : l > 40 ? "Giallo Dorato"  : "Verde Muschio"],
    [130, l > 65 ? "Verde Menta"     : l > 40 ? "Verde Salvia"   : "Verde Bosco"],
    [165, l > 65 ? "Acquamarina"     : l > 40 ? "Verde Acqua"    : "Petrolio"],
    [195, l > 65 ? "Azzurro Cielo"   : l > 40 ? "Celeste"        : "Blu Scuro"],
    [240, l > 65 ? "Blu Polvere"     : l > 40 ? "Blu Cobalto"    : "Blu Notte"],
    [275, l > 65 ? "Lavanda"         : l > 40 ? "Viola"          : "Indaco"],
    [310, l > 65 ? "Lilla"           : l > 40 ? "Malva"          : "Prugna"],
    [340, l > 65 ? "Rosa Cipria"     : l > 40 ? "Rosa Antico"    : "Rosa Scuro"],
    [360, l > 65 ? "Rosa Pesca"      : l > 40 ? "Rosso Mattone"  : "Borgogna"],
  ];
  for (const [t, nm] of n) if (h < t) return nm;
  return "Rosso";
}

// ─── Constants ────────────────────────────────────────────────────────────────
const GARMENTS = [
  { id: "cappello",  label: "Cappello" },
  { id: "maglia",    label: "Maglia / Camicia" },
  { id: "felpa",     label: "Felpa" },
  { id: "giubbotto", label: "Giubbotto" },
  { id: "cintura",   label: "Cintura" },
  { id: "pantalone", label: "Pantalone" },
  { id: "calzini",   label: "Calzini" },
  { id: "scarpe",    label: "Scarpe" },
];

const HARMONIES = [
  { id: "mono",    name: "Monocromatico" },
  { id: "analog",  name: "Analogo" },
  { id: "comp",    name: "Complementare" },
  { id: "split",   name: "Split-Comp" },
  { id: "triad",   name: "Triade" },
  { id: "tetrad",  name: "Tetrade" },
  { id: "neutral", name: "Neutri Accentati" },
  { id: "earth",   name: "Toni Terra" },
  { id: "pastel",  name: "Pastello" },
  { id: "deep",    name: "Profondi" },
];
const HARMONY_NAME = Object.fromEntries(HARMONIES.map(h => [h.id, h.name]));

// ─── localStorage ─────────────────────────────────────────────────────────────
function lsGet(k, fb) { try { const v = localStorage.getItem(k); return v != null ? JSON.parse(v) : fb; } catch { return fb; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

const STORAGE_VERSION = "v3";
(function migrateLs() {
  if (lsGet("chs_version", null) !== STORAGE_VERSION) {
    localStorage.clear();
    lsSet("chs_version", STORAGE_VERSION);
  }
})();

// ─── Theme ────────────────────────────────────────────────────────────────────
const ThemeCtx = createContext({});
const useT = () => useContext(ThemeCtx);

function makeTheme(dark) {
  return dark ? {
    dark,
    card: "rgba(30,30,32,0.95)", cardB: "1px solid rgba(255,255,255,0.09)", cardS: "0 4px 28px rgba(0,0,0,0.55),inset 0 1px 0 rgba(255,255,255,0.06)",
    text: "rgba(255,255,255,0.92)", text2: "rgba(255,255,255,0.46)", text3: "rgba(255,255,255,0.22)",
    sep: "rgba(255,255,255,0.09)", nav: "rgba(16,16,18,0.94)", navB: "1px solid rgba(255,255,255,0.1)",
    input: "rgba(255,255,255,0.09)", inputB: "1px solid rgba(255,255,255,0.12)",
    modal: "#1c1c1e", modalOvl: "rgba(0,0,0,0.72)",
    tabActive: "rgba(255,255,255,0.13)", tabActiveText: "rgba(255,255,255,0.95)", tabInactive: "rgba(255,255,255,0.28)",
    bd: "blur(28px) saturate(200%)",
  } : {
    dark,
    card: "rgba(255,255,255,0.82)", cardB: "1px solid rgba(255,255,255,0.8)", cardS: "0 2px 18px rgba(0,0,0,0.07),inset 0 1px 0 rgba(255,255,255,0.95)",
    text: "rgba(0,0,0,0.88)", text2: "rgba(0,0,0,0.46)", text3: "rgba(0,0,0,0.26)",
    sep: "rgba(0,0,0,0.07)", nav: "rgba(250,250,252,0.9)", navB: "1px solid rgba(0,0,0,0.07)",
    input: "rgba(0,0,0,0.06)", inputB: "1px solid rgba(0,0,0,0.1)",
    modal: "rgba(242,242,247,0.98)", modalOvl: "rgba(0,0,0,0.44)",
    tabActive: "rgba(0,0,0,0.08)", tabActiveText: "rgba(0,0,0,0.88)", tabInactive: "rgba(0,0,0,0.28)",
    bd: "blur(28px) saturate(200%)",
  };
}

function useDarkMode() {
  const sysDark = () => window.matchMedia?.("(prefers-color-scheme: dark)").matches || false;
  const [dark, setDark] = useState(sysDark);
  useEffect(() => {
    setDark(sysDark());
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const h = e => setDark(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return [dark, useCallback(() => setDark(d => !d), [])];
}

// ─── ColorDot ─────────────────────────────────────────────────────────────────
function ColorDot({ hex, size = 32, onClick }) {
  return (
    <div onClick={onClick} style={{ width: size, height: size, borderRadius: "50%", background: hex, border: "1.5px solid rgba(255,255,255,0.4)", cursor: onClick ? "pointer" : "default", flexShrink: 0, boxShadow: "0 2px 10px rgba(0,0,0,0.22)" }} />
  );
}

// ─── ReflexPicker ─────────────────────────────────────────────────────────────
function ReflexPicker({ label, options, value, onChange, T }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: T.text3, marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {options.map(opt => {
          const active = value === opt.id;
          return (
            <button key={opt.id} onClick={() => onChange(opt.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 999, border: active ? "1.5px solid " + T.text : "1.5px solid " + T.sep, background: active ? T.card : T.input, cursor: "pointer", transition: "all 0.15s" }}>
              {opt.color && <div style={{ width: 12, height: 12, borderRadius: "50%", background: opt.color, border: "1px solid rgba(255,255,255,0.3)" }} />}
              <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: active ? T.text : T.text2 }}>{opt.label}</span>
              {active && <Check size={9} color={T.text} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── ColorPickerModal ─────────────────────────────────────────────────────────
function ColorPickerModal({ value, onClose, onChange, savedColors }) {
  const T = useT();
  const [local, setLocal] = useState(value);
  const [imgSrc, setImgSrc] = useState(null);
  const [zoom, setZoom] = useState({ visible: false, x: 0, y: 0, color: "#000" });
  const fileRef = useRef(), canvasRef = useRef(), containerRef = useRef();
  const canvasSize = useRef({ w: 300, h: 225 });

  const drawImage = useCallback((src) => {
    const img = new Image();
    img.onload = () => {
      const cv = canvasRef.current; if (!cv) return;
      const container = containerRef.current; if (!container) return;
      const dpr = window.devicePixelRatio || 1;
      const cssW = container.clientWidth, cssH = Math.round(cssW * (3 / 4));
      cv.style.width = cssW + "px"; cv.style.height = cssH + "px";
      cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssH * dpr);
      canvasSize.current = { w: cssW, h: cssH };
      const ctx = cv.getContext("2d");
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, cv.width, cv.height);
      const iw = img.naturalWidth, ih = img.naturalHeight;
      const scale = Math.min((cssW * dpr) / iw, (cssH * dpr) / ih);
      const dw = iw * scale, dh = ih * scale;
      ctx.drawImage(img, (cv.width - dw) / 2, (cv.height - dh) / 2, dw, dh);
    };
    img.src = src;
  }, []);
  useEffect(() => { if (imgSrc) drawImage(imgSrc); }, [imgSrc, drawImage]);

  const toCss = useCallback((clientX, clientY) => {
    const cv = canvasRef.current; if (!cv) return { x: 0, y: 0 };
    const rect = cv.getBoundingClientRect();
    return { x: Math.max(0, Math.min(canvasSize.current.w, clientX - rect.left)), y: Math.max(0, Math.min(canvasSize.current.h, clientY - rect.top)) };
  }, []);

  const pick = useCallback((cssX, cssY) => {
    const cv = canvasRef.current; if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    const ctx = cv.getContext("2d");
    let R = 0, G = 0, B = 0, n = 0;
    for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) {
      const d = ctx.getImageData(Math.round(cssX * dpr + dx), Math.round(cssY * dpr + dy), 1, 1).data;
      if (d[3] > 0) { R += d[0]; G += d[1]; B += d[2]; n++; }
    }
    if (n > 0) {
      const hex = "#" + [Math.round(R / n), Math.round(G / n), Math.round(B / n)].map(x => x.toString(16).padStart(2, "0")).join("");
      setLocal(hex); setZoom({ visible: true, x: cssX, y: cssY, color: hex });
    }
  }, []);

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const onMove = e => pick(...Object.values(toCss(e.clientX, e.clientY)));
    const onTouch = e => { const t = e.touches?.[0]; if (t) pick(...Object.values(toCss(t.clientX, t.clientY))); };
    cv.addEventListener("mousemove", onMove); cv.addEventListener("touchmove", onTouch);
    return () => { cv.removeEventListener("mousemove", onMove); cv.removeEventListener("touchmove", onTouch); };
  }, [pick, toCss]);

  const commit = hex => { onChange(hex); onClose(); };

  return (
    <div style={{ position: "fixed", inset: 0, background: T.modalOvl, display: "flex", alignItems: "flex-end", zIndex: 1000 }}>
      <div style={{ position: "relative", width: "100%", borderRadius: "28px 28px 0 0", background: T.modal, backdropFilter: T.bd, WebkitBackdropFilter: T.bd, padding: "1.5rem 1rem", maxHeight: "90%", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: "50%", border: T.inputB, background: T.input, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} color={T.text} /></button>
        <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: "1rem" }}>Colore</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1rem", padding: "10px", borderRadius: 12, background: T.input, border: T.inputB }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: local, border: "1.5px solid rgba(255,255,255,0.3)", overflow: "hidden", position: "relative", flexShrink: 0 }}>
            <input type="color" value={local} onChange={e => setLocal(e.target.value)} style={{ position: "absolute", inset: 0, opacity: 0, width: "100%", height: "100%", cursor: "pointer" }} />
          </div>
          <div style={{ flex: 1 }}>
            <input type="text" value={local} onChange={e => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setLocal(v.toUpperCase()); }} style={{ width: "100%", padding: "6px 0", border: "none", background: "transparent", color: T.text, fontSize: 14, fontFamily: "monospace", fontWeight: 700, outline: "none" }} />
            <div style={{ fontSize: 10, color: T.text3 }}>Tocca il quadrato per il picker nativo</div>
          </div>
          <button onClick={() => commit(local)} style={{ padding: "8px 14px", borderRadius: 10, background: "#007AFF", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>OK</button>
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>O campiona da una foto</div>
          {imgSrc ? (
            <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
              <canvas ref={canvasRef} style={{ borderRadius: 12, display: "block" }} />
              {zoom.visible && <>
                <div style={{ position: "absolute", left: zoom.x - 16, top: zoom.y - 16, width: 32, height: 32, borderRadius: "50%", border: "2.5px solid #fff", pointerEvents: "none", boxShadow: "0 0 8px rgba(0,0,0,0.5)" }} />
                <div style={{ position: "absolute", left: Math.max(4, zoom.x - 28), top: Math.min(canvasSize.current.h - 68, zoom.y + 20), width: 56, height: 56, borderRadius: 10, background: zoom.color, border: "2px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: contrastColor(zoom.color), fontFamily: "monospace", zIndex: 10 }}>{zoom.color.toUpperCase()}</div>
              </>}
            </div>
          ) : (
            <div onClick={() => fileRef.current?.click()} style={{ width: "100%", aspectRatio: "4/3", borderRadius: 12, background: T.input, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <div style={{ textAlign: "center", color: T.text2 }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>📸</div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>Carica foto</div>
              </div>
            </div>
          )}
          <input type="file" ref={fileRef} accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setImgSrc(ev.target?.result); r.readAsDataURL(f); } }} style={{ display: "none" }} />
          {imgSrc && <button onClick={() => commit(local)} style={{ marginTop: 8, width: "100%", padding: "10px", borderRadius: 10, background: "#007AFF", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Usa questo colore</button>}
        </div>
        {savedColors.length > 0 && (
          <>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.text3, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Recenti</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {savedColors.map((hex, i) => (
                <button key={i} onClick={() => commit(hex)} style={{ width: 40, height: 40, borderRadius: "50%", background: hex, border: local === hex ? "2.5px solid #007AFF" : "1px solid rgba(255,255,255,0.3)", cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── ProfileTab ───────────────────────────────────────────────────────────────
function ProfileTab({ skinColor, setSkinColor, eyeColor, setEyeColor, hairColor, setHairColor, season, savedColors, onSave, reflexes, setReflexes }) {
  const T = useT();
  const [showPicker, setShowPicker] = useState(null);
  return (
    <div style={{ padding: "1rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: T.text3, marginBottom: "0.75rem" }}>Profilo colori</div>
        <div style={{ display: "flex", gap: 12 }}>
          {[{ label: "Pelle", color: skinColor, key: "skin", set: setSkinColor },
            { label: "Occhi", color: eyeColor,  key: "eye",  set: setEyeColor  },
            { label: "Capelli", color: hairColor, key: "hair", set: setHairColor }].map(({ label, color, key, set }) => (
            <div key={key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <ColorDot hex={color} size={52} onClick={() => setShowPicker({ key, color, set })} />
              <span style={{ fontSize: 10, color: T.text2 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <ReflexPicker label="Sottotono Pelle"  options={UNDERTONE_OPTIONS} value={reflexes.skin} onChange={v => setReflexes(p => ({ ...p, skin: v }))} T={T} />
      <ReflexPicker label="Riflessi Occhi"   options={EYE_REFLEXES}      value={reflexes.eye}  onChange={v => setReflexes(p => ({ ...p, eye: v }))}  T={T} />
      <ReflexPicker label="Riflessi Capelli" options={HAIR_REFLEXES}      value={reflexes.hair} onChange={v => setReflexes(p => ({ ...p, hair: v }))} T={T} />

      <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid " + T.sep }}>
        <ReflexPicker label="Volume / Lunghezza Capelli" options={HAIR_VOLUME_OPTIONS} value={reflexes.hairVolume} onChange={v => setReflexes(p => ({ ...p, hairVolume: v }))} T={T} />
      </div>

      <div style={{ marginTop: "2rem", padding: "1rem", borderRadius: 16, background: T.card, border: T.cardB, boxShadow: T.cardS }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 22 }}>{season.emoji}</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{season.name}</div>
            <div style={{ fontSize: 11, color: T.text2, fontStyle: "italic" }}>{season.nameEn}</div>
          </div>
        </div>
        <div style={{ fontSize: 10, color: T.text3, lineHeight: 1.7 }}>{season.desc}</div>
        <div style={{ marginTop: 8, fontSize: 10, color: T.text3 }}>
          Undertone: <b style={{ color: T.text }}>{season.undertone === "warm" ? "Caldo" : season.undertone === "cool" ? "Freddo" : "Neutro"}</b>
          {" · "}Profondità: <b style={{ color: T.text }}>{season.depth === "deep" ? "Scura" : "Chiara"}</b>
          {" · "}Intensità: <b style={{ color: T.text }}>{season.intensity === "high" ? "Alta" : season.intensity === "low" ? "Bassa" : "Media"}</b>
        </div>
      </div>

      {showPicker && (
        <ColorPickerModal value={showPicker.color} onClose={() => setShowPicker(null)} onChange={hex => { showPicker.set(hex); onSave(showPicker.key, hex); }} savedColors={savedColors[showPicker.key] || []} />
      )}
    </div>
  );
}

// ─── OutfitCard ───────────────────────────────────────────────────────────────
function OutfitCard({ combo, season, skinColor, hairColor }) {
  const T = useT();
  const [expanded, setExpanded] = useState(false);
  const [tooltip, setTooltip] = useState(null);

  const profile = {
    undertone: season.undertone, depth: season.depth, intensity: season.intensity,
    utScore: season.utScore, depthScore: season.depthScore, intScore: season.intScore,
    contrastLevel: classifyContrastLevel(skinColor, hairColor),
  };

  const validationResults = validateOutfitBalance(combo.items, profile);
  const seasonFits = validationResults.map(r => r.season);
  const comboFits  = validationResults.map(r => r.combo);
  const maxS = Math.max(...seasonFits), maxC = Math.max(...comboFits);
  const dotColor = maxS >= 2 || maxC >= 2 ? "#C07010" : "#34C759";

  return (
    <div style={{ borderRadius: 16, border: T.cardB, background: T.card, backdropFilter: T.bd, WebkitBackdropFilter: T.bd, overflow: "hidden", boxShadow: T.cardS }}>
      <div onClick={() => setExpanded(!expanded)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "1rem", cursor: "pointer" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {combo.items.slice(0, 5).map((item, i) => (
            <div key={i} style={{ width: 26, height: 26, borderRadius: 7, background: item.hexDisplay || item.hex, border: "1px solid rgba(255,255,255,0.2)" }} />
          ))}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{HARMONY_NAME[combo.type] || combo.type}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: dotColor }} />
          <ChevronRight size={16} color={T.text2} style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
        </div>
      </div>
      {expanded && (
        <div style={{ padding: "0 1rem 1rem", display: "flex", flexDirection: "column", gap: 6 }}>
          {combo.items.map((item, i) => {
            const displayHex = item.hexDisplay || item.hex;
            const isNormalized = item.hexDisplay && item.hexDisplay !== item.hex;
            const showTip = tooltip === i;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px", borderRadius: 10, background: T.input, position: "relative" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: displayHex, border: "1.5px solid rgba(255,255,255,0.25)", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                  <div style={{ fontSize: 9, color: T.text3 }}>{item.id} · {item.weight}%</div>
                </div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center" }}>
                  {seasonFits[i] > 0 && <FitBadge type="season" level={seasonFits[i]} />}
                  {comboFits[i]  > 0 && <FitBadge type="combo"  level={comboFits[i]}  />}
                  {isNormalized && (
                    <span onClick={e => { e.stopPropagation(); setTooltip(showTip ? null : i); }} style={{ fontSize: 11, color: T.text3, cursor: "pointer", userSelect: "none", lineHeight: 1, flexShrink: 0 }} title="Colore normalizzato per tessuto reale">ⓘ</span>
                  )}
                </div>
                {showTip && (
                  <div style={{ position: "absolute", right: 8, top: "100%", zIndex: 50, marginTop: 4, padding: "6px 10px", borderRadius: 8, background: T.modal, border: T.cardB, boxShadow: T.cardS, fontSize: 10, color: T.text2, maxWidth: 200, lineHeight: 1.5 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, background: item.hex, border: "1px solid rgba(255,255,255,0.2)", flexShrink: 0 }} />
                      <span>Originale: <b style={{ fontFamily: "monospace", color: T.text }}>{item.hex.toUpperCase()}</b></span>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, background: displayHex, border: "1px solid rgba(255,255,255,0.2)", flexShrink: 0 }} />
                      <span>Tessuto: <b style={{ fontFamily: "monospace", color: T.text }}>{displayHex.toUpperCase()}</b></span>
                    </div>
                    <div style={{ marginTop: 4, fontSize: 9, color: T.text3 }}>I colori a schermo sono più vividi dei tessuti reali.</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── WardrobeTab ──────────────────────────────────────────────────────────────
function WardrobeTab({ modes, setModes, fixedColors, setFixedColors, savedGarment, onSaveGarment, season, skinColor, hairColor }) {
  const T = useT();
  const [showPicker, setShowPicker] = useState(null);
  const [expandedGarment, setExpandedGarment] = useState(null);
  const presentIds = GARMENTS.filter(g => modes[g.id] !== "excluded").map(g => g.id);
  const liveWeights = computeGarmentWeights(presentIds);
  const profile = {
    undertone: season.undertone, depth: season.depth, intensity: season.intensity,
    utScore: season.utScore, depthScore: season.depthScore, intScore: season.intScore,
    contrastLevel: classifyContrastLevel(skinColor, hairColor),
  };
  const fixedComboHexes = useCallback((gid) =>
    GARMENTS
      .filter(g => g.id !== gid && modes[g.id] === "fixed")
      .map(g => normHex(normalizeEntry(fixedColors[g.id]).hex, normFabric)),
    [modes, fixedColors]
  );

  return (
    <div style={{ padding: "1rem" }}>
      {GARMENTS.map(g => {
        const mode = modes[g.id] || "auto";
        const fixed = normalizeEntry(fixedColors[g.id] || {});
        const isExpanded = expandedGarment === g.id;
        const weight = liveWeights[g.id] || 0;
        const fitLevel = mode === "fixed"
          ? evaluateColorFit(normHex(fixed.hex, normFabric), profile, fixedComboHexes(g.id), fixed.material, weight)
          : 0;
        const normPreview = normHex(fixed.hex, normFabric);
        return (
          <div key={g.id} style={{ marginBottom: "0.75rem", borderRadius: 14, border: T.cardB, background: T.card, overflow: "hidden", boxShadow: T.cardS }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0.875rem" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.text, minWidth: 72 }}>{g.label}</div>
              <select value={mode} onChange={e => setModes(p => ({ ...p, [g.id]: e.target.value }))} style={{ padding: "5px 8px", borderRadius: 8, border: T.inputB, background: T.input, color: T.text, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                <option value="auto">Auto</option>
                <option value="fixed">Fisso</option>
                <option value="excluded">Escluso</option>
              </select>
              {mode === "fixed" && (
                <div style={{ display: "flex", gap: 6, alignItems: "center", flex: 1 }}>
                  <ColorDot hex={fixed.hex} size={32} onClick={() => setShowPicker({ gid: g.id, entry: fixed })} />
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: T.input, color: T.text3 }}>{weight}%</span>
                  {fixed.material === "jeans" && <span style={{ fontSize: 10 }}>👖</span>}
                  {fitLevel > 0 && <FitBadge type="season" level={fitLevel} />}
                </div>
              )}
              {mode !== "fixed" && <div style={{ flex: 1 }} />}
              {mode === "fixed" && (
                <button onClick={() => setExpandedGarment(isExpanded ? null : g.id)} style={{ padding: "5px 10px", borderRadius: 8, border: T.inputB, background: T.input, color: T.text, cursor: "pointer", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{isExpanded ? "−" : "+"}</button>
              )}
            </div>
            {isExpanded && mode === "fixed" && (
              <div style={{ padding: "0 0.875rem 0.875rem" }}>
                <button onClick={() => setShowPicker({ gid: g.id, entry: fixed })} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px", borderRadius: 10, border: T.inputB, background: T.input, cursor: "pointer", marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", gap: 0, flexShrink: 0, borderRadius: 8, overflow: "hidden", border: "1.5px solid rgba(255,255,255,0.3)" }}>
                    <div style={{ width: 36, height: 36, background: fixed.hex }} />
                    <div style={{ width: 36, height: 36, background: normPreview }} />
                  </div>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{colorName(normPreview)}</div>
                    <div style={{ fontSize: 9, fontFamily: "monospace", color: T.text3 }}>{fixed.hex.toUpperCase()} → {normPreview.toUpperCase()}</div>
                  </div>
                  <span style={{ fontSize: 10, color: T.text3 }}>Modifica</span>
                </button>
                <div style={{ marginBottom: "0.75rem" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.text3, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Materiale</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[{ id: "normal", label: "Normale" }, { id: "jeans", label: "Jeans 👖" }].map(opt => (
                      <button key={opt.id} onClick={() => setFixedColors(p => ({ ...p, [g.id]: { ...normalizeEntry(p[g.id]), material: opt.id } }))} style={{ padding: "6px 12px", borderRadius: 8, border: fixed.material === opt.id ? T.inputB : "1px solid " + T.sep, background: fixed.material === opt.id ? T.input : "transparent", color: T.text, fontSize: 11, fontWeight: fixed.material === opt.id ? 700 : 500, cursor: "pointer" }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.text3, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Pattern</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {[{ id: "solid", label: "Tinta unita" }, { id: "stripes_v", label: "Righe V" }, { id: "stripes_h", label: "Righe H" }, { id: "check", label: "Quadri" }, { id: "dots", label: "Pois" }, { id: "floral", label: "Floreale" }, { id: "abstract", label: "Astratta" }].map(opt => (
                      <button key={opt.id} onClick={() => setFixedColors(p => ({ ...p, [g.id]: { ...normalizeEntry(p[g.id]), pattern: opt.id } }))} style={{ padding: "5px 10px", borderRadius: 8, border: fixed.pattern === opt.id ? T.inputB : "1px solid " + T.sep, background: fixed.pattern === opt.id ? T.input : "transparent", color: T.text, fontSize: 11, fontWeight: fixed.pattern === opt.id ? 700 : 500, cursor: "pointer" }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
      <div style={{ marginTop: "0.75rem", padding: "0.875rem", borderRadius: 12, border: T.cardB, background: T.input }}>
        <div style={{ fontSize: 11, color: T.text2, lineHeight: 1.7 }}>
          <b>Auto:</b> colore generato dall'armonia · <b>Fisso:</b> colore tuo, non cambia · <b>Escluso:</b> non appare negli outfit
        </div>
        <div style={{ fontSize: 10, color: T.text3, marginTop: 4 }}>
          I colori nell'Outfit sono normalizzati per riflettere l'aspetto reale del tessuto (schermo → tessuto).
        </div>
      </div>
      {showPicker && (
        <ColorPickerModal
          value={showPicker.entry.hex}
          onClose={() => setShowPicker(null)}
          onChange={hex => {
            setFixedColors(p => ({ ...p, [showPicker.gid]: { ...normalizeEntry(p[showPicker.gid]), hex } }));
            onSaveGarment(showPicker.gid, hex);
          }}
          savedColors={savedGarment[showPicker.gid] || []}
        />
      )}
    </div>
  );
}

// ─── ResultsTab ───────────────────────────────────────────────────────────────
function ResultsTab({ combos, comboCount, setComboCount, onRefresh, season, skinColor, hairColor }) {
  const T = useT();
  return (
    <div style={{ padding: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          <span style={{ fontSize: 12, color: T.text2, whiteSpace: "nowrap" }}>Outfit:</span>
          <input type="range" min={3} max={10} step={1} value={comboCount} onChange={e => setComboCount(parseInt(e.target.value))} style={{ flex: 1, accentColor: T.dark ? "#fff" : "#000" }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: T.text, minWidth: 16, textAlign: "center" }}>{comboCount}</span>
        </div>
        <button onClick={onRefresh} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 999, border: T.cardB, background: T.card, backdropFilter: T.bd, WebkitBackdropFilter: T.bd, color: T.text, cursor: "pointer", fontSize: 13, fontWeight: 600, boxShadow: T.cardS }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>
      <div style={{ marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ padding: "4px 12px", borderRadius: 999, background: `linear-gradient(90deg,${season.grad[0]},${season.grad[1]})`, color: season.text, fontSize: 12, fontWeight: 700 }}>{season.emoji} {season.name}</span>
        <span style={{ fontSize: 11, color: T.text3, fontStyle: "italic" }}>{season.nameEn}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {combos.slice(0, comboCount).map((combo, i) => (
          <OutfitCard key={combo.type + "-" + i} combo={combo} season={season} skinColor={skinColor} hairColor={hairColor} />
        ))}
      </div>
      <div style={{ marginTop: "1rem", fontSize: 11, color: T.text3, textAlign: "center", lineHeight: 1.7 }}>
        Tocca per i dettagli · % = peso visivo stimato
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [dark, toggleDark] = useDarkMode();
  const [tab, setTab] = useState("profile");
  const [skinColor,  setSkinColor]  = useState(() => lsGet("chs_skinColor",  "#D4A574"));
  const [eyeColor,   setEyeColor]   = useState(() => lsGet("chs_eyeColor",   "#6B4423"));
  const [hairColor,  setHairColor]  = useState(() => lsGet("chs_hairColor",  "#3D2B1F"));
  const [savedColors, setSavedColors] = useState(() => lsGet("chs_savedColors", { skin: [], eye: [], hair: [] }));
  const [reflexes, setReflexes] = useState(() => lsGet("chs_reflexes", { skin: "neutral", eye: "neutral", hair: "neutral", hairVolume: "medium" }));
  const [modes, setModes] = useState(() => lsGet("chs_modes", {
    ...Object.fromEntries(GARMENTS.map(g => [g.id, "auto"])),
    cappello: "excluded",
  }));
  const [fixedColors, setFixedColors] = useState(() => {
    const saved = lsGet("chs_fixedColors", null);
    if (!saved) return Object.fromEntries(GARMENTS.map(g => [g.id, { hex: "#8B7355", secondaries: [], pattern: "solid", material: "normal" }]));
    return Object.fromEntries(GARMENTS.map(g => [g.id, normalizeEntry(saved[g.id])]));
  });
  const [savedGarment, setSavedGarment] = useState(() => lsGet("chs_savedGarment", Object.fromEntries(GARMENTS.map(g => [g.id, []]))));
  const [comboCount, setComboCount] = useState(() => lsGet("chs_comboCount", 5));
  const [combos, setCombos] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const T = makeTheme(dark);
  const season = detectSeason(skinColor, eyeColor, hairColor, reflexes);

  useEffect(() => { const m = document.querySelector("meta[name=theme-color]"); if (m) m.setAttribute("content", dark ? "#000000" : "#f2f2f7"); }, [dark]);
  useEffect(() => { lsSet("chs_skinColor",    skinColor);    }, [skinColor]);
  useEffect(() => { lsSet("chs_eyeColor",     eyeColor);     }, [eyeColor]);
  useEffect(() => { lsSet("chs_hairColor",    hairColor);    }, [hairColor]);
  useEffect(() => { lsSet("chs_savedColors",  savedColors);  }, [savedColors]);
  useEffect(() => { lsSet("chs_reflexes",     reflexes);     }, [reflexes]);
  useEffect(() => { lsSet("chs_modes",        modes);        }, [modes]);
  useEffect(() => { lsSet("chs_fixedColors",  fixedColors);  }, [fixedColors]);
  useEffect(() => { lsSet("chs_savedGarment", savedGarment); }, [savedGarment]);
  useEffect(() => { lsSet("chs_comboCount",   comboCount);   }, [comboCount]);

  const fixedMap = useMemo(
    () => Object.fromEntries(GARMENTS.filter(g => modes[g.id] === "fixed").map(g => [g.id, normalizeEntry(fixedColors[g.id])])),
    [modes, fixedColors]
  );
  const excludedIds = useMemo(
    () => GARMENTS.filter(g => modes[g.id] === "excluded").map(g => g.id),
    [modes]
  );

  const generate = useCallback(() => {
    const bioAnchor = extractAnchorFromBiology(skinColor, eyeColor, hairColor);
    const baseSeed = (refreshKey + 1) * 99991 + Date.now() % 9973;
    const seasonKey = `${season.base}-${season.sub}`;
    setCombos(HARMONIES.map((h, i) => ({
      type: h.id,
      items: generateCombo(h.id, bioAnchor, fixedMap, excludedIds, baseSeed + i * 7, seasonKey),
    })));
  }, [skinColor, eyeColor, hairColor, reflexes, fixedMap, excludedIds, season.base, season.sub, refreshKey]);

  useEffect(() => { generate(); }, [generate]);

  const handleSaveColor   = (key, color) => setSavedColors(p  => ({ ...p, [key]: [...new Set([color, ...(p[key]  || [])])].slice(0, 8) }));
  const handleSaveGarment = (gid, color) => setSavedGarment(p => ({ ...p, [gid]: [...new Set([color, ...(p[gid] || [])])].slice(0, 6) }));

  const TABS = [{ id: "profile", label: "Profilo", Icon: User }, { id: "wardrobe", label: "Guardaroba", Icon: Shirt }, { id: "results", label: "Outfit", Icon: LayoutGrid }];
  const bg = dark
    ? (season.undertone === "warm" ? "linear-gradient(180deg,#1a0c06 0%,#0a0602 60%,#000 100%)" : season.undertone === "cool" ? "linear-gradient(180deg,#060818 0%,#020408 60%,#000 100%)" : "linear-gradient(180deg,#0a0a0c 0%,#050506 60%,#000 100%)")
    : (season.undertone === "warm" ? "linear-gradient(180deg,#fdf6ee 0%,#f2ece4 100%)"          : season.undertone === "cool" ? "linear-gradient(180deg,#eff2fa 0%,#e8ecf5 100%)"          : "linear-gradient(180deg,#f5f5f7 0%,#eeeef0 100%)");

  return (
    <ThemeCtx.Provider value={T}>
      <div style={{ position: "fixed", inset: 0, background: bg, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, overflowY: "auto", WebkitOverflowScrolling: "touch", paddingTop: "env(safe-area-inset-top,0px)", paddingBottom: "calc(64px + env(safe-area-inset-bottom,0px))", paddingLeft: "env(safe-area-inset-left,0px)", paddingRight: "env(safe-area-inset-right,0px)" }}>
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <div style={{ padding: "1rem 1.25rem 0.5rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontFamily: "Georgia,serif", fontSize: 28, fontWeight: 800, color: T.text, letterSpacing: "-0.03em", lineHeight: 1 }}>Armonia</div>
                <div style={{ fontSize: 12, color: T.text2, marginTop: 4 }}>{season.emoji} {season.name}</div>
              </div>
              <button onClick={toggleDark} style={{ width: 36, height: 36, borderRadius: "50%", border: T.cardB, background: T.card, backdropFilter: T.bd, WebkitBackdropFilter: T.bd, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: T.cardS, flexShrink: 0, marginTop: 4 }}>
                {dark ? <Sun size={16} color={T.text} /> : <Moon size={16} color={T.text} />}
              </button>
            </div>
            {tab === "profile"  && <ProfileTab  skinColor={skinColor} setSkinColor={setSkinColor} eyeColor={eyeColor} setEyeColor={setEyeColor} hairColor={hairColor} setHairColor={setHairColor} season={season} savedColors={savedColors} onSave={handleSaveColor} reflexes={reflexes} setReflexes={setReflexes} />}
            {tab === "wardrobe" && <WardrobeTab modes={modes} setModes={setModes} fixedColors={fixedColors} setFixedColors={setFixedColors} savedGarment={savedGarment} onSaveGarment={handleSaveGarment} season={season} skinColor={skinColor} hairColor={hairColor} />}
            {tab === "results"  && <ResultsTab  combos={combos} comboCount={comboCount} setComboCount={setComboCount} onRefresh={() => setRefreshKey(k => k + 1)} season={season} skinColor={skinColor} hairColor={hairColor} />}
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 200, background: T.nav, backdropFilter: T.bd, WebkitBackdropFilter: T.bd, borderTop: T.navB, paddingBottom: "env(safe-area-inset-bottom,0px)" }}>
          <div style={{ display: "flex", maxWidth: 480, margin: "0 auto", padding: "4px 8px" }}>
            {TABS.map(({ id, label, Icon }) => {
              const active = tab === id;
              return (
                <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: "10px 0", border: "none", background: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, position: "relative" }}>
                  {active && <div style={{ position: "absolute", inset: 0, borderRadius: 12, background: T.tabActive, margin: "2px 4px" }} />}
                  <Icon size={21} color={active ? T.tabActiveText : T.tabInactive} strokeWidth={active ? 2.5 : 1.8} />
                  <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? T.tabActiveText : T.tabInactive, letterSpacing: "0.02em", position: "relative" }}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}
