import { useState, useCallback, useEffect, useRef, createContext, useContext } from "react";
import ReactDOM from "react-dom";
import { RefreshCw, ChevronRight, Save, Sparkles, Lock, User, Shirt, LayoutGrid, X, Check, Sun, Moon, Minus, Plus, Trash2, AlertTriangle } from "lucide-react";

// ─── Color math ───────────────────────────────────────────────────────────────
function hexToHsl(hex){
  let r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b);
  let h,s,l=(max+min)/2;
  if(max===min){h=s=0;}else{
    const d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);
    switch(max){case r:h=((g-b)/d+(g<b?6:0))/6;break;case g:h=((b-r)/d+2)/6;break;case b:h=((r-g)/d+4)/6;break;}
  }
  return[h*360,s*100,l*100];
}
function hslToHex(h,s,l){
  h=((h%360)+360)%360;s=Math.min(100,Math.max(0,s));l=Math.min(100,Math.max(0,l));
  s/=100;l/=100;
  const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;
  let r=0,g=0,b=0;
  if(h<60){r=c;g=x;}else if(h<120){r=x;g=c;}else if(h<180){g=c;b=x;}
  else if(h<240){g=x;b=c;}else if(h<300){r=x;b=c;}else{r=c;b=x;}
  return"#"+[r,g,b].map(v=>Math.round((v+m)*255).toString(16).padStart(2,"0")).join("");
}
function contrastColor(hex){
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return(0.299*r+0.587*g+0.114*b)>145?"rgba(0,0,0,0.85)":"rgba(255,255,255,0.95)";
}

// ─── Season fit check ─────────────────────────────────────────────────────────
// Returns "ok" | "caution" | "clash"
function colorSeasonFit(hex,profile){
  if(!profile)return"ok";
  const[h,s,l]=hexToHsl(hex);
  const lMin=profile.depth==="deep"?15:30;
  const lMax=profile.depth==="deep"?65:85;
  let p=0;
  // Lightness vs depth
  if(l<lMin-15||l>lMax+15)p+=2;
  else if(l<lMin-6||l>lMax+6)p+=1;
  // Chromatic checks
  if(s>15){
    // Saturation vs intensity
    if(profile.intensity==="low"&&s>65)p+=2;
    else if(profile.intensity==="low"&&s>45)p+=1;
    // Hue vs undertone (rough)
    const isWarmHue=h<60||h>300;
    const isCoolHue=h>170&&h<290;
    if(profile.undertone==="warm"&&isCoolHue&&s>35)p+=1;
    if(profile.undertone==="cool"&&isWarmHue&&s>35)p+=1;
  }
  if(p===0)return"ok";
  if(p<=1)return"caution";
  return"clash";
}

function FitBadge({fit}){
  if(fit==="ok")return null;
  const bg=fit==="caution"?"#D4870A":"#C03030";
  const label=fit==="caution"?"Fuori palette":"Colore distante";
  return(
    <span style={{fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:4,
      background:bg,color:"#fff",letterSpacing:"0.04em",flexShrink:0}}>
      {label}
    </span>
  );
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function normalizeEntry(v){
  if(!v)return{hex:"#8B7355",secondaries:[],pattern:"solid"};
  if(typeof v==="string")return{hex:v,secondaries:[],pattern:"solid"};
  return{hex:v.hex||"#8B7355",secondaries:v.secondaries||[],pattern:v.pattern||"solid"};
}
function avgHue(weightedHues){
  const total=weightedHues.reduce((a,{w})=>a+w,0);
  if(!total)return 0;
  const sx=weightedHues.reduce((a,{h,w})=>a+Math.cos(h*Math.PI/180)*w,0);
  const sy=weightedHues.reduce((a,{h,w})=>a+Math.sin(h*Math.PI/180)*w,0);
  return(((Math.atan2(sy/total,sx/total)*180/Math.PI)%360)+360)%360;
}
function seededRand(seed){
  let s=seed;
  return()=>{s=(s*1664525+1013904223)&0xffffffff;return(s>>>0)/0xffffffff;};
}

// ─── Options ──────────────────────────────────────────────────────────────────
const UNDERTONE_OPTIONS=[
  {id:"warm",   label:"Caldo",  color:"#E8B86D",undertone:"warm"},
  {id:"cool",   label:"Freddo", color:"#B0C4DE",undertone:"cool"},
  {id:"neutral",label:"Neutro", color:"#C8B89A",undertone:"neutral"},
];
const EYE_REFLEXES=[
  {id:"golden",label:"Nocciola/Dorati",color:"#A0742A",intensityHint:"high",undertoneHint:"warm"},
  {id:"green", label:"Verdi",          color:"#5A8A50",intensityHint:"high",undertoneHint:"neutral"},
  {id:"grey",  label:"Grigi/Azzurri",  color:"#7890A8",intensityHint:"low", undertoneHint:"cool"},
  {id:"none",  label:"Nessuno",        color:null,     intensityHint:null,  undertoneHint:null},
];
const HAIR_REFLEXES=[
  {id:"copper",label:"Ramati/Rossi",  color:"#B85030",undertoneHint:"warm",intensityHint:"high"},
  {id:"golden",label:"Dorati",        color:"#C0902A",undertoneHint:"warm",intensityHint:"low"},
  {id:"ashy",  label:"Cenere/Freddi", color:"#8090A0",undertoneHint:"cool",intensityHint:"low"},
  {id:"none",  label:"Nessuno",       color:null,     undertoneHint:null,  intensityHint:null},
];
const PATTERN_OPTIONS=[
  {id:"solid",    label:"Tinta unita"},
  {id:"stripes_v",label:"Righe verticali"},
  {id:"stripes_h",label:"Righe orizzontali"},
  {id:"check",    label:"Quadri / Tartan"},
  {id:"dots",     label:"Pois"},
  {id:"floral",   label:"Fantasia floreale"},
  {id:"abstract", label:"Fantasia astratta"},
];

// ─── Profile analysis ─────────────────────────────────────────────────────────
function skinUndertone(hex){
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  const ws=(r-b)+(r-g)*0.5;
  if(ws>18)return"warm";if(ws<-8)return"cool";return"neutral";
}
function analyzeProfile(skin,eyes,hair,reflexes){
  const[,sSk,lSk]=hexToHsl(skin);
  const[,sEy]=hexToHsl(eyes);
  const[,sHr,lHr]=hexToHsl(hair);
  let undertone=skinUndertone(skin);
  const skinR=UNDERTONE_OPTIONS.find(r=>r.id===reflexes?.skin);
  const hairR=HAIR_REFLEXES.find(r=>r.id===reflexes?.hair);
  const eyeR=EYE_REFLEXES.find(r=>r.id===reflexes?.eye);
  if(skinR&&skinR.undertone!=="neutral")undertone=skinR.undertone;
  else if(skinR?.undertone==="neutral")undertone="neutral";
  else if(hairR?.undertoneHint)undertone=hairR.undertoneHint;
  else if(eyeR?.undertoneHint)undertone=eyeR.undertoneHint;
  else if(lSk>72&&lHr<20&&Math.abs(lSk-lHr)>55)undertone="cool";
  if(undertone==="neutral"){
    const ws=(parseInt(skin.slice(1,3),16)-parseInt(skin.slice(5,7),16))+(parseInt(skin.slice(1,3),16)-parseInt(skin.slice(3,5),16))*0.5;
    undertone=ws>=0?"warm":"cool";
  }
  const depthScore=lSk*0.7+lHr*0.3;
  const depth=depthScore<55?"deep":"light";
  const lumContrast=Math.abs(lSk-lHr);
  let intensityScore=(sSk*0.3+sEy*0.4+sHr*0.3)*0.6+lumContrast*0.4;
  if(hairR?.intensityHint==="high")intensityScore+=12;
  if(hairR?.intensityHint==="low")intensityScore-=8;
  if(eyeR?.intensityHint==="high")intensityScore+=10;
  if(eyeR?.intensityHint==="low")intensityScore-=8;
  const intensity=intensityScore>28?"high":"low";
  const undertoneStr=Math.abs((parseInt(skin.slice(1,3),16)-parseInt(skin.slice(5,7),16))+(parseInt(skin.slice(1,3),16)-parseInt(skin.slice(3,5),16))*0.5);
  const depthStr=Math.abs(depthScore-55),intensityStr=Math.abs(intensityScore-28);
  const maxStr=Math.max(undertoneStr,depthStr,intensityStr);
  let dominant="pure";
  if(maxStr>8){if(undertoneStr===maxStr)dominant="undertone";else if(depthStr===maxStr)dominant="depth";else dominant="intensity";}
  return{undertone,depth,intensity,dominant};
}

// ─── Seasons ──────────────────────────────────────────────────────────────────
const SEASONS={
  "spring-light": {name:"Primavera Chiara",  nameEn:"Spring Light",  emoji:"🌸",grad:["#fce8c0","#f5b87a"],text:"#6b2e08",desc:"Dominante: tono chiaro"},
  "spring-warm":  {name:"Primavera Calda",   nameEn:"Spring Warm",   emoji:"🌼",grad:["#f7c070","#e89040"],text:"#5a2008",desc:"Dominante: sottotono caldo"},
  "spring-bright":{name:"Primavera Brillante",nameEn:"Spring Bright",emoji:"✨",grad:["#f8d060","#f09830"],text:"#5a2008",desc:"Dominante: alta intensità"},
  "spring-true":  {name:"Primavera Pura",    nameEn:"True Spring",   emoji:"🌷",grad:["#f5c890","#e8a060"],text:"#5a2008",desc:"Variabili bilanciate"},
  "summer-light": {name:"Estate Chiara",     nameEn:"Summer Light",  emoji:"☀️",grad:["#dce8f5","#b0c8e8"],text:"#1a2848",desc:"Dominante: tono chiaro"},
  "summer-cool":  {name:"Estate Fredda",     nameEn:"Summer Cool",   emoji:"🌊",grad:["#c0d0e8","#8aa8d0"],text:"#0a1e40",desc:"Dominante: sottotono freddo"},
  "summer-soft":  {name:"Estate Tenue",      nameEn:"Summer Soft",   emoji:"🌅",grad:["#d0c8e0","#a8a0c8"],text:"#2a2050",desc:"Dominante: bassa intensità"},
  "summer-true":  {name:"Estate Pura",       nameEn:"True Summer",   emoji:"🌸",grad:["#c8d8ec","#98b8d8"],text:"#0a1e40",desc:"Variabili bilanciate"},
  "autumn-deep":  {name:"Autunno Profondo",  nameEn:"Autumn Deep",   emoji:"🍂",grad:["#8b5030","#5a2808"],text:"#fff",   desc:"Dominante: tono scuro"},
  "autumn-warm":  {name:"Autunno Caldo",     nameEn:"Autumn Warm",   emoji:"🍁",grad:["#c07830","#884010"],text:"#fff",   desc:"Dominante: sottotono caldo"},
  "autumn-soft":  {name:"Autunno Tenue",     nameEn:"Autumn Soft",   emoji:"🌾",grad:["#b09070","#806040"],text:"#fff",   desc:"Dominante: bassa intensità"},
  "autumn-true":  {name:"Autunno Puro",      nameEn:"True Autumn",   emoji:"🎃",grad:["#a87040","#705020"],text:"#fff",   desc:"Variabili bilanciate"},
  "winter-deep":  {name:"Inverno Profondo",  nameEn:"Winter Deep",   emoji:"🌑",grad:["#202830","#080c10"],text:"#fff",   desc:"Dominante: tono scuro"},
  "winter-cool":  {name:"Inverno Freddo",    nameEn:"Winter Cool",   emoji:"❄️",grad:["#304080","#101840"],text:"#fff",   desc:"Dominante: sottotono freddo"},
  "winter-bright":{name:"Inverno Brillante", nameEn:"Winter Bright", emoji:"💎",grad:["#4060a8","#181840"],text:"#fff",   desc:"Dominante: alta intensità"},
  "winter-true":  {name:"Inverno Puro",      nameEn:"True Winter",   emoji:"🌨️",grad:["#384878","#101530"],text:"#fff",   desc:"Variabili bilanciate"},
};
function detectSeason(skin,eyes,hair,reflexes){
  const p=analyzeProfile(skin,eyes,hair,reflexes);
  const{undertone,depth,intensity,dominant}=p;
  let base=undertone==="warm"&&depth==="light"?"spring":undertone==="cool"&&depth==="light"?"summer":undertone==="warm"&&depth==="deep"?"autumn":"winter";
  let sub=dominant==="pure"?"true":dominant==="depth"?(base==="autumn"||base==="winter")?"deep":"light":dominant==="undertone"?undertone==="warm"?"warm":"cool":intensity==="high"?"bright":"soft";
  return{...(SEASONS[base+"-"+sub]||SEASONS[base+"-true"]),...p,base,sub};
}

const SEASON_ANCHORS={spring:[28,45,15,60,340],summer:[210,240,280,180,310],autumn:[25,40,85,15,200],winter:[220,0,270,180,350]};

// ─── Harmony pool ─────────────────────────────────────────────────────────────
function buildHarmonyPool(type,anchorH,profile,jitter=0){
  const lMin=profile.depth==="deep"?18:32,lMax=profile.depth==="deep"?62:84;
  const cl=l=>Math.max(lMin,Math.min(lMax,l));
  const ss=profile.intensity==="high"?0.85:0.55;
  const H=((anchorH+(profile.undertone==="warm"?8:-8)+jitter)%360+360)%360;
  const lMid=cl((lMin+lMax)/2);
  switch(type){
    case"mono":return Array.from({length:8},(_,i)=>hslToHex(H,Math.min(80,ss*100*(0.6+i*0.05)),cl(lMin+i*((lMax-lMin)/7))));
    case"analog":return[-50,-28,-12,0,12,28,50,35].map((d,i)=>hslToHex(H+d,ss*80,cl(lMid+[-8,5,12,0,-10,6,-5,8][i])));
    case"comp":{const c=H+180;return[...[-12,0,12].map((d,i)=>hslToHex(H+d,ss*82,cl(lMid+[8,0,-8][i]))),  ...[-10,0,10].map((d,i)=>hslToHex(c+d,ss*78,cl(lMid+[-5,5,0][i]))),hslToHex(H,12,cl(lMax-5)),hslToHex(H,8,cl(lMin+5))];}
    case"split":return[0,8,-8,150,158,210,218,160].map((d,i)=>{const b=i<3?H:i<5?H+150:i<7?H+210:H+145;return hslToHex(b+(i<3?[0,8,-8][i]:i<5?[0,8][i-3]:i<7?[0,8][i-5]:0),ss*80,cl(lMid+[-3,8,-8,0,6,-5,4,2][i]));});
    case"triad":return[0,6,-6,120,126,114,240,246].map((d,i)=>hslToHex(H+d,ss*80,cl(lMid+[0,8,-8,4,-6,10,-4,6][i])));
    case"tetrad":return[0,90,180,270,6,96,186,276].map((d,i)=>hslToHex(H+d,ss*78,cl(lMid+[0,6,-6,3,-3,8,-5,4][i])));
    case"neutral":{const nH=profile.undertone==="warm"?32:215;return[...Array.from({length:4},(_,i)=>hslToHex(nH,8+i*3,cl(lMin+i*((lMax-lMin)/4)))),hslToHex(H,ss*85,cl(lMid)),hslToHex(H+180,ss*70,cl(lMid+10)),hslToHex(nH,5,cl(lMax-8)),hslToHex(nH,10,cl(lMin+8))];}
    case"earth":{const eH=profile.undertone==="cool"?[190,200,175,160,215,230,185,170]:[22,35,48,70,15,95,28,42];return eH.map((h,i)=>hslToHex(h,ss*55,cl(28+i*5)));}
    case"pastel":return Array.from({length:8},(_,i)=>hslToHex(H+i*38,ss*42,cl(lMax-6+i%2*3)));
    case"deep":return Array.from({length:8},(_,i)=>hslToHex(H+i*28,Math.min(75,ss*110),cl(lMin+i*4)));
    default:return Array.from({length:8},(_,i)=>hslToHex(H+i*22,ss*75,cl(lMid)));
  }
}

function garmentWeightedHues(entry){
  const e=normalizeEntry(entry);
  const primaryPct=100-(e.secondaries||[]).reduce((a,s)=>a+s.pct,0);
  const result=[{h:hexToHsl(e.hex)[0],w:Math.max(0,primaryPct)}];
  for(const s of(e.secondaries||[])){if(s.hex)result.push({h:hexToHsl(s.hex)[0],w:s.pct});}
  return result;
}

function generateCombo(type,profile,fixedMap,excludedIds,season,seed){
  const rand=seededRand(seed);
  const fixedEntries=Object.entries(fixedMap).filter(([id])=>!excludedIds.includes(id));
  let anchorH;
  if(fixedEntries.length>0){
    anchorH=avgHue(fixedEntries.flatMap(([,entry])=>garmentWeightedHues(entry)));
  } else {
    const anchors=SEASON_ANCHORS[season.base]||SEASON_ANCHORS.autumn;
    anchorH=anchors[Math.floor(rand()*anchors.length)];
  }
  const jitter=(rand()-0.5)*36;
  let effectiveType=type;
  for(const[,entry] of fixedEntries){if((normalizeEntry(entry).pattern||"solid")!=="solid"){effectiveType="mono";break;}}
  const pool=buildHarmonyPool(effectiveType,anchorH,profile,jitter);
  const shuffled=[...pool];
  for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
  let pi=0;
  return GARMENTS.filter(g=>!excludedIds.includes(g.id)).map(g=>{
    if(fixedMap[g.id]){const e=normalizeEntry(fixedMap[g.id]);return{id:g.id,...e,fixed:true,name:colorName(e.hex)};}
    const hex=shuffled[pi%shuffled.length];pi++;
    return{id:g.id,hex,name:colorName(hex),fixed:false};
  });
}

// ─── Color naming ─────────────────────────────────────────────────────────────
function colorName(hex){
  const[h,s,l]=hexToHsl(hex);
  if(s<8){if(l>90)return"Bianco";if(l>75)return"Grigio Perla";if(l>55)return"Grigio Chiaro";if(l>35)return"Grigio Medio";if(l>18)return"Grafite";return"Nero";}
  const n=[[15,l>65?"Rosa Pesca":l>40?"Rosso Mattone":"Borgogna"],[30,l>65?"Albicocca":l>40?"Arancio":"Terracotta"],[50,l>65?"Crema Dorata":l>40?"Ocra":"Senape"],[75,l>65?"Giallo Pastello":l>40?"Giallo Dorato":"Verde Muschio"],[130,l>65?"Verde Menta":l>40?"Verde Salvia":"Verde Bosco"],[165,l>65?"Acquamarina":l>40?"Verde Acqua":"Petrolio"],[195,l>65?"Azzurro Cielo":l>40?"Celeste":"Blu Scuro"],[240,l>65?"Blu Polvere":l>40?"Blu Cobalto":"Blu Notte"],[275,l>65?"Lavanda":l>40?"Viola":"Indaco"],[310,l>65?"Lilla":l>40?"Malva":"Prugna"],[340,l>65?"Rosa Cipria":l>40?"Rosa Antico":"Rosa Scuro"],[360,l>65?"Rosa Pesca":l>40?"Rosso Mattone":"Borgogna"]];
  for(const[t,nm]of n)if(h<t)return nm;
  return"Rosso";
}

const GARMENTS=[
  {id:"maglia",   label:"Maglia / Camicia",short:"Maglia"},
  {id:"felpa",    label:"Felpa",           short:"Felpa"},
  {id:"giubbotto",label:"Giubbotto",       short:"Giubbotto"},
  {id:"cintura",  label:"Cintura",         short:"Cintura"},
  {id:"pantalone",label:"Pantalone",       short:"Pantalone"},
  {id:"calzini",  label:"Calzini",         short:"Calzini"},
  {id:"scarpe",   label:"Scarpe",          short:"Scarpe"},
];
const HARMONIES=[
  {id:"mono",   name:"Monocromatico",   tag:"MONO"},
  {id:"analog", name:"Analogo",         tag:"ANAL"},
  {id:"comp",   name:"Complementare",   tag:"COMP"},
  {id:"split",  name:"Split-Comp",      tag:"SPLT"},
  {id:"triad",  name:"Triade",          tag:"TRIA"},
  {id:"tetrad", name:"Tetrade",         tag:"TETR"},
  {id:"neutral",name:"Neutri Accentati",tag:"NEUT"},
  {id:"earth",  name:"Toni Terra",      tag:"TERA"},
  {id:"pastel", name:"Pastello",        tag:"PAST"},
  {id:"deep",   name:"Profondi",        tag:"DEEP"},
];

function lsGet(k,fb){try{const v=localStorage.getItem(k);return v!=null?JSON.parse(v):fb;}catch{return fb;}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}

// ─── Theme ────────────────────────────────────────────────────────────────────
const ThemeCtx=createContext({});
const useT=()=>useContext(ThemeCtx);
function makeTheme(dark){
  return dark?{dark,
    card:"rgba(30,30,32,0.95)",cardB:"1px solid rgba(255,255,255,0.09)",cardS:"0 4px 28px rgba(0,0,0,0.55),inset 0 1px 0 rgba(255,255,255,0.06)",
    text:"rgba(255,255,255,0.92)",text2:"rgba(255,255,255,0.46)",text3:"rgba(255,255,255,0.22)",
    sep:"rgba(255,255,255,0.09)",nav:"rgba(16,16,18,0.94)",navB:"1px solid rgba(255,255,255,0.1)",
    input:"rgba(255,255,255,0.09)",inputB:"1px solid rgba(255,255,255,0.12)",
    modal:"#1c1c1e",modalOvl:"rgba(0,0,0,0.72)",
    tabActive:"rgba(255,255,255,0.13)",tabActiveText:"rgba(255,255,255,0.95)",tabInactive:"rgba(255,255,255,0.28)",
    bd:"blur(28px) saturate(200%)",
  }:{dark,
    card:"rgba(255,255,255,0.82)",cardB:"1px solid rgba(255,255,255,0.8)",cardS:"0 2px 18px rgba(0,0,0,0.07),inset 0 1px 0 rgba(255,255,255,0.95)",
    text:"rgba(0,0,0,0.88)",text2:"rgba(0,0,0,0.46)",text3:"rgba(0,0,0,0.26)",
    sep:"rgba(0,0,0,0.07)",nav:"rgba(250,250,252,0.9)",navB:"1px solid rgba(0,0,0,0.07)",
    input:"rgba(0,0,0,0.06)",inputB:"1px solid rgba(0,0,0,0.1)",
    modal:"rgba(242,242,247,0.98)",modalOvl:"rgba(0,0,0,0.44)",
    tabActive:"rgba(0,0,0,0.08)",tabActiveText:"rgba(0,0,0,0.88)",tabInactive:"rgba(0,0,0,0.28)",
    bd:"blur(28px) saturate(200%)",
  };
}

function useDarkMode(){
  const sysDark=()=>window.matchMedia?.("(prefers-color-scheme: dark)").matches||false;
  const[dark,setDark]=useState(sysDark);
  useEffect(()=>{
    setDark(sysDark());
    const mq=window.matchMedia?.("(prefers-color-scheme: dark)");
    if(!mq)return;
    const handler=e=>setDark(e.matches);
    mq.addEventListener("change",handler);
    return()=>mq.removeEventListener("change",handler);
  },[]);
  const toggle=useCallback(()=>setDark(d=>!d),[]);
  return[dark,toggle];
}

// ─── ColorDot ─────────────────────────────────────────────────────────────────
function ColorDot({hex,size=32,fixed=false,onClick}){
  return(
    <div onClick={onClick} style={{width:size,height:size,borderRadius:"50%",background:hex,border:fixed?"2px solid rgba(255,255,255,0.8)":"1.5px solid rgba(255,255,255,0.4)",cursor:onClick?"pointer":"default",flexShrink:0,position:"relative",boxShadow:"0 2px 10px rgba(0,0,0,0.22)"}}>
      {fixed&&<div style={{position:"absolute",bottom:-2,right:-2,width:11,height:11,borderRadius:"50%",background:"rgba(0,0,0,0.8)",border:"1.5px solid #fff",display:"flex",alignItems:"center",justifyContent:"center"}}><Lock size={5} color="#fff"/></div>}
    </div>
  );
}

// ─── ReflexPicker ─────────────────────────────────────────────────────────────
function ReflexPicker({label,options,value,onChange,T}){
  return(
    <div style={{marginTop:10}}>
      <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase",color:T.text3,marginBottom:6}}>{label}</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {options.map(opt=>{
          const active=value===opt.id;
          return(
            <button key={opt.id} onClick={()=>onChange(active?null:opt.id)} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:999,border:active?"1.5px solid "+T.text:"1.5px solid "+T.sep,background:active?T.card:T.input,cursor:"pointer",transition:"all 0.15s"}}>
              {opt.color&&<div style={{width:12,height:12,borderRadius:"50%",background:opt.color,border:"1px solid rgba(255,255,255,0.3)"}}/>}
              <span style={{fontSize:11,fontWeight:active?700:500,color:active?T.text:T.text2}}>{opt.label}</span>
              {active&&<Check size={9} color={T.text}/>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── ColorPickerModal ─────────────────────────────────────────────────────────
function ColorPickerModal({value,onClose,onChange,savedColors,onSave}){
  const T=useT();
  const[local,setLocal]=useState(value);
  const[mode,setMode]=useState("picker");
  const[imgSrc,setImgSrc]=useState(null);
  const[zoom,setZoom]=useState({visible:false,x:0,y:0,color:"#000"});
  const inputRef=useRef(),fileRef=useRef(),canvasRef=useRef(),containerRef=useRef(),isDragging=useRef(false);
  const canvasSize=useRef({w:300,h:225});

  const drawImage=useCallback((src)=>{
    const img=new Image();
    img.onload=()=>{
      const cv=canvasRef.current;if(!cv)return;
      const container=containerRef.current;if(!container)return;
      const dpr=window.devicePixelRatio||1;
      const cssW=container.clientWidth;
      const cssH=Math.round(cssW*(3/4));
      cv.style.width=cssW+"px";
      cv.style.height=cssH+"px";
      cv.width=Math.round(cssW*dpr);
      cv.height=Math.round(cssH*dpr);
      canvasSize.current={w:cssW,h:cssH};
      const ctx=cv.getContext("2d");
      ctx.fillStyle="#000";ctx.fillRect(0,0,cv.width,cv.height);
      const iw=img.naturalWidth,ih=img.naturalHeight;
      const scale=Math.min((cssW*dpr)/iw,(cssH*dpr)/ih);
      const dw=iw*scale,dh=ih*scale;
      ctx.drawImage(img,(cv.width-dw)/2,(cv.height-dh)/2,dw,dh);
    };
    img.src=src;
  },[]);
  useEffect(()=>{if(imgSrc)drawImage(imgSrc);},[imgSrc,drawImage]);

  // Convert clientX/Y (viewport coords) → CSS coords relative to canvas
  // Uses the canvas element's own getBoundingClientRect — no scroll offset needed
  const toCss=useCallback((clientX,clientY)=>{
    const cv=canvasRef.current;if(!cv)return{x:0,y:0};
    const rect=cv.getBoundingClientRect();
    // rect.left/top are already in viewport coords — clientX/Y are too
    // So the subtraction is exact, no scroll correction required
    const x=clientX-rect.left;
    const y=clientY-rect.top;
    const{w,h}=canvasSize.current;
    return{x:Math.max(0,Math.min(w,x)),y:Math.max(0,Math.min(h,y))};
  },[]);

  const pick=useCallback((cssX,cssY)=>{
    const cv=canvasRef.current;if(!cv)return;
    const dpr=window.devicePixelRatio||1;
    const ctx=cv.getContext("2d");
    let R=0,G=0,B=0,n=0;
    for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++){
      const bx=Math.round(cssX*dpr)+dx,by=Math.round(cssY*dpr)+dy;
      if(bx>=0&&bx<cv.width&&by>=0&&by<cv.height){
        const d=ctx.getImageData(bx,by,1,1).data;R+=d[0];G+=d[1];B+=d[2];n++;
      }
    }
    if(!n)return;
    const hex="#"+[Math.round(R/n),Math.round(G/n),Math.round(B/n)].map(v=>v.toString(16).padStart(2,"0")).join("");
    setLocal(hex);setZoom({visible:true,x:cssX,y:cssY,color:hex});
  },[]);

  const onTS=useCallback(e=>{
    e.preventDefault();isDragging.current=true;
    const t=e.touches[0];const{x,y}=toCss(t.clientX,t.clientY);pick(x,y);
  },[pick,toCss]);
  const onTM=useCallback(e=>{
    if(!isDragging.current)return;e.preventDefault();
    const t=e.touches[0];const{x,y}=toCss(t.clientX,t.clientY);pick(x,y);
  },[pick,toCss]);
  const onTE=useCallback(e=>{
    e.preventDefault();isDragging.current=false;
    setTimeout(()=>setZoom(z=>({...z,visible:false})),1200);
  },[]);
  const onCK=useCallback(e=>{
    const{x,y}=toCss(e.clientX,e.clientY);pick(x,y);
    setTimeout(()=>setZoom(z=>({...z,visible:false})),1200);
  },[pick,toCss]);
  const handleFile=e=>{
    const f=e.target.files[0];if(!f)return;
    const r=new FileReader();
    r.onload=ev=>{setImgSrc(ev.target.result);setMode("image");};
    r.readAsDataURL(f);
  };

  // Zoom bubble: crosshair at exact point + color preview floating above/below
  const ZoomOverlay=zoom.visible&&(()=>{
    const{w,h}=canvasSize.current;
    const bubbleW=60,bubbleH=60;
    // Float above if in lower half, below if in upper half
    const showAbove=zoom.y>h*0.45;
    const bubbleTop=showAbove
      ?Math.max(2,zoom.y-80)
      :Math.min(h-bubbleH-2,zoom.y+26);
    const bubbleLeft=Math.max(2,Math.min(zoom.x-bubbleW/2,w-bubbleW-2));
    return(
      <>
        {/* Crosshair ring — always exactly at touch point */}
        <div style={{
          position:"absolute",
          left:zoom.x-13,top:zoom.y-13,
          width:26,height:26,
          borderRadius:"50%",
          border:"2px solid rgba(255,255,255,0.95)",
          boxShadow:"0 0 0 1.5px rgba(0,0,0,0.7)",
          pointerEvents:"none",
        }}/>
        {/* Small center dot */}
        <div style={{
          position:"absolute",
          left:zoom.x-2,top:zoom.y-2,
          width:4,height:4,
          borderRadius:"50%",
          background:"rgba(255,255,255,0.9)",
          boxShadow:"0 0 0 1px rgba(0,0,0,0.6)",
          pointerEvents:"none",
        }}/>
        {/* Color preview bubble — floats above or below, never overlaps crosshair */}
        <div style={{
          position:"absolute",
          left:bubbleLeft,top:bubbleTop,
          width:bubbleW,height:bubbleH,
          borderRadius:"50%",
          background:zoom.color,
          border:"3px solid rgba(255,255,255,0.95)",
          boxShadow:"0 4px 20px rgba(0,0,0,0.45)",
          pointerEvents:"none",
          display:"flex",flexDirection:"column",
          alignItems:"center",justifyContent:"center",gap:2,
        }}>
          <div style={{width:7,height:7,borderRadius:"50%",background:contrastColor(zoom.color),opacity:0.65}}/>
          <div style={{fontSize:6,fontFamily:"monospace",color:contrastColor(zoom.color),opacity:0.8,letterSpacing:"0.03em"}}>
            {zoom.color.toUpperCase()}
          </div>
        </div>
      </>
    );
  })();

  const sheet=(
    <div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"flex-end",justifyContent:"center",background:T.modalOvl,backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:480,maxHeight:"88vh",display:"flex",flexDirection:"column",background:T.modal,backdropFilter:T.bd,WebkitBackdropFilter:T.bd,borderRadius:"28px 28px 0 0",border:T.dark?"1px solid rgba(255,255,255,0.1)":"1px solid rgba(255,255,255,0.8)",boxShadow:"0 -8px 48px rgba(0,0,0,0.28)"}}>
        <div style={{display:"flex",justifyContent:"center",padding:"10px 0 2px",flexShrink:0}}><div style={{width:36,height:4,borderRadius:2,background:T.text3}}/></div>
        <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"0 1.25rem"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0.75rem 0 1rem"}}>
            <span style={{fontWeight:700,fontSize:17,fontFamily:"Georgia,serif",color:T.text}}>Seleziona colore</span>
            <button onClick={onClose} style={{border:"none",background:T.input,borderRadius:"50%",width:30,height:30,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={15} color={T.text2}/></button>
          </div>
          <div style={{display:"flex",gap:5,marginBottom:"1rem",background:T.input,borderRadius:14,padding:4}}>
            {[{id:"picker",label:"🎨 Picker"},{id:"image",label:"📷 Da foto"}].map(m=>(
              <button key={m.id} onClick={()=>setMode(m.id)} style={{flex:1,padding:"9px",borderRadius:10,cursor:"pointer",border:mode===m.id?T.cardB:"1px solid transparent",background:mode===m.id?T.card:"transparent",fontWeight:mode===m.id?700:500,fontSize:13,color:mode===m.id?T.text:T.text2,transition:"all 0.18s"}}>{m.label}</button>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:"1.25rem",padding:"0.875rem",background:T.card,backdropFilter:T.bd,WebkitBackdropFilter:T.bd,borderRadius:18,border:T.cardB,boxShadow:T.cardS}}>
            <div style={{width:52,height:52,borderRadius:14,background:local,border:"2px solid rgba(255,255,255,0.4)",flexShrink:0}}/>
            <div><div style={{fontSize:15,fontWeight:700,color:T.text}}>{colorName(local)}</div><div style={{fontSize:12,fontFamily:"monospace",color:T.text2,marginTop:2}}>{local.toUpperCase()}</div></div>
          </div>
          {mode==="picker"&&(
            <div>
              <div onClick={()=>inputRef.current.click()} style={{width:"100%",height:56,borderRadius:16,background:local,border:"2px solid rgba(255,255,255,0.3)",cursor:"pointer",position:"relative",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"0.875rem"}}>
                <span style={{fontSize:13,fontWeight:600,color:contrastColor(local),pointerEvents:"none"}}>Tocca per aprire il color picker</span>
                <input ref={inputRef} type="color" value={local} onChange={e=>setLocal(e.target.value)} style={{position:"absolute",opacity:0,inset:0,width:"100%",height:"100%",cursor:"pointer"}}/>
              </div>
              <button onClick={()=>fileRef.current.click()} style={{width:"100%",padding:"13px",border:"1.5px dashed "+T.text3,borderRadius:14,background:T.input,cursor:"pointer",fontSize:13,fontWeight:600,color:T.text2}}>📷 Campiona da foto</button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{display:"none"}}/>
            </div>
          )}
          {mode==="image"&&(
            <div>
              {!imgSrc?(
                <button onClick={()=>fileRef.current.click()} style={{width:"100%",padding:"32px 16px",border:"2px dashed "+T.text3,borderRadius:18,background:T.input,cursor:"pointer",textAlign:"center"}}>
                  <div style={{fontSize:32,marginBottom:8}}>📷</div>
                  <div style={{fontSize:14,fontWeight:600,color:T.text2}}>Carica una foto</div>
                  <div style={{fontSize:12,color:T.text3,marginTop:4}}>Fotocamera o libreria immagini</div>
                </button>
              ):(
                <div>
                  <div style={{fontSize:12,color:T.text2,marginBottom:8,textAlign:"center"}}>👆 Tocca e trascina per campionare</div>
                  <div
                    ref={containerRef}
                    style={{width:"100%",position:"relative",borderRadius:14,overflow:"hidden",
                      border:T.dark?"1.5px solid rgba(255,255,255,0.12)":"1.5px solid rgba(0,0,0,0.1)",
                      touchAction:"none",background:"#000"}}
                  >
                    <canvas
                      ref={canvasRef}
                      style={{display:"block",cursor:"crosshair",userSelect:"none",WebkitUserSelect:"none"}}
                      onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE} onClick={onCK}
                    />
                    {ZoomOverlay}
                  </div>
                  <button onClick={()=>{setImgSrc(null);if(fileRef.current)fileRef.current.value="";}} style={{marginTop:8,width:"100%",padding:"9px",border:T.inputB,borderRadius:10,background:T.input,cursor:"pointer",fontSize:12,color:T.text2}}>Cambia foto</button>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{display:"none"}}/>
            </div>
          )}
          {savedColors.length>0&&(
            <div style={{marginTop:"1.25rem"}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.08em",color:T.text3,textTransform:"uppercase",marginBottom:10}}>Salvati</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {savedColors.map((c,i)=><div key={i} onClick={()=>setLocal(c)} style={{width:40,height:40,borderRadius:10,background:c,border:c===local?"2.5px solid rgba(255,255,255,0.9)":"1.5px solid rgba(255,255,255,0.4)",cursor:"pointer"}}/>)}
              </div>
            </div>
          )}
          <div style={{height:"1.25rem"}}/>
        </div>
        <div style={{flexShrink:0,padding:"0.875rem 1.25rem",paddingBottom:"calc(0.875rem + env(safe-area-inset-bottom,0px))",borderTop:"1px solid "+T.sep,background:T.dark?"rgba(0,0,0,0.4)":"rgba(255,255,255,0.4)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",display:"flex",gap:10}}>
          <button onClick={()=>onSave(local)} style={{flex:1,padding:"14px",border:T.cardB,borderRadius:14,background:T.card,cursor:"pointer",fontSize:14,fontWeight:600,color:T.text2,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><Save size={15}/> Salva</button>
          <button onClick={()=>{onChange(local);onClose();}} style={{flex:2,padding:"14px",border:"none",borderRadius:14,background:T.dark?"rgba(255,255,255,0.9)":"rgba(0,0,0,0.82)",cursor:"pointer",fontSize:14,fontWeight:700,color:T.dark?"rgba(0,0,0,0.88)":"rgba(255,255,255,0.95)",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><Check size={15}/> Applica</button>
        </div>
      </div>
    </div>
  );
  return ReactDOM.createPortal(sheet,document.body);
}

// ─── GarmentColorEditor ───────────────────────────────────────────────────────
function GarmentColorEditor({entry,onUpdate,savedGarment,onSaveGarment,T}){
  const[pickerTarget,setPickerTarget]=useState(null);
  const e=normalizeEntry(entry);
  const primaryPct=100-(e.secondaries||[]).reduce((a,s)=>a+s.pct,0);
  const addSecondary=()=>{
    if((e.secondaries||[]).length>=2)return;
    onUpdate({...e,secondaries:[...(e.secondaries||[]),{hex:["#8B7355","#4A6080"][(e.secondaries||[]).length],pct:20}]});
  };
  const removeSecondary=i=>{const s=[...(e.secondaries||[])];s.splice(i,1);onUpdate({...e,secondaries:s});};
  const updateSecondaryHex=(i,hex)=>{const s=[...(e.secondaries||[])];s[i]={...s[i],hex};onUpdate({...e,secondaries:s});};
  const updateSecondaryPct=(i,pct)=>{
    const s=[...(e.secondaries||[])];
    const maxPct=90-(e.secondaries||[]).filter((_,j)=>j!==i).reduce((a,x)=>a+x.pct,0);
    s[i]={...s[i],pct:Math.max(5,Math.min(maxPct,pct))};
    onUpdate({...e,secondaries:s});
  };
  return(
    <div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
        <div style={{width:38,height:38,borderRadius:10,background:e.hex,border:"1.5px solid rgba(255,255,255,0.4)",cursor:"pointer",flexShrink:0}} onClick={()=>setPickerTarget("primary")}/>
        <div style={{flex:1}}>
          <div style={{fontSize:12,fontWeight:600,color:T.text}}>{colorName(e.hex)}</div>
          <div style={{fontSize:10,fontFamily:"monospace",color:T.text3}}>{e.hex.toUpperCase()} · {Math.round(primaryPct)}%</div>
        </div>
        {(e.secondaries||[]).length<2&&(
          <button onClick={addSecondary} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:999,border:"1.5px solid "+T.sep,background:T.input,cursor:"pointer",fontSize:11,color:T.text2}}>
            <Plus size={10}/> Colore
          </button>
        )}
      </div>
      {(e.secondaries||[]).map((s,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,paddingLeft:12,borderLeft:"2px solid "+T.sep}}>
          <div style={{width:30,height:30,borderRadius:8,background:s.hex,border:"1.5px solid rgba(255,255,255,0.4)",cursor:"pointer",flexShrink:0}} onClick={()=>setPickerTarget(i)}/>
          <div style={{flex:1}}><div style={{fontSize:11,color:T.text2}}>{colorName(s.hex)}</div></div>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <button onClick={()=>updateSecondaryPct(i,s.pct-5)} style={{width:22,height:22,borderRadius:6,border:T.inputB,background:T.input,cursor:"pointer",color:T.text2,display:"flex",alignItems:"center",justifyContent:"center"}}><Minus size={9}/></button>
            <span style={{fontSize:11,fontWeight:700,color:T.text,minWidth:28,textAlign:"center"}}>{s.pct}%</span>
            <button onClick={()=>updateSecondaryPct(i,s.pct+5)} style={{width:22,height:22,borderRadius:6,border:T.inputB,background:T.input,cursor:"pointer",color:T.text2,display:"flex",alignItems:"center",justifyContent:"center"}}><Plus size={9}/></button>
          </div>
          <button onClick={()=>removeSecondary(i)} style={{width:24,height:24,borderRadius:6,border:"none",background:"transparent",cursor:"pointer",color:T.text3,display:"flex",alignItems:"center",justifyContent:"center"}}><Trash2 size={12}/></button>
        </div>
      ))}
      <div style={{marginTop:8}}>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase",color:T.text3,marginBottom:6}}>Fantasia</div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {PATTERN_OPTIONS.map(p=>{
            const active=(e.pattern||"solid")===p.id;
            return<button key={p.id} onClick={()=>onUpdate({...e,pattern:p.id})} style={{padding:"4px 10px",borderRadius:999,border:active?"1.5px solid "+T.text:"1.5px solid "+T.sep,background:active?T.card:T.input,cursor:"pointer",fontSize:11,fontWeight:active?700:500,color:active?T.text:T.text2}}>{p.label}</button>;
          })}
        </div>
      </div>
      {pickerTarget==="primary"&&<ColorPickerModal value={e.hex} onClose={()=>setPickerTarget(null)} onChange={hex=>onUpdate({...e,hex})} savedColors={savedGarment} onSave={onSaveGarment}/>}
      {typeof pickerTarget==="number"&&<ColorPickerModal value={(e.secondaries||[])[pickerTarget]?.hex||"#888888"} onClose={()=>setPickerTarget(null)} onChange={hex=>updateSecondaryHex(pickerTarget,hex)} savedColors={savedGarment} onSave={onSaveGarment}/>}
    </div>
  );
}

// ─── ProfileTab ───────────────────────────────────────────────────────────────
function ProfileTab({skinColor,setSkinColor,eyeColor,setEyeColor,hairColor,setHairColor,season,savedColors,onSave,reflexes,setReflexes}){
  const T=useT();
  const[picker,setPicker]=useState(null);
  const slots=[
    {key:"skin",label:"Incarnato",val:skinColor,set:setSkinColor,saved:savedColors.skin,reflexOptions:UNDERTONE_OPTIONS,reflexKey:"skin",reflexLabel:"Sottotono"},
    {key:"eye", label:"Occhi",    val:eyeColor, set:setEyeColor, saved:savedColors.eye, reflexOptions:EYE_REFLEXES,      reflexKey:"eye", reflexLabel:"Riflessi"},
    {key:"hair",label:"Capelli",  val:hairColor,set:setHairColor,saved:savedColors.hair,reflexOptions:HAIR_REFLEXES,     reflexKey:"hair",reflexLabel:"Riflessi"},
  ];
  const swatches=(()=>{
    const p=analyzeProfile(skinColor,eyeColor,hairColor,reflexes);
    return buildHarmonyPool("analog",(SEASON_ANCHORS[season.base]||SEASON_ANCHORS.autumn)[0],p,0).slice(0,6);
  })();
  return(
    <div style={{padding:"1rem"}}>
      <div style={{borderRadius:24,marginBottom:"1rem",overflow:"hidden",boxShadow:"0 8px 40px rgba(0,0,0,0.28)"}}>
        <div style={{background:"linear-gradient(145deg,"+season.grad[0]+","+season.grad[1]+")",padding:"1.5rem 1.25rem 1.25rem",position:"relative"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:"50%",background:"linear-gradient(180deg,rgba(255,255,255,0.18) 0%,transparent 100%)",pointerEvents:"none"}}/>
          <div style={{fontSize:28,marginBottom:6}}>{season.emoji}</div>
          <div style={{fontSize:20,fontWeight:800,color:season.text,fontFamily:"Georgia,serif",letterSpacing:"-0.02em",lineHeight:1.1,marginBottom:2}}>{season.name}</div>
          <div style={{fontSize:11,color:season.text,opacity:0.6,marginBottom:4,fontStyle:"italic"}}>{season.nameEn}</div>
          <div style={{fontSize:12,color:season.text,opacity:0.75,marginBottom:"1rem"}}>{season.desc}</div>
          <div style={{display:"flex",gap:5}}>{swatches.map((c,i)=><div key={i} style={{flex:1,height:20,borderRadius:6,background:c}}/>)}</div>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:"1rem"}}>
        {slots.map(({key,label,val,set,saved,reflexOptions,reflexKey,reflexLabel})=>(
          <div key={key} style={{background:T.card,backdropFilter:T.bd,WebkitBackdropFilter:T.bd,borderRadius:18,padding:"0.875rem 1rem",border:T.cardB,boxShadow:T.cardS}}>
            <div style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer"}} onClick={()=>setPicker({key,val,set,saved})}>
              <div style={{width:46,height:46,borderRadius:"50%",background:val,border:"2.5px solid rgba(255,255,255,0.5)",flexShrink:0}}/>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:T.text}}>{label}</div><div style={{fontSize:10,fontFamily:"monospace",color:T.text3,marginTop:1}}>{val.toUpperCase()}</div></div>
              <ChevronRight size={16} color={T.text3}/>
            </div>
            <ReflexPicker label={reflexLabel} options={reflexOptions} value={reflexes[reflexKey]||null} onChange={v=>setReflexes(p=>({...p,[reflexKey]:v}))} T={T}/>
          </div>
        ))}
      </div>
      <div style={{background:T.card,backdropFilter:T.bd,WebkitBackdropFilter:T.bd,borderRadius:14,padding:"0.875rem",fontSize:12,color:T.text2,lineHeight:1.6,border:T.cardB}}>
        <strong style={{color:T.text}}>Suggerimento:</strong> Sottotono e riflessi sono opzionali ma migliorano la precisione. Tocca per deselezionare.
      </div>
      {picker&&<ColorPickerModal value={picker.val} onClose={()=>setPicker(null)} onChange={c=>picker.set(c)} savedColors={picker.saved} onSave={c=>onSave(picker.key,c)}/>}
    </div>
  );
}

// ─── WardrobeTab ──────────────────────────────────────────────────────────────
function WardrobeTab({modes,setModes,fixedColors,setFixedColors,savedGarment,onSaveGarment,season}){
  const T=useT();
  const[expandedId,setExpandedId]=useState(null);
  return(
    <div style={{padding:"1rem"}}>
      <p style={{fontSize:12,color:T.text2,marginBottom:"0.875rem",lineHeight:1.6}}>
        <strong style={{color:T.text}}>Auto</strong> = suggerito · <strong style={{color:T.text}}>Fisso</strong> = colore tuo · <strong style={{color:T.text}}>Escludi</strong> = non incluso.
      </p>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {GARMENTS.map(g=>{
          const mode=modes[g.id]||"auto";
          const excluded=mode==="excluded",fixed=mode==="fixed";
          const entry=normalizeEntry(fixedColors[g.id]);
          const isExp=expandedId===g.id;
          const fit=fixed?colorSeasonFit(entry.hex,season):null;
          const mBtn=(m,Icon,label)=>{
            const active=mode===m;
            return(
              <button onClick={()=>setModes(p=>({...p,[g.id]:m}))} style={{padding:"6px 10px",border:"none",cursor:"pointer",fontSize:11,fontWeight:600,transition:"all 0.15s",display:"flex",alignItems:"center",gap:4,background:active?(T.dark?"rgba(255,255,255,0.88)":"rgba(0,0,0,0.78)"):"transparent",color:active?(T.dark?"rgba(0,0,0,0.88)":"rgba(255,255,255,0.95)"):T.text2}}>
                <Icon size={10}/>{label}
              </button>
            );
          };
          return(
            <div key={g.id} style={{background:T.card,backdropFilter:T.bd,WebkitBackdropFilter:T.bd,borderRadius:16,border:T.cardB,boxShadow:T.cardS,overflow:"hidden",opacity:excluded?0.45:1,transition:"opacity 0.2s"}}>
              <div style={{padding:"0.875rem 1rem",display:"flex",alignItems:"center",gap:12}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                    <div style={{fontSize:14,fontWeight:600,color:T.text,textDecoration:excluded?"line-through":"none"}}>{g.label}</div>
                    {fit&&fit!=="ok"&&<FitBadge fit={fit}/>}
                  </div>
                  {fixed&&!excluded&&(
                    <div style={{fontSize:11,color:T.text2,marginTop:2}}>
                      {colorName(entry.hex)}
                      {(entry.secondaries||[]).length>0&&" + "+(entry.secondaries||[]).length+" col."}
                      {entry.pattern&&entry.pattern!=="solid"&&" · "+(PATTERN_OPTIONS.find(p=>p.id===entry.pattern)?.label||"")}
                    </div>
                  )}
                  {excluded&&<div style={{fontSize:11,color:T.text3,marginTop:2}}>Non incluso</div>}
                </div>
                {fixed&&!excluded&&(
                  <div style={{display:"flex",gap:3}}>
                    <div style={{width:28,height:28,borderRadius:7,background:entry.hex,border:"1.5px solid rgba(255,255,255,0.4)"}}/>
                    {(entry.secondaries||[]).map((s,i)=><div key={i} style={{width:28,height:28,borderRadius:7,background:s.hex,border:"1.5px solid rgba(255,255,255,0.4)"}}/>)}
                  </div>
                )}
                <div style={{display:"flex",borderRadius:12,border:T.inputB,overflow:"hidden",flexShrink:0,background:T.input}}>
                  {mBtn("auto",Sparkles,"Auto")}
                  {mBtn("fixed",Lock,"Fisso")}
                  {mBtn("excluded",Minus,"Escludi")}
                </div>
              </div>
              {fixed&&!excluded&&(
                <>
                  <button onClick={()=>setExpandedId(e=>e===g.id?null:g.id)} style={{width:"100%",padding:"8px 1rem",border:"none",borderTop:"1px solid "+T.sep,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,color:T.text2,fontSize:12}}>
                    {isExp?"Chiudi":"Modifica colori e fantasia"}
                    <ChevronRight size={12} style={{transform:isExp?"rotate(90deg)":"none",transition:"transform 0.2s"}}/>
                  </button>
                  {isExp&&(
                    <div style={{padding:"0.75rem 1rem 1rem",borderTop:"1px solid "+T.sep}}>
                      <GarmentColorEditor entry={entry} onUpdate={e=>setFixedColors(p=>({...p,[g.id]:e}))} savedGarment={savedGarment[g.id]||[]} onSaveGarment={c=>onSaveGarment(g.id,c)} T={T}/>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── OutfitCard ───────────────────────────────────────────────────────────────
function OutfitCard({combo,index,profile}){
  const T=useT();
  const[expanded,setExpanded]=useState(false);
  const h=HARMONIES.find(h=>h.id===combo.type);
  // Count clashes among all items for the compact header
  const clashCount=combo.items.filter(item=>{
    const fit=colorSeasonFit(item.hex,profile);
    return fit==="clash"||(item.fixed&&fit==="caution");
  }).length;
  return(
    <div style={{background:T.card,backdropFilter:T.bd,WebkitBackdropFilter:T.bd,borderRadius:20,border:T.cardB,boxShadow:T.cardS,overflow:"hidden"}}>
      <div style={{padding:"1rem 1.125rem",cursor:"pointer"}} onClick={()=>setExpanded(e=>!e)}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <span style={{fontSize:10,fontFamily:"monospace",color:T.text3,fontWeight:700}}>{String(index+1).padStart(2,"0")}</span>
          <span style={{fontSize:13,fontWeight:700,color:T.text,fontFamily:"Georgia,serif",flex:1}}>{h?.name}</span>
          {clashCount>0&&(
            <div style={{display:"flex",alignItems:"center",gap:3,padding:"2px 7px",borderRadius:6,background:"rgba(200,60,40,0.15)",border:"1px solid rgba(200,60,40,0.3)"}}>
              <AlertTriangle size={9} color="#C03030"/>
              <span style={{fontSize:9,fontWeight:700,color:"#C03030"}}>{clashCount}</span>
            </div>
          )}
          <div style={{fontSize:9,fontWeight:800,letterSpacing:"0.1em",padding:"3px 7px",borderRadius:6,background:T.input,color:T.text2}}>{h?.tag}</div>
          <ChevronRight size={14} color={T.text3} style={{transform:expanded?"rotate(90deg)":"none",transition:"transform 0.2s"}}/>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
          {combo.items.map((item,i)=><ColorDot key={i} hex={item.hex} size={30} fixed={item.fixed}/>)}
        </div>
      </div>
      {expanded&&(
        <div style={{borderTop:"1px solid "+T.sep,padding:"0.875rem 1.125rem",background:T.dark?"rgba(0,0,0,0.2)":"rgba(255,255,255,0.3)"}}>
          {combo.items.map((item,i)=>{
            const fit=colorSeasonFit(item.hex,profile);
            return(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,paddingBottom:10,marginBottom:10,borderBottom:i<combo.items.length-1?"1px solid "+T.sep:"none"}}>
                <div style={{width:22,height:22,borderRadius:6,background:item.hex,border:"1px solid rgba(255,255,255,0.4)",flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
                    <span style={{fontSize:12,fontWeight:600,color:T.text}}>
                      {GARMENTS.find(g=>g.id===item.id)?.short||item.id}
                    </span>
                    {item.fixed&&<span style={{fontSize:9,color:T.text2,background:T.input,padding:"1px 5px",borderRadius:4,fontWeight:700}}>FISSO</span>}
                    {fit!=="ok"&&<FitBadge fit={fit}/>}
                  </div>
                  <div style={{fontSize:11,color:T.text2}}>{item.name}</div>
                </div>
                <div style={{fontSize:10,fontFamily:"monospace",color:T.text3}}>{item.hex.toUpperCase()}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── ResultsTab ───────────────────────────────────────────────────────────────
function ResultsTab({combos,comboCount,setComboCount,onRefresh,season}){
  const T=useT();
  return(
    <div style={{padding:"1rem"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:"1rem"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flex:1}}>
          <span style={{fontSize:12,color:T.text2,whiteSpace:"nowrap"}}>Outfit:</span>
          <input type="range" min={3} max={10} step={1} value={comboCount} onChange={e=>setComboCount(parseInt(e.target.value))} style={{flex:1,accentColor:T.dark?"#fff":"#000"}}/>
          <span style={{fontSize:14,fontWeight:700,color:T.text,minWidth:16,textAlign:"center"}}>{comboCount}</span>
        </div>
        <button onClick={onRefresh} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 16px",borderRadius:999,border:T.cardB,background:T.card,backdropFilter:T.bd,WebkitBackdropFilter:T.bd,color:T.text,cursor:"pointer",fontSize:13,fontWeight:600,boxShadow:T.cardS}}>
          <RefreshCw size={13}/> Refresh
        </button>
      </div>
      <div style={{marginBottom:"0.75rem",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",color:T.text3}}>Stagione</span>
        <span style={{padding:"4px 12px",borderRadius:999,background:"linear-gradient(90deg,"+season.grad[0]+","+season.grad[1]+")",color:season.text,fontSize:12,fontWeight:700}}>{season.emoji} {season.name}</span>
        <span style={{fontSize:11,color:T.text3,fontStyle:"italic"}}>{season.nameEn}</span>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {combos.slice(0,comboCount).map((combo,i)=>(
          <OutfitCard key={combo.type+"-"+i} combo={combo} index={i} profile={season}/>
        ))}
      </div>
      <div style={{marginTop:"1rem",fontSize:11,color:T.text3,textAlign:"center"}}>Tocca una card per i dettagli · <AlertTriangle size={9} style={{verticalAlign:"middle"}}/> = colore fuori stagione</div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App(){
  const[dark,toggleDark]=useDarkMode();
  const[tab,setTab]=useState("profile");
  const[skinColor,setSkinColor]=useState(()=>lsGet("chs_skinColor","#D4A574"));
  const[eyeColor,setEyeColor]=useState(()=>lsGet("chs_eyeColor","#6B4423"));
  const[hairColor,setHairColor]=useState(()=>lsGet("chs_hairColor","#3D2B1F"));
  const[savedColors,setSavedColors]=useState(()=>lsGet("chs_savedColors",{skin:[],eye:[],hair:[]}));
  const[reflexes,setReflexes]=useState(()=>lsGet("chs_reflexes",{skin:null,eye:null,hair:null}));
  const[modes,setModes]=useState(()=>lsGet("chs_modes",Object.fromEntries(GARMENTS.map(g=>[g.id,"auto"]))));
  const[fixedColors,setFixedColors]=useState(()=>{
    const saved=lsGet("chs_fixedColors",null);
    const defaults=Object.fromEntries(GARMENTS.map(g=>[g.id,{hex:"#8B7355",secondaries:[],pattern:"solid"}]));
    if(!saved)return defaults;
    return Object.fromEntries(GARMENTS.map(g=>[g.id,normalizeEntry(saved[g.id])]));
  });
  const[savedGarment,setSavedGarment]=useState(()=>lsGet("chs_savedGarment",Object.fromEntries(GARMENTS.map(g=>[g.id,[]]))));
  const[comboCount,setComboCount]=useState(()=>lsGet("chs_comboCount",5));
  const[combos,setCombos]=useState([]);
  const[refreshKey,setRefreshKey]=useState(0);

  const T=makeTheme(dark);
  const season=detectSeason(skinColor,eyeColor,hairColor,reflexes);

  useEffect(()=>{const meta=document.querySelector("meta[name=theme-color]");if(meta)meta.setAttribute("content",dark?"#000000":"#f2f2f7");},[dark]);
  useEffect(()=>{lsSet("chs_skinColor",skinColor);},[skinColor]);
  useEffect(()=>{lsSet("chs_eyeColor",eyeColor);},[eyeColor]);
  useEffect(()=>{lsSet("chs_hairColor",hairColor);},[hairColor]);
  useEffect(()=>{lsSet("chs_savedColors",savedColors);},[savedColors]);
  useEffect(()=>{lsSet("chs_reflexes",reflexes);},[reflexes]);
  useEffect(()=>{lsSet("chs_modes",modes);},[modes]);
  useEffect(()=>{lsSet("chs_fixedColors",fixedColors);},[fixedColors]);
  useEffect(()=>{lsSet("chs_savedGarment",savedGarment);},[savedGarment]);
  useEffect(()=>{lsSet("chs_comboCount",comboCount);},[comboCount]);

  const fixedMap=Object.fromEntries(GARMENTS.filter(g=>modes[g.id]==="fixed").map(g=>[g.id,normalizeEntry(fixedColors[g.id])]));
  const excludedIds=GARMENTS.filter(g=>modes[g.id]==="excluded").map(g=>g.id);

  const generate=useCallback(()=>{
    const profile=analyzeProfile(skinColor,eyeColor,hairColor,reflexes);
    const baseSeed=(refreshKey+1)*99991+Date.now()%9973;
    setCombos(HARMONIES.map((h,i)=>({type:h.id,items:generateCombo(h.id,profile,fixedMap,excludedIds,season,baseSeed+i*7)})));
  },[skinColor,eyeColor,hairColor,JSON.stringify(reflexes),JSON.stringify(fixedMap),JSON.stringify(excludedIds),season.base,season.sub,refreshKey]);

  useEffect(()=>{generate();},[generate]);

  const handleSaveColor=(key,color)=>setSavedColors(p=>({...p,[key]:[...new Set([...p[key],color])].slice(0,8)}));
  const handleSaveGarment=(gid,color)=>setSavedGarment(p=>({...p,[gid]:[...new Set([...p[gid],color])].slice(0,6)}));

  const TABS=[{id:"profile",label:"Profilo",Icon:User},{id:"wardrobe",label:"Guardaroba",Icon:Shirt},{id:"results",label:"Outfit",Icon:LayoutGrid}];
  const bg=dark?(season.undertone==="warm"?"linear-gradient(180deg,#1a0c06 0%,#0a0602 60%,#000 100%)":"linear-gradient(180deg,#060818 0%,#020408 60%,#000 100%)"):(season.undertone==="warm"?"linear-gradient(180deg,#fdf6ee 0%,#f2ece4 100%)":"linear-gradient(180deg,#eff2fa 0%,#e8ecf5 100%)");

  return(
    <ThemeCtx.Provider value={T}>
      <div style={{position:"fixed",inset:0,background:bg,overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,overflowY:"auto",WebkitOverflowScrolling:"touch",paddingTop:"env(safe-area-inset-top,0px)",paddingBottom:"calc(64px + env(safe-area-inset-bottom,0px))",paddingLeft:"env(safe-area-inset-left,0px)",paddingRight:"env(safe-area-inset-right,0px)"}}>
          <div style={{maxWidth:480,margin:"0 auto"}}>
            <div style={{padding:"1rem 1.25rem 0.5rem",display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
              <div>
                <div style={{fontFamily:"Georgia,serif",fontSize:28,fontWeight:800,color:T.text,letterSpacing:"-0.03em",lineHeight:1}}>Color Harmony</div>
                <div style={{fontSize:12,color:T.text2,marginTop:4}}>{season.emoji} {season.name}</div>
              </div>
              <button onClick={toggleDark} style={{width:36,height:36,borderRadius:"50%",border:T.cardB,background:T.card,backdropFilter:T.bd,WebkitBackdropFilter:T.bd,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:T.cardS,flexShrink:0,marginTop:4}}>
                {dark?<Sun size={16} color={T.text}/>:<Moon size={16} color={T.text}/>}
              </button>
            </div>
            {tab==="profile"&&<ProfileTab skinColor={skinColor} setSkinColor={setSkinColor} eyeColor={eyeColor} setEyeColor={setEyeColor} hairColor={hairColor} setHairColor={setHairColor} season={season} savedColors={savedColors} onSave={handleSaveColor} reflexes={reflexes} setReflexes={setReflexes}/>}
            {tab==="wardrobe"&&<WardrobeTab modes={modes} setModes={setModes} fixedColors={fixedColors} setFixedColors={setFixedColors} savedGarment={savedGarment} onSaveGarment={handleSaveGarment} season={season}/>}
            {tab==="results"&&<ResultsTab combos={combos} comboCount={comboCount} setComboCount={setComboCount} onRefresh={()=>setRefreshKey(k=>k+1)} season={season}/>}
          </div>
        </div>
        <div style={{position:"absolute",bottom:0,left:0,right:0,zIndex:200,background:T.nav,backdropFilter:T.bd,WebkitBackdropFilter:T.bd,borderTop:T.navB,paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
          <div style={{display:"flex",maxWidth:480,margin:"0 auto",padding:"4px 8px"}}>
            {TABS.map(({id,label,Icon})=>{
              const active=tab===id;
              return(
                <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"10px 0",border:"none",background:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,position:"relative"}}>
                  {active&&<div style={{position:"absolute",inset:0,borderRadius:12,background:T.tabActive,margin:"2px 4px"}}/>}
                  <Icon size={21} color={active?T.tabActiveText:T.tabInactive} strokeWidth={active?2.5:1.8}/>
                  <span style={{fontSize:10,fontWeight:active?700:500,color:active?T.tabActiveText:T.tabInactive,letterSpacing:"0.02em",position:"relative"}}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}
