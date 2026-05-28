import { useState, useCallback, useEffect, useRef, createContext, useContext } from "react";
import ReactDOM from "react-dom";
import { RefreshCw, ChevronRight, Save, Sparkles, Lock, User, Shirt, LayoutGrid, X, Check, Sun, Moon } from "lucide-react";

// ─── Color math ───────────────────────────────────────────────────────────────
function hexToHsl(hex) {
  let r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b);
  let h,s,l=(max+min)/2;
  if(max===min){h=s=0;}else{
    const d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);
    switch(max){case r:h=((g-b)/d+(g<b?6:0))/6;break;case g:h=((b-r)/d+2)/6;break;case b:h=((r-g)/d+4)/6;break;}
  }
  return [h*360,s*100,l*100];
}
function hslToHex(h,s,l){
  h=((h%360)+360)%360;s=Math.min(100,Math.max(0,s));l=Math.min(100,Math.max(0,l));
  s/=100;l/=100;
  const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;
  let r=0,g=0,b=0;
  if(h<60){r=c;g=x;}else if(h<120){r=x;g=c;}else if(h<180){g=c;b=x;}
  else if(h<240){g=x;b=c;}else if(h<300){r=x;b=c;}else{r=c;b=x;}
  return "#"+[r,g,b].map(v=>Math.round((v+m)*255).toString(16).padStart(2,"0")).join("");
}
function contrastColor(hex){
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return(0.299*r+0.587*g+0.114*b)>145?"rgba(0,0,0,0.85)":"rgba(255,255,255,0.95)";
}

// ─── Profile analysis ─────────────────────────────────────────────────────────
function skinUndertone(hex){
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  const ws=(r-b)+(r-g)*0.5;
  if(ws>18)return"warm";if(ws<-8)return"cool";return"neutral";
}
function analyzeProfile(skin,eyes,hair){
  const undertone=skinUndertone(skin);
  const[,,lSk]=hexToHsl(skin);
  const[,sEy]=hexToHsl(eyes);
  const[,sHr,lHr]=hexToHsl(hair);
  const lumContrast=Math.abs(lSk-lHr);

  // Depth: pelle chiarissima (lSk>75) non può essere deep
  // anche se i capelli sono scuri — evita il bug Autunno su pelli molto chiare
  const depth=(lSk<60&&lHr<45)?"deep":"light";

  // Clarity: alto contrasto luminosità pelle/capelli = clear
  const clarity=(lumContrast>35||(sEy+sHr)/2>38)?"clear":"soft";

  // Override: pelle molto chiara + capelli molto scuri + alto contrasto
  // è il profilo classico Inverno — forza cool indipendentemente dall'undertone
  const finalUndertone=(lSk>72&&lHr<20&&lumContrast>55)?"cool":undertone;

  return{undertone:finalUndertone,depth,clarity,lSk,lHr,lumContrast};
}

// ─── 12 Seasons ───────────────────────────────────────────────────────────────
const SEASONS={
  "warm-light-clear":{name:"Primavera Chiara",  emoji:"🌸",grad:["#f7c59f","#e8935a"],text:"#5a2010",desc:"Calda, luminosa e vivace"},
  "warm-light-soft": {name:"Primavera Delicata",emoji:"🌷",grad:["#f5d0a0","#dda070"],text:"#6b3010",desc:"Calda, luminosa e soffusa"},
  "warm-deep-clear": {name:"Autunno Caldo",     emoji:"🍂",grad:["#c87941","#7a3e18"],text:"#fff",   desc:"Caldo, profondo e intenso"},
  "warm-deep-soft":  {name:"Autunno Morbido",   emoji:"🍁",grad:["#b8784a","#6b3820"],text:"#fff",   desc:"Caldo, profondo e morbido"},
  "cool-light-soft": {name:"Estate Soffusa",    emoji:"🌅",grad:["#c5d0e8","#9aaac8"],text:"#1a2848",desc:"Fredda, chiara e polverosa"},
  "cool-light-clear":{name:"Estate Chiara",     emoji:"☀️",grad:["#a8c0e8","#7090c0"],text:"#0a1e40",desc:"Fredda, chiara e nitida"},
  "cool-deep-clear": {name:"Inverno Freddo",    emoji:"❄️",grad:["#4060a0","#101840"],text:"#fff",   desc:"Freddo, profondo e contrastato"},
  "cool-deep-soft":  {name:"Inverno Morbido",   emoji:"🌨️",grad:["#5870a8","#202850"],text:"#fff",   desc:"Freddo, profondo e smorzato"},
  "neutral-light-clear":{name:"Neutro Luminoso",emoji:"✨",grad:["#d8c8a0","#b0985c"],text:"#3a2c08",desc:"Neutro, luminoso e polivalente"},
  "neutral-light-soft": {name:"Neutro Soffuso", emoji:"🌿",grad:["#c8c0a0","#a09878"],text:"#3a3020",desc:"Neutro, chiaro e armonioso"},
  "neutral-deep-clear":  {name:"Neutro Profondo",emoji:"🪨",grad:["#807060","#403830"],text:"#fff",  desc:"Neutro, profondo e deciso"},
  "neutral-deep-soft":   {name:"Neutro Morbido", emoji:"🤎",grad:["#907868","#504038"],text:"#fff",  desc:"Neutro, profondo e smorzato"},
};
function detectSeason(skin,eyes,hair){
  const p=analyzeProfile(skin,eyes,hair);
  const key=p.undertone+"-"+p.depth+"-"+p.clarity;
  return{...(SEASONS[key]||SEASONS["neutral-light-soft"]),...p};
}

// ─── Color naming ─────────────────────────────────────────────────────────────
function colorName(hex){
  const[h,s,l]=hexToHsl(hex);
  if(s<8){if(l>90)return"Bianco";if(l>75)return"Grigio Perla";if(l>55)return"Grigio Chiaro";if(l>35)return"Grigio Medio";if(l>18)return"Grafite";return"Nero";}
  const n=[[15,l>65?"Rosa Pesca":l>40?"Rosso Mattone":"Borgogna"],[30,l>65?"Albicocca":l>40?"Arancio":"Terracotta"],
    [50,l>65?"Crema Dorata":l>40?"Ocra":"Senape"],[75,l>65?"Giallo Pastello":l>40?"Giallo Dorato":"Verde Muschio"],
    [130,l>65?"Verde Menta":l>40?"Verde Salvia":"Verde Bosco"],[165,l>65?"Acquamarina":l>40?"Verde Acqua":"Petrolio"],
    [195,l>65?"Azzurro Cielo":l>40?"Celeste":"Blu Scuro"],[240,l>65?"Blu Polvere":l>40?"Blu Cobalto":"Blu Notte"],
    [275,l>65?"Lavanda":l>40?"Viola":"Indaco"],[310,l>65?"Lilla":l>40?"Malva":"Prugna"],
    [340,l>65?"Rosa Cipria":l>40?"Rosa Antico":"Rosa Scuro"],[360,l>65?"Rosa Pesca":l>40?"Rosso Mattone":"Borgogna"]];
  for(const[t,nm]of n)if(h<t)return nm;
  return"Rosso";
}

// ─── Constants ────────────────────────────────────────────────────────────────
const GARMENTS=[
  {id:"maglia",label:"Maglia / Camicia",short:"Maglia"},
  {id:"felpa",label:"Felpa",short:"Felpa"},
  {id:"giubbotto",label:"Giubbotto",short:"Giubbotto"},
  {id:"cintura",label:"Cintura",short:"Cintura"},
  {id:"pantalone",label:"Pantalone",short:"Pantalone"},
  {id:"calzini",label:"Calzini",short:"Calzini"},
  {id:"scarpe",label:"Scarpe",short:"Scarpe"},
];
const HARMONIES=[
  {id:"mono",name:"Monocromatico",tag:"MONO"},{id:"analog",name:"Analogo",tag:"ANAL"},
  {id:"comp",name:"Complementare",tag:"COMP"},{id:"split",name:"Split-Comp",tag:"SPLT"},
  {id:"triad",name:"Triade",tag:"TRIA"},{id:"tetrad",name:"Tetrade",tag:"TETR"},
  {id:"neutral",name:"Neutri Accentati",tag:"NEUT"},{id:"earth",name:"Toni Terra",tag:"TERA"},
  {id:"pastel",name:"Pastello",tag:"PAST"},{id:"deep",name:"Profondi",tag:"DEEP"},
];

// ─── Harmony generation ───────────────────────────────────────────────────────
function buildPool(type,skinHex,profile){
  const[bH,bS,bL]=hexToHsl(skinHex);
  const hShift=profile.undertone==="warm"?10:profile.undertone==="cool"?-10:0;
  const lMin=profile.depth==="deep"?15:30,lMax=profile.depth==="deep"?65:85;
  const cl=l=>Math.max(lMin,Math.min(lMax,l));
  const ss=profile.clarity==="clear"?1.0:0.65;
  const H=bH+hShift,S=bS*ss,L=cl(bL);
  switch(type){
    case"mono":return Array.from({length:7},(_,i)=>hslToHex(H,S*0.9,cl(lMin+i*((lMax-lMin)/6))));
    case"analog":return[-60,-30,-15,0,15,30,60].map(d=>hslToHex(H+d,S*0.88,L));
    case"comp":return[...[-10,0,10].map(d=>hslToHex(H+d,S,cl(L+5))),...[-10,0,10].map(d=>hslToHex(H+180+d,S*0.85,L)),hslToHex(H,S*0.2,cl(lMax)),hslToHex(H,S*0.2,cl(lMin))];
    case"split":return[0,150,210,10,160,200,-10,170].map(d=>hslToHex(H+d,S*0.88,L));
    case"triad":return[0,5,-5,120,125,115,240,245].map(d=>hslToHex(H+d,S*0.88,L));
    case"tetrad":return[0,90,180,270,8,98,188,278].map(d=>hslToHex(H+d,S*0.85,L));
    case"neutral":{
      const nH=profile.undertone==="warm"?35:profile.undertone==="cool"?220:40;
      const ns=Array.from({length:5},(_,i)=>hslToHex(nH,7,cl(lMin+i*((lMax-lMin)/4))));
      return[...ns,skinHex,hslToHex(H+180,S*0.9,L),hslToHex(H,S*0.4,cl(L+10))];
    }
    case"earth":{
      const eH=profile.undertone==="cool"?[195,205,185,175,140,130,160,150]:[15,25,35,45,90,110,20,30];
      return eH.map(h=>hslToHex(h,32*ss,cl(30+(h%35))));
    }
    case"pastel":return Array.from({length:7},(_,i)=>hslToHex(H+i*35,28*ss,cl(lMax-4)));
    case"deep":return Array.from({length:7},(_,i)=>hslToHex(H+i*30,Math.min(72,S*1.2),cl(lMin+i*4)));
    default:return Array.from({length:7},(_,i)=>hslToHex(H+i*20,S,L));
  }
}
function generateCombo(type,skinHex,profile,fixedMap){
  const pool=buildPool(type,skinHex,profile);
  return GARMENTS.map((g,i)=>{
    if(fixedMap[g.id])return{id:g.id,hex:fixedMap[g.id],name:colorName(fixedMap[g.id]),fixed:true};
    const hex=pool[i%pool.length];
    return{id:g.id,hex,name:colorName(hex),fixed:false};
  });
}

// ─── localStorage ─────────────────────────────────────────────────────────────
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

// ─── ColorDot ─────────────────────────────────────────────────────────────────
function ColorDot({hex,size=32,fixed=false,onClick}){
  return(
    <div onClick={onClick} style={{width:size,height:size,borderRadius:"50%",background:hex,
      border:fixed?"2px solid rgba(255,255,255,0.8)":"1.5px solid rgba(255,255,255,0.4)",
      cursor:onClick?"pointer":"default",flexShrink:0,position:"relative",
      boxShadow:"0 2px 10px rgba(0,0,0,0.22)"}}>
      {fixed&&(
        <div style={{position:"absolute",bottom:-2,right:-2,width:11,height:11,borderRadius:"50%",
          background:"rgba(0,0,0,0.8)",border:"1.5px solid #fff",
          display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Lock size={5} color="#fff"/>
        </div>
      )}
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
  const inputRef=useRef(),fileRef=useRef(),canvasRef=useRef(),isDragging=useRef(false);

  const drawImage=useCallback((src)=>{
    const img=new Image();
    img.onload=()=>{
      const cv=canvasRef.current;if(!cv)return;
      const dpr=window.devicePixelRatio||1;
      const cssW=cv.parentElement.clientWidth;
      const cssH=Math.min(cssW*(img.naturalHeight/img.naturalWidth),260);
      cv.style.width=cssW+"px";cv.style.height=cssH+"px";
      cv.width=Math.round(cssW*dpr);cv.height=Math.round(cssH*dpr);
      const ctx=cv.getContext("2d");ctx.scale(dpr,dpr);ctx.drawImage(img,0,0,cssW,cssH);
    };
    img.src=src;
  },[]);
  useEffect(()=>{if(imgSrc)drawImage(imgSrc);},[imgSrc,drawImage]);

  const pick=useCallback((px,py)=>{
    const cv=canvasRef.current;if(!cv)return;
    const rect=cv.getBoundingClientRect();
    const cssW=parseFloat(cv.style.width)||rect.width;
    const cssH=parseFloat(cv.style.height)||rect.height;
    const cx=Math.max(0,Math.min(cssW-1,px-(rect.left+window.scrollX)));
    const cy=Math.max(0,Math.min(cssH-1,py-(rect.top+window.scrollY)));
    const dpr=window.devicePixelRatio||1;
    const ctx=cv.getContext("2d");
    let R=0,G=0,B=0,n=0;
    for(let dx=-2;dx<=2;dx++){
      for(let dy=-2;dy<=2;dy++){
        const bx=Math.floor(cx*dpr)+dx,by=Math.floor(cy*dpr)+dy;
        if(bx>=0&&bx<cv.width&&by>=0&&by<cv.height){
          const d=ctx.getImageData(bx,by,1,1).data;R+=d[0];G+=d[1];B+=d[2];n++;
        }
      }
    }
    const hex="#"+[Math.round(R/n),Math.round(G/n),Math.round(B/n)].map(v=>v.toString(16).padStart(2,"0")).join("");
    setLocal(hex);setZoom({visible:true,x:cx,y:cy,color:hex});
  },[]);

  const onTS=useCallback(e=>{e.preventDefault();e.stopPropagation();isDragging.current=true;pick(e.touches[0].pageX,e.touches[0].pageY);},[pick]);
  const onTM=useCallback(e=>{if(!isDragging.current)return;e.preventDefault();e.stopPropagation();pick(e.touches[0].pageX,e.touches[0].pageY);},[pick]);
  const onTE=useCallback(e=>{e.preventDefault();isDragging.current=false;setTimeout(()=>setZoom(z=>({...z,visible:false})),900);},[]);
  const onCK=useCallback(e=>{pick(e.pageX,e.pageY);setTimeout(()=>setZoom(z=>({...z,visible:false})),900);},[pick]);
  const handleFile=e=>{
    const f=e.target.files[0];if(!f)return;
    const r=new FileReader();
    r.onload=ev=>{setImgSrc(ev.target.result);setMode("image");};
    r.readAsDataURL(f);
  };

  const sheet=(
    <div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"flex-end",
      justifyContent:"center",background:T.modalOvl,
      backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)"}}
      onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:480,maxHeight:"88vh",
        display:"flex",flexDirection:"column",background:T.modal,
        backdropFilter:T.bd,WebkitBackdropFilter:T.bd,
        borderRadius:"28px 28px 0 0",borderBottom:"none",
        border:T.dark?"1px solid rgba(255,255,255,0.1)":"1px solid rgba(255,255,255,0.8)",
        boxShadow:"0 -8px 48px rgba(0,0,0,0.28)"}}>
        <div style={{display:"flex",justifyContent:"center",padding:"10px 0 2px",flexShrink:0}}>
          <div style={{width:36,height:4,borderRadius:2,background:T.text3}}/>
        </div>
        <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"0 1.25rem"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0.75rem 0 1rem"}}>
            <span style={{fontWeight:700,fontSize:17,fontFamily:"Georgia,serif",color:T.text}}>Seleziona colore</span>
            <button onClick={onClose} style={{border:"none",background:T.input,borderRadius:"50%",width:30,height:30,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <X size={15} color={T.text2}/>
            </button>
          </div>
          <div style={{display:"flex",gap:5,marginBottom:"1rem",background:T.input,borderRadius:14,padding:4}}>
            {[{id:"picker",label:"🎨 Picker"},{id:"image",label:"📷 Da foto"}].map(m=>(
              <button key={m.id} onClick={()=>setMode(m.id)} style={{flex:1,padding:"9px",borderRadius:10,cursor:"pointer",border:mode===m.id?T.cardB:"1px solid transparent",background:mode===m.id?T.card:"transparent",backdropFilter:mode===m.id?T.bd:"none",WebkitBackdropFilter:mode===m.id?T.bd:"none",fontWeight:mode===m.id?700:500,fontSize:13,color:mode===m.id?T.text:T.text2,transition:"all 0.18s"}}>
                {m.label}
              </button>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:"1.25rem",padding:"0.875rem",background:T.card,backdropFilter:T.bd,WebkitBackdropFilter:T.bd,borderRadius:18,border:T.cardB,boxShadow:T.cardS}}>
            <div style={{width:52,height:52,borderRadius:14,background:local,border:"2px solid rgba(255,255,255,0.4)",boxShadow:"0 4px 16px rgba(0,0,0,0.22)",flexShrink:0}}/>
            <div>
              <div style={{fontSize:15,fontWeight:700,color:T.text}}>{colorName(local)}</div>
              <div style={{fontSize:12,fontFamily:"monospace",color:T.text2,marginTop:2}}>{local.toUpperCase()}</div>
            </div>
          </div>
          {mode==="picker"&&(
            <div>
              <div onClick={()=>inputRef.current.click()} style={{width:"100%",height:56,borderRadius:16,background:local,border:"2px solid rgba(255,255,255,0.3)",cursor:"pointer",position:"relative",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"0.875rem",boxShadow:"0 4px 20px rgba(0,0,0,0.2)"}}>
                <span style={{fontSize:13,fontWeight:600,color:contrastColor(local),pointerEvents:"none"}}>Tocca per aprire il color picker</span>
                <input ref={inputRef} type="color" value={local} onChange={e=>setLocal(e.target.value)} style={{position:"absolute",opacity:0,inset:0,width:"100%",height:"100%",cursor:"pointer"}}/>
              </div>
              <button onClick={()=>fileRef.current.click()} style={{width:"100%",padding:"13px",border:"1.5px dashed "+T.text3,borderRadius:14,background:T.input,cursor:"pointer",fontSize:13,fontWeight:600,color:T.text2}}>
                📷 Campiona da foto
              </button>
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
                  <div style={{position:"relative",borderRadius:16,overflow:"hidden",border:T.dark?"1.5px solid rgba(255,255,255,0.12)":"1.5px solid rgba(255,255,255,0.7)",touchAction:"none",boxShadow:T.cardS}}>
                    <canvas ref={canvasRef}
                      style={{display:"block",width:"100%",cursor:"crosshair",userSelect:"none",WebkitUserSelect:"none"}}
                      onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE} onClick={onCK}/>
                    {zoom.visible&&(
                      <div style={{position:"absolute",left:Math.max(36,Math.min(zoom.x-32,240)),top:Math.max(4,zoom.y-84),width:64,height:64,borderRadius:"50%",background:zoom.color,border:"3px solid rgba(255,255,255,0.9)",boxShadow:"0 4px 20px rgba(0,0,0,0.4)",pointerEvents:"none",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2}}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:contrastColor(zoom.color),opacity:0.6}}/>
                        <div style={{fontSize:7,fontFamily:"monospace",color:contrastColor(zoom.color),opacity:0.75}}>{zoom.color.toUpperCase()}</div>
                      </div>
                    )}
                  </div>
                  <button onClick={()=>{setImgSrc(null);if(fileRef.current)fileRef.current.value="";}} style={{marginTop:8,width:"100%",padding:"9px",border:T.inputB,borderRadius:10,background:T.input,cursor:"pointer",fontSize:12,color:T.text2}}>
                    Cambia foto
                  </button>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{display:"none"}}/>
            </div>
          )}
          {savedColors.length>0&&(
            <div style={{marginTop:"1.25rem"}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.08em",color:T.text3,textTransform:"uppercase",marginBottom:10}}>Salvati</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {savedColors.map((c,i)=>(
                  <div key={i} onClick={()=>setLocal(c)} style={{width:40,height:40,borderRadius:10,background:c,border:c===local?"2.5px solid rgba(255,255,255,0.9)":"1.5px solid rgba(255,255,255,0.4)",cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,0.18)"}}/>
                ))}
              </div>
            </div>
          )}
          <div style={{height:"1.25rem"}}/>
        </div>
        <div style={{flexShrink:0,padding:"0.875rem 1.25rem",paddingBottom:"calc(0.875rem + env(safe-area-inset-bottom,0px))",borderTop:"1px solid "+T.sep,background:T.dark?"rgba(0,0,0,0.4)":"rgba(255,255,255,0.4)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",display:"flex",gap:10}}>
          <button onClick={()=>onSave(local)} style={{flex:1,padding:"14px",border:T.cardB,borderRadius:14,background:T.card,backdropFilter:T.bd,WebkitBackdropFilter:T.bd,cursor:"pointer",fontSize:14,fontWeight:600,color:T.text2,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            <Save size={15}/> Salva
          </button>
          <button onClick={()=>{onChange(local);onClose();}} style={{flex:2,padding:"14px",border:"none",borderRadius:14,background:T.dark?"rgba(255,255,255,0.9)":"rgba(0,0,0,0.82)",cursor:"pointer",fontSize:14,fontWeight:700,color:T.dark?"rgba(0,0,0,0.88)":"rgba(255,255,255,0.95)",display:"flex",alignItems:"center",justifyContent:"center",gap:6,boxShadow:"0 4px 16px rgba(0,0,0,0.25)"}}>
            <Check size={15}/> Applica
          </button>
        </div>
      </div>
    </div>
  );
  return ReactDOM.createPortal(sheet,document.body);
}

// ─── ProfileTab ───────────────────────────────────────────────────────────────
function ProfileTab({skinColor,setSkinColor,eyeColor,setEyeColor,hairColor,setHairColor,season,savedColors,onSave}){
  const T=useT();
  const[picker,setPicker]=useState(null);
  const slots=[
    {key:"skin",label:"Incarnato",val:skinColor,set:setSkinColor,saved:savedColors.skin},
    {key:"eye",label:"Occhi",val:eyeColor,set:setEyeColor,saved:savedColors.eye},
    {key:"hair",label:"Capelli",val:hairColor,set:setHairColor,saved:savedColors.hair},
  ];
  const swatches=(()=>{const p=analyzeProfile(skinColor,eyeColor,hairColor);return buildPool("analog",skinColor,p).slice(0,6);})();
  return(
    <div style={{padding:"1rem"}}>
      <div style={{borderRadius:24,marginBottom:"1rem",overflow:"hidden",position:"relative",boxShadow:"0 8px 40px rgba(0,0,0,0.28)"}}>
        <div style={{background:"linear-gradient(145deg,"+season.grad[0]+","+season.grad[1]+")",padding:"1.5rem 1.25rem 1.25rem",position:"relative"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:"50%",background:"linear-gradient(180deg,rgba(255,255,255,0.18) 0%,transparent 100%)",pointerEvents:"none"}}/>
          <div style={{fontSize:30,marginBottom:6}}>{season.emoji}</div>
          <div style={{fontSize:22,fontWeight:800,color:season.text,fontFamily:"Georgia,serif",letterSpacing:"-0.02em",lineHeight:1.1,marginBottom:4}}>{season.name}</div>
          <div style={{fontSize:13,color:season.text,opacity:0.75,marginBottom:"1rem"}}>{season.desc}</div>
          <div style={{display:"flex",gap:5}}>
            {swatches.map((c,i)=>(
              <div key={i} style={{flex:1,height:20,borderRadius:6,background:c,boxShadow:"0 1px 4px rgba(0,0,0,0.18)"}}/>
            ))}
          </div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:"1rem"}}>
        {slots.map(({key,label,val,set,saved})=>(
          <div key={key} onClick={()=>setPicker({key,val,set,saved})} style={{background:T.card,backdropFilter:T.bd,WebkitBackdropFilter:T.bd,borderRadius:18,padding:"0.875rem",border:T.cardB,boxShadow:T.cardS,cursor:"pointer",textAlign:"center"}}>
            <div style={{width:50,height:50,borderRadius:"50%",background:val,border:"2.5px solid rgba(255,255,255,0.5)",margin:"0 auto 8px",boxShadow:"0 4px 14px rgba(0,0,0,0.22)"}}/>
            <div style={{fontSize:10,fontWeight:700,color:T.text2,textTransform:"uppercase",letterSpacing:"0.06em"}}>{label}</div>
            <div style={{fontSize:9,fontFamily:"monospace",color:T.text3,marginTop:2}}>{val.toUpperCase()}</div>
          </div>
        ))}
      </div>
      <div style={{background:T.card,backdropFilter:T.bd,WebkitBackdropFilter:T.bd,borderRadius:14,padding:"0.875rem",fontSize:12,color:T.text2,lineHeight:1.6,border:T.cardB}}>
        <strong style={{color:T.text}}>Come funziona:</strong> Tocca i riquadri per scegliere i tuoi colori o campionarli da una foto. La pelle è l'anchor principale per la stagione.
      </div>
      {picker&&(
        <ColorPickerModal value={picker.val} onClose={()=>setPicker(null)} onChange={c=>picker.set(c)} savedColors={picker.saved} onSave={c=>onSave(picker.key,c)}/>
      )}
    </div>
  );
}

// ─── WardrobeTab ──────────────────────────────────────────────────────────────
function WardrobeTab({modes,setModes,fixedColors,setFixedColors,savedGarment,onSaveGarment}){
  const T=useT();
  const[picker,setPicker]=useState(null);
  return(
    <div style={{padding:"1rem"}}>
      <p style={{fontSize:12,color:T.text2,marginBottom:"0.875rem",lineHeight:1.5}}>
        <strong style={{color:T.text}}>Fisso</strong> = usi tu il colore. <strong style={{color:T.text}}>Auto</strong> = decide l'app.
      </p>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {GARMENTS.map(g=>{
          const fixed=modes[g.id]==="fixed";
          return(
            <div key={g.id} style={{background:T.card,backdropFilter:T.bd,WebkitBackdropFilter:T.bd,borderRadius:16,padding:"0.875rem 1rem",border:T.cardB,boxShadow:T.cardS,display:"flex",alignItems:"center",gap:12}}>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,color:T.text}}>{g.label}</div>
                {fixed&&<div style={{fontSize:11,color:T.text2,marginTop:2}}>{colorName(fixedColors[g.id])} · {fixedColors[g.id].toUpperCase()}</div>}
              </div>
              {fixed&&(
                <div style={{width:34,height:34,borderRadius:9,background:fixedColors[g.id],border:"1.5px solid rgba(255,255,255,0.5)",cursor:"pointer",flexShrink:0,boxShadow:"0 2px 8px rgba(0,0,0,0.2)"}} onClick={()=>setPicker({gid:g.id})}/>
              )}
              <div style={{display:"flex",borderRadius:999,border:T.inputB,overflow:"hidden",flexShrink:0,background:T.input}}>
                {["suggested","fixed"].map(m=>(
                  <button key={m} onClick={()=>setModes(p=>({...p,[g.id]:m}))} style={{padding:"7px 12px",border:"none",cursor:"pointer",fontSize:11,fontWeight:600,transition:"all 0.15s",display:"flex",alignItems:"center",gap:5,background:modes[g.id]===m?(T.dark?"rgba(255,255,255,0.88)":"rgba(0,0,0,0.78)"):"transparent",color:modes[g.id]===m?(T.dark?"rgba(0,0,0,0.88)":"rgba(255,255,255,0.95)"):T.text2}}>
                    {m==="fixed"?<Lock size={10}/>:<Sparkles size={10}/>}
                    {m==="fixed"?"Fisso":"Auto"}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {picker&&(
        <ColorPickerModal value={fixedColors[picker.gid]} onClose={()=>setPicker(null)} onChange={c=>setFixedColors(p=>({...p,[picker.gid]:c}))} savedColors={savedGarment[picker.gid]||[]} onSave={c=>onSaveGarment(picker.gid,c)}/>
      )}
    </div>
  );
}

// ─── OutfitCard ───────────────────────────────────────────────────────────────
function OutfitCard({combo,index}){
  const T=useT();
  const[expanded,setExpanded]=useState(false);
  const h=HARMONIES.find(h=>h.id===combo.type);
  return(
    <div style={{background:T.card,backdropFilter:T.bd,WebkitBackdropFilter:T.bd,borderRadius:20,border:T.cardB,boxShadow:T.cardS,overflow:"hidden"}}>
      <div style={{padding:"1rem 1.125rem",cursor:"pointer"}} onClick={()=>setExpanded(e=>!e)}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <span style={{fontSize:10,fontFamily:"monospace",color:T.text3,fontWeight:700}}>{String(index+1).padStart(2,"0")}</span>
          <span style={{fontSize:13,fontWeight:700,color:T.text,fontFamily:"Georgia,serif",flex:1}}>{h?.name}</span>
          <div style={{fontSize:9,fontWeight:800,letterSpacing:"0.1em",padding:"3px 7px",borderRadius:6,background:T.input,color:T.text2}}>{h?.tag}</div>
          <ChevronRight size={14} color={T.text3} style={{transform:expanded?"rotate(90deg)":"none",transition:"transform 0.2s"}}/>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {combo.items.map((item,i)=><ColorDot key={i} hex={item.hex} size={30} fixed={item.fixed}/>)}
        </div>
      </div>
      {expanded&&(
        <div style={{borderTop:"1px solid "+T.sep,padding:"0.875rem 1.125rem",background:T.dark?"rgba(0,0,0,0.2)":"rgba(255,255,255,0.3)"}}>
          {combo.items.map((item,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,paddingBottom:10,marginBottom:10,borderBottom:i<combo.items.length-1?"1px solid "+T.sep:"none"}}>
              <div style={{width:22,height:22,borderRadius:6,background:item.hex,border:"1px solid rgba(255,255,255,0.4)",boxShadow:"0 1px 4px rgba(0,0,0,0.15)",flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,color:T.text}}>
                  {GARMENTS[i].short}
                  {item.fixed&&<span style={{marginLeft:5,fontSize:9,color:T.text2,background:T.input,padding:"1px 6px",borderRadius:4,fontWeight:700}}>FISSO</span>}
                </div>
                <div style={{fontSize:11,color:T.text2}}>{item.name}</div>
              </div>
              <div style={{fontSize:10,fontFamily:"monospace",color:T.text3}}>{item.hex.toUpperCase()}</div>
            </div>
          ))}
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
      <div style={{marginBottom:"0.75rem",display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",color:T.text3}}>Stagione</span>
        <span style={{padding:"4px 12px",borderRadius:999,background:"linear-gradient(90deg,"+season.grad[0]+","+season.grad[1]+")",color:season.text,fontSize:12,fontWeight:700,boxShadow:"0 2px 8px rgba(0,0,0,0.2)"}}>{season.emoji} {season.name}</span>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {combos.slice(0,comboCount).map((combo,i)=><OutfitCard key={combo.type+i} combo={combo} index={i}/>)}
      </div>
      <div style={{marginTop:"1rem",fontSize:11,color:T.text3,textAlign:"center"}}>Tocca una card per i dettagli colore</div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App(){
  const[dark,setDark]=useState(()=>lsGet("chs_dark",!!(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches)));
  const[tab,setTab]=useState("profile");
  const[skinColor,setSkinColor]=useState(()=>lsGet("chs_skinColor","#D4A574"));
  const[eyeColor,setEyeColor]=useState(()=>lsGet("chs_eyeColor","#6B4423"));
  const[hairColor,setHairColor]=useState(()=>lsGet("chs_hairColor","#3D2B1F"));
  const[savedColors,setSavedColors]=useState(()=>lsGet("chs_savedColors",{skin:[],eye:[],hair:[]}));
  const[modes,setModes]=useState(()=>lsGet("chs_modes",Object.fromEntries(GARMENTS.map(g=>[g.id,"suggested"]))));
  const[fixedColors,setFixedColors]=useState(()=>lsGet("chs_fixedColors",Object.fromEntries(GARMENTS.map(g=>[g.id,"#8B7355"]))));
  const[savedGarment,setSavedGarment]=useState(()=>lsGet("chs_savedGarment",Object.fromEntries(GARMENTS.map(g=>[g.id,[]]))));
  const[comboCount,setComboCount]=useState(()=>lsGet("chs_comboCount",5));
  const[combos,setCombos]=useState([]);
  const[refreshKey,setRefreshKey]=useState(0);

  const T=makeTheme(dark);
  const season=detectSeason(skinColor,eyeColor,hairColor);

  // Aggiorna theme-color meta tag dinamicamente al cambio tema
  useEffect(()=>{
    const meta=document.querySelector("meta[name=theme-color]");
    if(meta)meta.setAttribute("content",dark?"#000000":"#f2f2f7");
  },[dark]);

  useEffect(()=>{lsSet("chs_dark",dark);},[dark]);
  useEffect(()=>{lsSet("chs_skinColor",skinColor);},[skinColor]);
  useEffect(()=>{lsSet("chs_eyeColor",eyeColor);},[eyeColor]);
  useEffect(()=>{lsSet("chs_hairColor",hairColor);},[hairColor]);
  useEffect(()=>{lsSet("chs_savedColors",savedColors);},[savedColors]);
  useEffect(()=>{lsSet("chs_modes",modes);},[modes]);
  useEffect(()=>{lsSet("chs_fixedColors",fixedColors);},[fixedColors]);
  useEffect(()=>{lsSet("chs_savedGarment",savedGarment);},[savedGarment]);
  useEffect(()=>{lsSet("chs_comboCount",comboCount);},[comboCount]);

  const fixedMap=Object.fromEntries(GARMENTS.filter(g=>modes[g.id]==="fixed").map(g=>[g.id,fixedColors[g.id]]));

  const generate=useCallback(()=>{
    const profile=analyzeProfile(skinColor,eyeColor,hairColor);
    setCombos(HARMONIES.slice(0,10).map(h=>({type:h.id,items:generateCombo(h.id,skinColor,profile,fixedMap)})));
  },[skinColor,eyeColor,hairColor,JSON.stringify(fixedMap),refreshKey]);
  useEffect(()=>{generate();},[generate]);

  const handleSaveColor=(key,color)=>setSavedColors(p=>({...p,[key]:[...new Set([...p[key],color])].slice(0,8)}));
  const handleSaveGarment=(gid,color)=>setSavedGarment(p=>({...p,[gid]:[...new Set([...p[gid],color])].slice(0,6)}));

  const TABS=[
    {id:"profile",label:"Profilo",Icon:User},
    {id:"wardrobe",label:"Guardaroba",Icon:Shirt},
    {id:"results",label:"Outfit",Icon:LayoutGrid},
  ];

  const bg=dark
    ?(season.undertone==="warm"?"linear-gradient(180deg,#1a0c06 0%,#0a0602 60%,#000 100%)"
      :season.undertone==="cool"?"linear-gradient(180deg,#060818 0%,#020408 60%,#000 100%)"
      :"linear-gradient(180deg,#0e0e0e 0%,#000 100%)")
    :(season.undertone==="warm"?"linear-gradient(180deg,#fdf6ee 0%,#f2ece4 100%)"
      :season.undertone==="cool"?"linear-gradient(180deg,#eff2fa 0%,#e8ecf5 100%)"
      :"linear-gradient(180deg,#f5f3ee 0%,#ede9e2 100%)");

  // paddingTop copre la status bar su iPhone con black-translucent
  const statusBarHeight="env(safe-area-inset-top,44px)";

  return(
    <ThemeCtx.Provider value={T}>
      {/* Root occupa tutto lo schermo inclusa status bar */}
      <div style={{
        maxWidth:480,margin:"0 auto",
        height:"100vh",
        // webkit-fill-available risolve il problema dello schermo non pieno su Safari
        minHeight:"-webkit-fill-available",
        background:bg,position:"relative",overflow:"hidden"
      }}>
        {/* Scrollable area — inizia sotto la status bar */}
        <div style={{
          position:"absolute",inset:0,
          overflowY:"auto",
          WebkitOverflowScrolling:"touch",
          paddingTop:statusBarHeight,
          paddingBottom:"calc(72px + env(safe-area-inset-bottom,0px))"
        }}>
          {/* Header */}
          <div style={{padding:"1rem 1.25rem 0.5rem",display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
            <div>
              <div style={{fontFamily:"Georgia,serif",fontSize:28,fontWeight:800,color:T.text,letterSpacing:"-0.03em",lineHeight:1}}>Color Harmony</div>
              <div style={{fontSize:12,color:T.text2,marginTop:4}}>{season.emoji} {season.name}</div>
            </div>
            <button onClick={()=>setDark(d=>!d)} style={{width:36,height:36,borderRadius:"50%",border:T.cardB,background:T.card,backdropFilter:T.bd,WebkitBackdropFilter:T.bd,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:T.cardS,flexShrink:0,marginTop:4}}>
              {dark?<Sun size={16} color={T.text}/>:<Moon size={16} color={T.text}/>}
            </button>
          </div>

          {tab==="profile"&&<ProfileTab skinColor={skinColor} setSkinColor={setSkinColor} eyeColor={eyeColor} setEyeColor={setEyeColor} hairColor={hairColor} setHairColor={setHairColor} season={season} savedColors={savedColors} onSave={handleSaveColor}/>}
          {tab==="wardrobe"&&<WardrobeTab modes={modes} setModes={setModes} fixedColors={fixedColors} setFixedColors={setFixedColors} savedGarment={savedGarment} onSaveGarment={handleSaveGarment}/>}
          {tab==="results"&&<ResultsTab combos={combos} comboCount={comboCount} setComboCount={setComboCount} onRefresh={()=>setRefreshKey(k=>k+1)} season={season}/>}
        </div>

        {/* Bottom nav */}
        <div style={{
          position:"absolute",bottom:0,left:0,right:0,zIndex:200,
          background:T.nav,backdropFilter:T.bd,WebkitBackdropFilter:T.bd,
          borderTop:T.navB,
          paddingBottom:"env(safe-area-inset-bottom,0px)"
        }}>
          <div style={{display:"flex",padding:"4px 8px"}}>
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
