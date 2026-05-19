import { useState, useCallback, useEffect, useRef } from "react";
import { RefreshCw, ChevronRight, ChevronLeft, Save, Sparkles, Lock, Unlock, User, Shirt, LayoutGrid, X, Check } from "lucide-react";

// ─── Color math ──────────────────────────────────────────────────────────────

function hexToHsl(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
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
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return '#' + [r, g, b].map(v => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('');
}

function contrastColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) > 128 ? '#1a1208' : '#faf8f0';
}

// ─── Season detection ─────────────────────────────────────────────────────────

function detectSeason(skin, eyes, hair) {
  const [hS, sS, lS] = hexToHsl(skin);
  const [hH, sH, lH] = hexToHsl(hair);
  const warmSkin = (hS > 10 && hS < 60) || sS < 15;
  const warmHair = (hH > 15 && hH < 55);
  const lightHair = lH > 45;
  const deepSkin = lS < 55;

  if (warmHair && lightHair) return {
    name: "Primavera", emoji: "🌸",
    palette: ['#F4C89A','#E8A87C','#D4845C','#9DC88D','#7BB5A0','#F0E0A0','#C4956A','#E8C5A0'],
    accent: '#E8A87C', bg: '#FFF8F0', card: '#FEF3E8', text: '#7A3D1A',
    desc: "Toni caldi, dorati e luminosi"
  };
  if (!warmHair && lightHair) return {
    name: "Estate", emoji: "☀️",
    palette: ['#C5CAD8','#9BA8C0','#BBA8C8','#D4B8C8','#A0B8C8','#E8D8E0','#8898B0','#C8B0C0'],
    accent: '#9BA8C0', bg: '#F4F0F8', card: '#EDE8F5', text: '#3A3860',
    desc: "Toni freddi, polverosi e delicati"
  };
  if (warmHair && !lightHair) return {
    name: "Autunno", emoji: "🍂",
    palette: ['#8B4513','#A0522D','#CD853F','#6B8E23','#8B6914','#C09050','#7A5C3A','#9B7040'],
    accent: '#CD853F', bg: '#FDF5EC', card: '#F8EDD8', text: '#5A2D0C',
    desc: "Toni caldi, profondi e terrosi"
  };
  return {
    name: "Inverno", emoji: "❄️",
    palette: ['#1C2040','#8B1A2C','#2A4080','#4A3060','#C0B8C8','#E8E0F0','#A0A8C0','#202840'],
    accent: '#8B1A2C', bg: '#F0EEF8', card: '#E8E4F4', text: '#1A1840',
    desc: "Toni freddi, netti e contrastati"
  };
}

// ─── Color naming ─────────────────────────────────────────────────────────────

function colorName(hex) {
  const [h, s, l] = hexToHsl(hex);
  if (s < 8) {
    if (l > 90) return "Bianco Puro";
    if (l > 75) return "Grigio Perla";
    if (l > 55) return "Grigio Chiaro";
    if (l > 35) return "Grigio Medio";
    if (l > 18) return "Grafite";
    return "Nero";
  }
  const hNames = [
    [15, l > 65 ? "Rosa Pesca" : l > 40 ? "Rosso Mattone" : "Borgogna"],
    [30, l > 65 ? "Albicocca" : l > 40 ? "Arancio Bruciato" : "Terracotta"],
    [50, l > 65 ? "Crema Dorata" : l > 40 ? "Ocra" : "Senape Scuro"],
    [75, l > 65 ? "Giallo Pastello" : l > 40 ? "Giallo Dorato" : "Verde Muschio"],
    [130, l > 65 ? "Verde Menta" : l > 40 ? "Verde Salvia" : "Verde Bosco"],
    [165, l > 65 ? "Acquamarina" : l > 40 ? "Verde Acqua" : "Petrolio"],
    [195, l > 65 ? "Azzurro Cielo" : l > 40 ? "Celeste Acciaio" : "Blu Scuro"],
    [240, l > 65 ? "Blu Polvere" : l > 40 ? "Blu Cobalto" : "Blu Notte"],
    [275, l > 65 ? "Lavanda" : l > 40 ? "Viola Medio" : "Indaco"],
    [310, l > 65 ? "Lilla Tenue" : l > 40 ? "Malva" : "Prugna"],
    [340, l > 65 ? "Rosa Cipria" : l > 40 ? "Rosa Antico" : "Rosa Scuro"],
    [360, l > 65 ? "Rosa Pesca" : l > 40 ? "Rosso Mattone" : "Borgogna"],
  ];
  for (const [threshold, name] of hNames) if (h < threshold) return name;
  return "Rosso";
}

// ─── Harmony generation ───────────────────────────────────────────────────────

const GARMENTS = [
  { id: 'maglia', label: 'Maglia / Camicia', short: 'Maglia' },
  { id: 'felpa', label: 'Felpa', short: 'Felpa' },
  { id: 'giubbotto', label: 'Giubbotto', short: 'Giubbotto' },
  { id: 'cintura', label: 'Cintura', short: 'Cintura' },
  { id: 'pantalone', label: 'Pantalone', short: 'Pantalone' },
  { id: 'calzini', label: 'Calzini', short: 'Calzini' },
  { id: 'scarpe', label: 'Scarpe', short: 'Scarpe' },
];

const HARMONIES = [
  { id: 'mono', name: 'Monocromatico', tag: 'MONO' },
  { id: 'analog', name: 'Analogo', tag: 'ANAL' },
  { id: 'comp', name: 'Complementare', tag: 'COMP' },
  { id: 'split', name: 'Split-Comp', tag: 'SPLT' },
  { id: 'triad', name: 'Triade', tag: 'TRIA' },
  { id: 'tetrad', name: 'Tetrade', tag: 'TETR' },
  { id: 'neutral', name: 'Neutri Accentati', tag: 'NEUT' },
  { id: 'earth', name: 'Toni Terra', tag: 'TERA' },
  { id: 'pastel', name: 'Pastello', tag: 'PAST' },
  { id: 'deep', name: 'Profondi', tag: 'DEEP' },
];

function buildPool(type, palette) {
  const base = palette[0];
  const [bH, bS, bL] = hexToHsl(base);
  switch (type) {
    case 'mono':
      return Array.from({ length: 8 }, (_, i) => hslToHex(bH, bS * 0.85, Math.max(15, Math.min(85, bL - 35 + i * 10))));
    case 'analog':
      return [-50, -30, -15, 0, 15, 30, 50, 65].map(d => hslToHex(bH + d, bS * 0.9, bL));
    case 'comp':
      return [
        ...[-15, 0, 15].map(d => hslToHex(bH + d, bS, Math.min(80, bL + 5))),
        ...[-15, 0, 15].map(d => hslToHex(bH + 180 + d, bS * 0.9, bL)),
        hslToHex(bH, bS * 0.3, 85), hslToHex(bH, bS * 0.2, 20),
      ];
    case 'split':
      return [0, 150, 210, 20, 160, 200, -20, 230].map(d => hslToHex(bH + d, bS * 0.88, bL));
    case 'triad':
      return [0, 5, -5, 120, 125, 115, 240, 245].map(d => hslToHex(bH + d, bS * 0.88, bL));
    case 'tetrad':
      return [0, 90, 180, 270, 8, 98, 188, 278].map(d => hslToHex(bH + d, bS * 0.85, bL));
    case 'neutral': {
      const neutrals = ['#F5F3EE', '#E8E5DC', '#C8C4B8', '#8C8880', '#3C3830', '#1C1A14'];
      return [...neutrals, base, hslToHex(bH, bS, Math.min(75, bL + 15))];
    }
    case 'earth':
      return [25, 35, 45, 20, 95, 110, 30, 15].map(d => hslToHex(d, 40 + (d % 20), 35 + (d % 30)));
    case 'pastel':
      return Array.from({ length: 8 }, (_, i) => hslToHex(bH + i * 30, 35, 78));
    case 'deep':
      return Array.from({ length: 8 }, (_, i) => hslToHex(bH + i * 25, 55, 22 + i * 4));
    default:
      return palette;
  }
}

function generateCombo(type, palette, fixedMap) {
  const pool = buildPool(type, palette);
  return GARMENTS.map((g, i) => {
    if (fixedMap[g.id]) return { id: g.id, hex: fixedMap[g.id], name: colorName(fixedMap[g.id]), fixed: true };
    const hex = pool[i % pool.length];
    return { id: g.id, hex, name: colorName(hex), fixed: false };
  });
}

// ─── Components ───────────────────────────────────────────────────────────────

function ColorDot({ hex, size = 32, fixed = false, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: size, height: size, borderRadius: '50%',
        background: hex,
        border: fixed ? `2px solid ${contrastColor(hex) === '#faf8f0' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)'}` : '1.5px solid rgba(0,0,0,0.1)',
        cursor: onClick ? 'pointer' : 'default',
        flexShrink: 0,
        position: 'relative',
        transition: 'transform 0.15s',
      }}
    >
      {fixed && (
        <div style={{
          position: 'absolute', bottom: -2, right: -2,
          width: 10, height: 10, borderRadius: '50%',
          background: '#1a1208', border: '1.5px solid #fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Lock size={5} color="#fff" />
        </div>
      )}
    </div>
  );
}

function ColorPickerModal({ value, onClose, onChange, savedColors, onSave }) {
  const [local, setLocal] = useState(value);
  const [mode, setMode] = useState('picker'); // 'picker' | 'image'
  const [imgSrc, setImgSrc] = useState(null);
  const [zoom, setZoom] = useState({ visible: false, x: 0, y: 0, color: '#000' });
  const inputRef = useRef();
  const fileRef = useRef();
  const canvasRef = useRef();
  const imgRef = useRef();

  const isDragging = useRef(false);

  const drawImage = useCallback((src) => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.parentElement.clientWidth;
      const ratio = img.naturalHeight / img.naturalWidth;
      const cssH = Math.min(cssW * ratio, 280);
      canvas.style.width = cssW + 'px';
      canvas.style.height = cssH + 'px';
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.drawImage(img, 0, 0, cssW, cssH);
    };
    img.src = src;
  }, []);

  useEffect(() => { if (imgSrc) drawImage(imgSrc); }, [imgSrc, drawImage]);

  const pickFromCanvas = useCallback((pageX, pageY) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const rectTop = rect.top + window.scrollY;
    const rectLeft = rect.left + window.scrollX;
    const cssX = pageX - rectLeft;
    const cssY = pageY - rectTop;
    const cssW = parseFloat(canvas.style.width) || rect.width;
    const cssH = parseFloat(canvas.style.height) || rect.height;
    const clampedCssX = Math.max(0, Math.min(cssW - 1, cssX));
    const clampedCssY = Math.max(0, Math.min(cssH - 1, cssY));
    const dpr = window.devicePixelRatio || 1;
    const bufX = Math.floor(clampedCssX * dpr);
    const bufY = Math.floor(clampedCssY * dpr);
    const ctx = canvas.getContext('2d');
    let R = 0, G = 0, B = 0, count = 0;
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        const px = bufX + dx, py = bufY + dy;
        if (px >= 0 && px < canvas.width && py >= 0 && py < canvas.height) {
          const d = ctx.getImageData(px, py, 1, 1).data;
          R += d[0]; G += d[1]; B += d[2]; count++;
        }
      }
    }
    R = Math.round(R / count); G = Math.round(G / count); B = Math.round(B / count);
    const hex = '#' + [R, G, B].map(v => v.toString(16).padStart(2, '0')).join('');
    setLocal(hex);
    setZoom({ visible: true, x: clampedCssX, y: clampedCssY, color: hex });
    return hex;
  }, []);

  const handleCanvasTouch = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = true;
    const t = e.touches[0];
    pickFromCanvas(t.pageX, t.pageY);
  }, [pickFromCanvas]);

  const handleCanvasTouchMove = useCallback((e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    e.stopPropagation();
    const t = e.touches[0];
    pickFromCanvas(t.pageX, t.pageY);
  }, [pickFromCanvas]);

  const handleCanvasTouchEnd = useCallback((e) => {
    e.preventDefault();
    isDragging.current = false;
    setTimeout(() => setZoom(z => ({ ...z, visible: false })), 900);
  }, []);

  const handleCanvasClick = useCallback((e) => {
    pickFromCanvas(e.pageX, e.pageY);
    setTimeout(() => setZoom(z => ({ ...z, visible: false })), 900);
  }, [pickFromCanvas]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setImgSrc(ev.target.result); setMode('image'); };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '22px 22px 0 0',
          width: '100%', maxWidth: 480,
          paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))',
          maxHeight: '92vh', overflowY: 'auto',
        }}
      >
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e0ddd5' }} />
        </div>

        <div style={{ padding: '0.75rem 1.25rem 0' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontWeight: 700, fontSize: 16, fontFamily: 'Georgia, serif' }}>Seleziona colore</span>
            <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}>
              <X size={20} color="#888" />
            </button>
          </div>

          {/* Mode tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: '1rem', background: '#f5f3ee', borderRadius: 10, padding: 4 }}>
            {[
              { id: 'picker', label: '🎨 Color picker' },
              { id: 'image', label: '📷 Da foto' },
            ].map(m => (
              <button key={m.id} onClick={() => setMode(m.id)}
                style={{
                  flex: 1, padding: '8px', border: 'none', borderRadius: 7, cursor: 'pointer',
                  background: mode === m.id ? '#fff' : 'transparent',
                  fontWeight: mode === m.id ? 700 : 500, fontSize: 13,
                  color: mode === m.id ? '#1a1208' : '#888',
                  boxShadow: mode === m.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s',
                }}>{m.label}</button>
            ))}
          </div>

          {/* Preview row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: '1rem' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: local, border: '1.5px solid rgba(0,0,0,0.1)', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1208' }}>{colorName(local)}</div>
              <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#aaa' }}>{local.toUpperCase()}</div>
            </div>
          </div>

          {/* ── PICKER MODE ── */}
          {mode === 'picker' && (
            <div>
              <div
                onClick={() => inputRef.current.click()}
                style={{
                  width: '100%', height: 52, borderRadius: 12,
                  background: `linear-gradient(135deg, ${local}, ${local}dd)`,
                  border: '1.5px solid rgba(0,0,0,0.1)',
                  cursor: 'pointer', position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '0.875rem',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: contrastColor(local), opacity: 0.8 }}>
                  Tocca per aprire il color picker
                </span>
                <input
                  ref={inputRef} type="color" value={local}
                  onChange={e => setLocal(e.target.value)}
                  style={{ position: 'absolute', opacity: 0, inset: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                />
              </div>
              <div style={{ fontSize: 11, color: '#bbb', textAlign: 'center', marginBottom: '0.875rem' }}>
                Oppure carica una foto per campionare i colori →
              </div>
              <button
                onClick={() => { fileRef.current.click(); }}
                style={{
                  width: '100%', padding: '11px', border: '1.5px dashed #d0cdc5',
                  borderRadius: 12, background: '#faf8f4', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600, color: '#888',
                }}
              >
                📷 Carica immagine
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile}
                style={{ display: 'none' }} />
            </div>
          )}

          {/* ── IMAGE EYEDROPPER MODE ── */}
          {mode === 'image' && (
            <div>
              {!imgSrc ? (
                <button
                  onClick={() => fileRef.current.click()}
                  style={{
                    width: '100%', padding: '32px 16px', border: '2px dashed #d0cdc5',
                    borderRadius: 16, background: '#faf8f4', cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#888' }}>Carica una foto</div>
                  <div style={{ fontSize: 12, color: '#bbb', marginTop: 4 }}>Usa la fotocamera o la libreria</div>
                </button>
              ) : (
                <div>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 8, textAlign: 'center' }}>
                    👆 Tocca l'immagine per campionare un colore
                  </div>
                  <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: '1.5px solid #e0ddd5', touchAction: 'none' }}>
                    <canvas
                      ref={canvasRef}
                      style={{ display: 'block', width: '100%', cursor: 'crosshair', userSelect: 'none', WebkitUserSelect: 'none' }}
                      onTouchStart={handleCanvasTouch}
                      onTouchMove={handleCanvasTouchMove}
                      onTouchEnd={handleCanvasTouchEnd}
                      onClick={handleCanvasClick}
                    />
                    {zoom.visible && (
                      <div style={{
                        position: 'absolute',
                        left: Math.max(32, Math.min(zoom.x - 32, 260)),
                        top: Math.max(4, zoom.y - 84),
                        width: 64, height: 64, borderRadius: '50%',
                        background: zoom.color,
                        border: '3px solid #fff',
                        boxShadow: '0 3px 18px rgba(0,0,0,0.4)',
                        pointerEvents: 'none',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                      }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: contrastColor(zoom.color), opacity: 0.55 }} />
                        <div style={{ fontSize: 7, fontFamily: 'monospace', color: contrastColor(zoom.color), opacity: 0.7 }}>
                          {zoom.color.toUpperCase()}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => { setImgSrc(null); fileRef.current.value = ''; }}
                    style={{ marginTop: 8, width: '100%', padding: '8px', border: '1px solid #e0ddd5', borderRadius: 10, background: '#fff', cursor: 'pointer', fontSize: 12, color: '#888' }}
                  >
                    Cambia foto
                  </button>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile}
                style={{ display: 'none' }} />
            </div>
          )}

          {/* Saved swatches */}
          {savedColors.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#ccc', textTransform: 'uppercase', marginBottom: 8 }}>Salvati</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {savedColors.map((c, i) => (
                  <div key={i} onClick={() => setLocal(c)}
                    style={{
                      width: 38, height: 38, borderRadius: 9, background: c,
                      border: c === local ? '2.5px solid #1a1208' : '1.5px solid rgba(0,0,0,0.1)',
                      cursor: 'pointer', transition: 'transform 0.1s',
                    }} />
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: '1.25rem' }}>
            <button
              onClick={() => onSave(local)}
              style={{
                flex: 1, padding: '13px', border: '1.5px solid #e0ddd5',
                borderRadius: 13, background: '#fff', cursor: 'pointer',
                fontSize: 14, fontWeight: 600, color: '#888',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}
            >
              <Save size={15} /> Salva
            </button>
            <button
              onClick={() => { onChange(local); onClose(); }}
              style={{
                flex: 2, padding: '13px', border: 'none',
                borderRadius: 13, background: '#1a1208', cursor: 'pointer',
                fontSize: 14, fontWeight: 700, color: '#faf8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}
            >
              <Check size={15} /> Applica
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ skinColor, setSkinColor, eyeColor, setEyeColor, hairColor, setHairColor, season, savedColors, onSave }) {
  const [picker, setPicker] = useState(null);

  const slots = [
    { key: 'skin', label: 'Incarnato', val: skinColor, set: setSkinColor, saved: savedColors.skin },
    { key: 'eye', label: 'Occhi', val: eyeColor, set: setEyeColor, saved: savedColors.eye },
    { key: 'hair', label: 'Capelli', val: hairColor, set: setHairColor, saved: savedColors.hair },
  ];

  return (
    <div style={{ padding: '1.25rem 1rem' }}>
      <div style={{ background: season.card, borderRadius: 18, padding: '1.25rem', marginBottom: '1rem', border: `1px solid ${season.accent}30` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '0.75rem' }}>
          <span style={{ fontSize: 28 }}>{season.emoji}</span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: season.text, fontFamily: 'Georgia, serif' }}>{season.name}</div>
            <div style={{ fontSize: 12, color: season.text + 'aa' }}>{season.desc}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {season.palette.slice(0, 6).map((c, i) => (
            <div key={i} style={{ flex: 1, height: 28, borderRadius: 6, background: c, border: '1px solid rgba(0,0,0,0.08)' }} />
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: '1rem' }}>
        {slots.map(({ key, label, val, set, saved }) => (
          <div key={key} onClick={() => setPicker({ key, val, set, saved })}
            style={{ background: '#fff', borderRadius: 14, padding: '0.875rem', border: '1px solid #ece9e0', cursor: 'pointer', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: val, border: '2px solid rgba(0,0,0,0.08)', margin: '0 auto 8px' }} />
            <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
            <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#bbb', marginTop: 2 }}>{val.toUpperCase()}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#f5f3ee', borderRadius: 12, padding: '0.875rem', fontSize: 12, color: '#888', lineHeight: 1.5 }}>
        <strong style={{ color: '#555' }}>Come funziona:</strong> Tocca i riquadri sopra per selezionare i tuoi colori personali. L'app rileva automaticamente la stagione armomica e calcola la palette ideale per il tuo incarnato.
      </div>

      {picker && (
        <ColorPickerModal
          value={picker.val}
          onClose={() => setPicker(null)}
          onChange={(c) => picker.set(c)}
          savedColors={picker.saved}
          onSave={(c) => onSave(picker.key, c)}
        />
      )}
    </div>
  );
}

function WardrobeTab({ modes, setModes, fixedColors, setFixedColors, savedGarment, onSaveGarment }) {
  const [picker, setPicker] = useState(null);

  return (
    <div style={{ padding: '1rem' }}>
      <p style={{ fontSize: 12, color: '#aaa', marginBottom: '0.875rem', lineHeight: 1.5 }}>
        <Lock size={11} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 3 }} /> <strong style={{ color: '#888' }}>Fissato</strong> = usi tu il colore. &nbsp;
        <Sparkles size={11} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 3 }} /> <strong style={{ color: '#888' }}>Suggerito</strong> = decide l'app.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {GARMENTS.map(g => {
          const fixed = modes[g.id] === 'fixed';
          return (
            <div key={g.id} style={{
              background: '#fff', borderRadius: 14, padding: '0.875rem 1rem',
              border: '1px solid #ece9e0',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1208' }}>{g.label}</div>
                {fixed && (
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                    {colorName(fixedColors[g.id])} · {fixedColors[g.id].toUpperCase()}
                  </div>
                )}
              </div>

              {fixed && (
                <div
                  style={{ width: 36, height: 36, borderRadius: 9, background: fixedColors[g.id], border: '1.5px solid rgba(0,0,0,0.1)', cursor: 'pointer', flexShrink: 0 }}
                  onClick={() => setPicker({ gid: g.id })}
                />
              )}

              <div style={{ display: 'flex', borderRadius: 999, border: '1px solid #e0ddd5', overflow: 'hidden', flexShrink: 0 }}>
                {['suggested', 'fixed'].map(m => (
                  <button key={m} onClick={() => setModes(p => ({ ...p, [g.id]: m }))}
                    style={{
                      padding: '7px 12px', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                      background: modes[g.id] === m ? '#1a1208' : '#fff',
                      color: modes[g.id] === m ? '#fff' : '#888',
                      display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s'
                    }}>
                    {m === 'fixed' ? <Lock size={10} /> : <Sparkles size={10} />}
                    {m === 'fixed' ? 'Fisso' : 'Auto'}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {picker && (
        <ColorPickerModal
          value={fixedColors[picker.gid]}
          onClose={() => setPicker(null)}
          onChange={c => setFixedColors(p => ({ ...p, [picker.gid]: c }))}
          savedColors={savedGarment[picker.gid] || []}
          onSave={c => onSaveGarment(picker.gid, c)}
        />
      )}
    </div>
  );
}

function OutfitCard({ combo, index }) {
  const [expanded, setExpanded] = useState(false);
  const harmony = HARMONIES.find(h => h.id === combo.type);

  return (
    <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #ece9e0', overflow: 'hidden' }}>
      <div style={{ padding: '1rem 1.125rem', cursor: 'pointer' }} onClick={() => setExpanded(e => !e)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#ccc', fontWeight: 700 }}>
            {String(index + 1).padStart(2, '0')}
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1208', fontFamily: 'Georgia, serif', flex: 1 }}>
            {harmony?.name}
          </span>
          <div style={{
            fontSize: 9, fontWeight: 800, letterSpacing: '0.1em',
            padding: '3px 7px', borderRadius: 5, background: '#f0ede5', color: '#888'
          }}>{harmony?.tag}</div>
          <ChevronRight size={14} color="#ccc"
            style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {combo.items.map((item, i) => (
            <ColorDot key={i} hex={item.hex} size={30} fixed={item.fixed} />
          ))}
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid #f0ede5', padding: '0.875rem 1.125rem' }}>
          {combo.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10, marginBottom: 10, borderBottom: i < combo.items.length - 1 ? '1px solid #f8f6f0' : 'none' }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: item.hex, border: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1208' }}>
                  {GARMENTS[i].short}
                  {item.fixed && <span style={{ marginLeft: 5, fontSize: 9, color: '#999', background: '#f0ede5', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>FISSO</span>}
                </div>
                <div style={{ fontSize: 11, color: '#888' }}>{item.name}</div>
              </div>
              <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#bbb' }}>{item.hex.toUpperCase()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultsTab({ combos, comboCount, setComboCount, onRefresh, season }) {
  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <span style={{ fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>Outfit:</span>
          <input
            type="range" min={3} max={10} step={1} value={comboCount}
            onChange={e => setComboCount(parseInt(e.target.value))}
            style={{ flex: 1, accentColor: '#1a1208' }}
          />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1208', minWidth: 16, textAlign: 'center' }}>{comboCount}</span>
        </div>
        <button
          onClick={onRefresh}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 16px', borderRadius: 999,
            border: '1.5px solid #1a1208', background: '#1a1208',
            color: '#faf8f0', cursor: 'pointer', fontSize: 13, fontWeight: 600
          }}
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#aaa' }}>Stagione</span>
        <span style={{ padding: '3px 10px', borderRadius: 999, background: season.card, color: season.text, fontSize: 12, fontWeight: 600 }}>
          {season.emoji} {season.name}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {combos.slice(0, comboCount).map((combo, i) => (
          <OutfitCard key={`${combo.type}-${i}`} combo={combo} index={i} />
        ))}
      </div>

      <div style={{ marginTop: '1rem', fontSize: 11, color: '#ccc', textAlign: 'center' }}>
        Tocca una card per vedere i dettagli colore
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState('profile');
  const [skinColor, setSkinColor] = useState(() => {
    try { return JSON.parse(localStorage.getItem('chs_skinColor')) || '#D4A574'; }
    catch { return '#D4A574'; }
  });
  const [eyeColor, setEyeColor] = useState(() => {
    try { return JSON.parse(localStorage.getItem('chs_eyeColor')) || '#6B4423'; }
    catch { return '#6B4423'; }
  });
  const [hairColor, setHairColor] = useState(() => {
    try { return JSON.parse(localStorage.getItem('chs_hairColor')) || '#3D2B1F'; }
    catch { return '#3D2B1F'; }
  });
  const [savedColors, setSavedColors] = useState(() => {
    try { return JSON.parse(localStorage.getItem('chs_savedColors')) || { skin: [], eye: [], hair: [] }; }
    catch { return { skin: [], eye: [], hair: [] }; }
  });
  const [modes, setModes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('chs_modes')) || Object.fromEntries(GARMENTS.map(g => [g.id, 'suggested'])); }
    catch { return Object.fromEntries(GARMENTS.map(g => [g.id, 'suggested'])); }
  });
  const [fixedColors, setFixedColors] = useState(() => {
    try { return JSON.parse(localStorage.getItem('chs_fixedColors')) || Object.fromEntries(GARMENTS.map(g => [g.id, '#8B7355'])); }
    catch { return Object.fromEntries(GARMENTS.map(g => [g.id, '#8B7355'])); }
  });
  const [savedGarment, setSavedGarment] = useState(() => {
    try { return JSON.parse(localStorage.getItem('chs_savedGarment')) || Object.fromEntries(GARMENTS.map(g => [g.id, []])); }
    catch { return Object.fromEntries(GARMENTS.map(g => [g.id, []])); }
  });
  const [comboCount, setComboCount] = useState(() => {
    try { return JSON.parse(localStorage.getItem('chs_comboCount')) || 5; }
    catch { return 5; }
  });
  const [combos, setCombos] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const season = detectSeason(skinColor, eyeColor, hairColor);

  // Sync localStorage whenever state changes
  useEffect(() => { localStorage.setItem('chs_skinColor', JSON.stringify(skinColor)); }, [skinColor]);
  useEffect(() => { localStorage.setItem('chs_eyeColor', JSON.stringify(eyeColor)); }, [eyeColor]);
  useEffect(() => { localStorage.setItem('chs_hairColor', JSON.stringify(hairColor)); }, [hairColor]);
  useEffect(() => { localStorage.setItem('chs_savedColors', JSON.stringify(savedColors)); }, [savedColors]);
  useEffect(() => { localStorage.setItem('chs_modes', JSON.stringify(modes)); }, [modes]);
  useEffect(() => { localStorage.setItem('chs_fixedColors', JSON.stringify(fixedColors)); }, [fixedColors]);
  useEffect(() => { localStorage.setItem('chs_savedGarment', JSON.stringify(savedGarment)); }, [savedGarment]);
  useEffect(() => { localStorage.setItem('chs_comboCount', JSON.stringify(comboCount)); }, [comboCount]);

  const fixedMap = Object.fromEntries(
    GARMENTS.filter(g => modes[g.id] === 'fixed').map(g => [g.id, fixedColors[g.id]])
  );

  const generate = useCallback(() => {
    const cs = HARMONIES.slice(0, 10).map(h => ({
      type: h.id,
      items: generateCombo(h.id, season.palette, fixedMap),
    }));
    setCombos(cs);
  }, [season.palette, JSON.stringify(fixedMap), refreshKey]);

  useEffect(() => { generate(); }, [generate]);

  const handleSaveColor = (key, color) => {
    setSavedColors(p => ({ ...p, [key]: [...new Set([...p[key], color])].slice(0, 8) }));
  };

  const handleSaveGarment = (gid, color) => {
    setSavedGarment(p => ({ ...p, [gid]: [...new Set([...p[gid], color])].slice(0, 6) }));
  };

  const TABS = [
    { id: 'profile', label: 'Profilo', Icon: User },
    { id: 'wardrobe', label: 'Guardaroba', Icon: Shirt },
    { id: 'results', label: 'Outfit', Icon: LayoutGrid },
  ];

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#faf8f2', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 1.25rem 0', background: '#faf8f2' }}>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: '#1a1208', letterSpacing: '-0.02em' }}>
          Color Harmony
        </div>
        <div style={{ fontSize: 11, color: '#aaa', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 1 }}>
          Armocromia · Stagione {season.name}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'profile' && (
          <ProfileTab
            skinColor={skinColor} setSkinColor={setSkinColor}
            eyeColor={eyeColor} setEyeColor={setEyeColor}
            hairColor={hairColor} setHairColor={setHairColor}
            season={season} savedColors={savedColors} onSave={handleSaveColor}
          />
        )}
        {tab === 'wardrobe' && (
          <WardrobeTab
            modes={modes} setModes={setModes}
            fixedColors={fixedColors} setFixedColors={setFixedColors}
            savedGarment={savedGarment} onSaveGarment={handleSaveGarment}
          />
        )}
        {tab === 'results' && (
          <ResultsTab
            combos={combos} comboCount={comboCount} setComboCount={setComboCount}
            onRefresh={() => setRefreshKey(k => k + 1)} season={season}
          />
        )}
      </div>

      {/* Bottom nav */}
      <div style={{
        display: 'flex', borderTop: '1px solid #ece9e0', background: '#fff',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            style={{
              flex: 1, padding: '12px 0', border: 'none', background: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              color: tab === id ? '#1a1208' : '#bbb',
              transition: 'color 0.15s',
            }}>
            <Icon size={20} />
            <span style={{ fontSize: 10, fontWeight: tab === id ? 700 : 500, letterSpacing: '0.04em' }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

