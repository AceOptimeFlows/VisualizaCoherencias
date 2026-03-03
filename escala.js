/* ==============================================
   Entradas principales / Salidas / Utilidades UI
   ============================================== */
const inputActual = $("#inputActual");
const inputMin    = $("#inputMin");
const inputMax    = $("#inputMax");
const cntActual = $("#cntActual");
const cntMin    = $("#cntMin");
const cntMax    = $("#cntMax");
// Desglose por campo
const lvlActualEl = $("#lvlActual"), decActualEl = $("#decActual");
const lvlMinEl    = $("#lvlMin"),    decMinEl    = $("#decMin");
const lvlMaxEl    = $("#lvlMax"),    decMaxEl    = $("#decMax");
// Δ‑nivel en resultados
const deltaObsMinEl = $("#deltaObsMin");
const deltaObsMaxEl = $("#deltaObsMax");
const deltaRangeEl  = $("#deltaRange");

const modeEP = $("#modeEP");
const modeNR = $("#modeNR");
const factorBadge = $("#factorBadge");
const errorMsg = $("#errorMsg");
const clearBtn = $("#clearBtn");
const cuValueEl = $("#cuValue");
const cuExtEl   = $("#cuExtValue");

function writeOut(el, txt){ if (!el) return; if ("value" in el) el.value = txt; else el.textContent = txt; }
function readOut(el){ if (!el) return ""; return ("value" in el) ? el.value : el.textContent; }
async function copy(t){ try{ await navigator.clipboard.writeText(t);}catch(_){} }

const copyCuBtn = $("#copyCuBtn");
const copyCuExtBtn = $("#copyCuExtBtn");

const messagesCard = $("#messagesCard");
const messagesList = $("#messagesList");
function setMessagesHTML(html){
  if(!html){
    messagesCard?.setAttribute("hidden","");
    messagesList && (messagesList.innerHTML="");
    return;
  }
  messagesList && (messagesList.innerHTML=html);
  messagesCard?.removeAttribute("hidden");
}

function countDigits(s){ if(!s) return 0; let c=0; for (const ch of s) if (ch>='0'&&ch<='9') c++; return c; }

// Cuenta sólo los dígitos de la parte decimal
function countDecDigits(s){
  if(!s) return 0;
  const i = String(s).indexOf(".");
  if (i<0) return 0;
  let c = 0;
  for (let k=i+1; k<String(s).length; k++){
    const ch = s[k];
    if (ch>='0' && ch<='9') c++;
  }
  return c;
}

// Normaliza entrada → { level, decDigits (escritos), decStr (0.xxx 16d, último 0), decVal }
function parseLevelAndDecimals(str){
  let s = String(str||"").trim();

  // Filtra caracteres (una coma, un signo inicial)
  let out = "", dot = false, minus = false;
  for (const ch of s){
    if (ch>='0' && ch<='9') out += ch;
    else if (ch==='.' && !dot){ out += ch; dot = true; }
    else if (ch==='-' && !minus && out.length===0){ out += ch; minus = true; }
  }
  if (out==="") out="0";

  // Signo y partes
  let sign = (out[0]==='-') ? -1 : 1;
  if (out[0]==='-' || out[0]==='+') out = out.slice(1);
  let [intStr, decRaw] = out.split(".");
  intStr = (intStr||"").replace(/^0+(?=\d)/,"") || "0";
  decRaw = (decRaw||"").replace(/[^0-9]/g,"");

  // Nivel (parte entera con signo)
  const level = sign * (parseInt(intStr,10)||0);

  // Decimales normalizados a 16 cifras, forzando el último dígito a 0
  let dec16 = (decRaw + "000000000000000").slice(0,16);
  dec16 = dec16.slice(0,15) + "0";
  const decStr = "0." + dec16;
  const decVal = parseFloat(decStr);

  return { level, decDigits: decRaw.length, decStr, decVal };
}

function sanitize16digits(el){
  if(!el) return "";
  let v = el.value || "";
  // Mantén solo dígitos, un punto y un signo inicial
  let out="", dot=false, minus=false;
  for (const ch of v){
    if (ch>='0' && ch<='9') out+=ch;
    else if (ch==='.' && !dot){ out+='.'; dot=true; }
    else if (ch==='-' && !minus && out.length===0){ out+='-'; minus=true; }
  }
  // Limita SOLO los decimales a 16 cifras (la parte entera no se limita)
  if (dot){
    const parts = out.split(".");
    const left  = parts[0] ?? "";
    const right = (parts[1] ?? "").replace(/[^0-9]/g,"").slice(0,16);
    out = left + "." + right;
  }
  if (out!==el.value) el.value = out;
  return out;
}

function updateCounts(){
  cntActual && (cntActual.textContent = countDigits(inputActual?.value||""));
  cntMin    && (cntMin.textContent    = countDigits(inputMin?.value||""));
  cntMax    && (cntMax.textContent    = countDigits(inputMax?.value||""));
}

function formatLikeGMS(v,dec){ return Number(v).toFixed(dec)+"0"; }
function clamp01(x){ return x<0?0:(x>1?1:x); }
function toMax16DigitsString(numStr){
  if (!numStr||numStr==="—") return null;
  numStr=String(numStr).trim();
  const m=numStr.match(/[-+]?(\d+)(?:\.(\d+))?/); if(!m) return null;
  const sign=numStr.startsWith("-")?"-":"";
  let intPart=m[1].replace(/^0+(?=\d)/,"");
  if(intPart==="") intPart="0";
  const decPart=(m[2]||"").replace(/[^0-9]/g,"");
  const intDigits=intPart==="0"?1:intPart.length;
  let decAllowed=Math.max(0, 16-intDigits);
  let dec=decPart.padEnd(decAllowed,"0").slice(0,decAllowed);
  if (decAllowed>0&&dec.length>0) dec=dec.slice(0,dec.length-1)+"0";
  return decAllowed>0?`${sign}${intPart}.${dec}`:`${sign}${intPart}`;
}

/* ===========================
   Cálculo CU (EP/NR)
   =========================== */
function recompute(){
  sanitize16digits(inputActual||{value:""});
  sanitize16digits(inputMin||{value:""});
  sanitize16digits(inputMax||{value:""});
  updateCounts();
  errorMsg && (errorMsg.textContent=""); setMessagesHTML("");

  const mode = modeNR?.checked ? "nr" : "ep";
  factorBadge && (factorBadge.textContent = "+ 0.999999999999990");
  factorBadge?.classList.remove('bad'); factorBadge?.classList.add('ok');

  /* 1) Desglose de nivel/decimales (SOLO informativo) */
  const A = parseLevelAndDecimals(inputActual?.value||"");
  const N = parseLevelAndDecimals(inputMin?.value||"");
  const X = parseLevelAndDecimals(inputMax?.value||"");

  // Requiere exactamente 16 cifras (no cuentan signo ni punto)
  const dA = countDigits(inputActual?.value||"");
  const dN = countDigits(inputMin?.value||"");
  const dX = countDigits(inputMax?.value||"");
  if (dA!==16 || dN!==16 || dX!==16){
    writeOut(cuValueEl,"—"); writeOut(cuExtEl,"—");
    if ((inputActual?.value||inputMin?.value||inputMax?.value)) {
      errorMsg && (errorMsg.innerHTML=t("errors.16digits"));
    }

    lvlActualEl&&(lvlActualEl.textContent = String(A.level));
    decActualEl&&(decActualEl.textContent = A.decStr);
    lvlMinEl&&(lvlMinEl.textContent = String(N.level));
    decMinEl&&(decMinEl.textContent = N.decStr);
    lvlMaxEl&&(lvlMaxEl.textContent = String(X.level));
    decMaxEl&&(decMaxEl.textContent = X.decStr);

    deltaObsMinEl&&(deltaObsMinEl.textContent = t("resultados.deltaObsMin", {value:"—"}));
    deltaObsMaxEl&&(deltaObsMaxEl.textContent = t("resultados.deltaObsMax", {value:"—"}));
    deltaRangeEl &&(deltaRangeEl.textContent  = t("resultados.deltaRange",  {value:"—"}));

    drawBars(); drawEllipses();
    return;
  }

  /* 2) Conversión CU (valores completos) */
  const a  = parseFloat(inputActual?.value||"");
  const mn = parseFloat(inputMin?.value||"");
  const mx = parseFloat(inputMax?.value||"");

  if (!isFinite(a)||!isFinite(mn)||!isFinite(mx)){
    errorMsg && (errorMsg.textContent=t("errors.invalid"));
    writeOut(cuValueEl,"—"); writeOut(cuExtEl,"—");
    return;
  }
  if (!(mx>mn)){
    errorMsg && (errorMsg.textContent=t("errors.maxgtmin"));
    writeOut(cuValueEl,"—"); writeOut(cuExtEl,"—");
    return;
  }

  lvlActualEl&&(lvlActualEl.textContent = String(A.level));
  decActualEl&&(decActualEl.textContent = A.decStr);
  lvlMinEl&&(lvlMinEl.textContent = String(N.level));
  decMinEl&&(decMinEl.textContent = N.decStr);
  lvlMaxEl&&(lvlMaxEl.textContent = String(X.level));
  decMaxEl&&(decMaxEl.textContent = X.decStr);

  deltaObsMinEl&&(deltaObsMinEl.textContent = t("resultados.deltaObsMin", {value: String(A.level - N.level)}));
  deltaObsMaxEl&&(deltaObsMaxEl.textContent = t("resultados.deltaObsMax", {value: String(A.level - X.level)}));
  deltaRangeEl &&(deltaRangeEl.textContent  = t("resultados.deltaRange",  {value: String(X.level - N.level)}));

  // Signo/factor según pertenencia numérica al rango
  const inside = (a>=mn && a<=mx);
  const factorSign = inside ? (+FACTOR) : (-FACTOR);

  if (factorBadge){
    factorBadge.textContent = (inside ? "+ " : "- ") + "0.999999999999990";
    factorBadge.classList.toggle('ok',  inside);
    factorBadge.classList.toggle('bad', !inside);
  }

  if (!inside){
    let html="";
    if (a<mn){
      html+=`<li class="alert warn"><span>${t("warn.swapMin")}</span><span><button id="swapMinBtn" class="btn small">${t("comunes.aplicar")}</button></span></li>`;
    } else if (a>mx){
      html+=`<li class="alert warn"><span>${t("warn.swapMax")}</span><span><button id="swapMaxBtn" class="btn small">${t("comunes.aplicar")}</button></span></li>`;
    }
    setMessagesHTML(html);
    $("#swapMinBtn")?.addEventListener("click",()=>{
      const tt=inputMin.value; inputMin.value=inputActual.value; inputActual.value=tt; recompute();
    });
    $("#swapMaxBtn")?.addEventListener("click",()=>{
      const tt=inputMax.value; inputMax.value=inputActual.value; inputActual.value=tt; recompute();
    });
  } else {
    setMessagesHTML("");
  }

  const lo = Math.min(mn, mx);
  const hi = Math.max(mn, mx);
  const ratio = (hi===lo) ? 0 : ((a - lo) / (hi - lo));

  const ratioUsed=(mode==="nr")?clamp01(ratio):ratio;
  const cu=ratioUsed*factorSign;

  writeOut(cuValueEl, formatLikeGMS(cu,14));
  writeOut(cuExtEl,   formatLikeGMS(cu,28));

  drawBars(); drawEllipses();
}

[inputActual,inputMin,inputMax].forEach(el=>{
  el?.addEventListener('input',recompute);
  el?.addEventListener('blur',recompute);
});
[modeEP,modeNR].forEach(el=>el?.addEventListener('change',recompute));
clearBtn?.addEventListener('click',()=>{
  if(!inputActual||!inputMin||!inputMax) return;
  inputActual.value=""; inputMin.value=""; inputMax.value="";
  updateCounts(); errorMsg && (errorMsg.textContent=""); setMessagesHTML("");
  factorBadge && (factorBadge.textContent="+ 0.999999999999990"); factorBadge?.classList.remove('bad');factorBadge?.classList.add('ok');
  writeOut(cuValueEl,"—"); writeOut(cuExtEl,"—");
  drawBars(); drawEllipses();
});
copyCuBtn?.addEventListener('click',()=>copy(readOut(cuValueEl)));
copyCuExtBtn?.addEventListener('click',()=>copy(readOut(cuExtEl)));

/* ===========================
   Modales genéricos
   =========================== */
const modals = {};
[
  "panelCU","panelCalc","panelSi","vizHelp","autoDeriveHelp","projectionHelp",
  "constantsDialog","ellipseDialog","selectionDialog","templatesDialog",
  "patternsDialog","invInfoDialog","themesDialog","langDialog","rtPickDialog",
  "privacyDialog","licenseDialog","coherenceDialog"
].forEach(id=>{
  const el=document.getElementById(id); if (el) modals[id]=el;
});
document.querySelectorAll("[data-open]").forEach(btn=>btn.addEventListener("click",e=>{
  const id=e.currentTarget.getAttribute("data-open"); modals[id]?.showModal();
}));
document.querySelectorAll("[data-close]").forEach(btn=>btn.addEventListener("click",e=>e.currentTarget.closest("dialog")?.close()));

/* ===========================
   Constantes conocidas (i18n)
   =========================== */
const constantsList=$("#constantsList"); let constantsTarget=null;
const KNOWN_PAGES_IDS = [
  ["pi","e","phi","sqrt2","sqrt3","gamma","zeta3","catalan","feig_delta","feig_alpha","khinchin","plastic","silver","omega","champernowne10","planck_h"],
  ["tau","inv_pi","ln2","ln10","sqrt5","sqrt6","sqrt7","inv_phi","sqrt2_over2","cos1","sin1","pi2","e2","sqrt2pi","sqrt10","golden_angle"]
];

const CONST_DATA = {
  pi:{sym:"π",value:"3.141592653589793"},
  e:{sym:"e",value:"2.718281828459045"},
  phi:{sym:"φ",value:"1.618033988749895"},
  sqrt2:{sym:"√2",value:"1.414213562373095"},
  sqrt3:{sym:"√3",value:"1.732050807568877"},
  gamma:{sym:"γ",value:"0.577215664901532"},
  zeta3:{sym:"ζ(3)",value:"1.202056903159594"},
  catalan:{sym:"G",value:"0.915965594177219"},
  feig_delta:{sym:"δ",value:"4.669201609102990"},
  feig_alpha:{sym:"α",value:"2.502907875095893"},
  khinchin:{sym:"K₀",value:"2.685452001065306"},
  plastic:{sym:"ρ",value:"1.324717957244746"},
  silver:{sym:"δ_S",value:"2.414213562373095"},
  omega:{sym:"Ω",value:"0.567143290409784"},
  champernowne10:{sym:"C₁₀",value:"0.123456789101112"},
  planck_h:{sym:"h",value:"6.626070150000000"},
  tau:{sym:"τ",value:"6.283185307179586"},
  inv_pi:{sym:"π⁻¹",value:"0.3183098861837907"},
  ln2:{sym:"ln2",value:"0.6931471805599453"},
  ln10:{sym:"ln10",value:"2.3025850929940459"},
  sqrt5:{sym:"√5",value:"2.2360679774997898"},
  sqrt6:{sym:"√6",value:"2.4494897427831779"},
  sqrt7:{sym:"√7",value:"2.6457513110645907"},
  inv_phi:{sym:"φ′",value:"0.6180339887498949"},
  sqrt2_over2:{sym:"√2/2",value:"0.7071067811865476"},
  cos1:{sym:"cos(1)",value:"0.5403023058681398"},
  sin1:{sym:"sin(1)",value:"0.8414709848078965"},
  pi2:{sym:"π²",value:"9.8696044010893580"},
  e2:{sym:"e²",value:"7.3890560989306495"},
  sqrt2pi:{sym:"√(2π)",value:"2.5066282746310002"},
  sqrt10:{sym:"√10",value:"3.1622776601683795"},
  golden_angle:{sym:"θφ",value:"2.3999632297286531"}
};

let constantsPage=0;
const constantsPrev=$("#constantsPrevPage"), constantsNext=$("#constantsNextPage"), constantsPageLabel=$("#constantsPageLabel");

function updateConstantsPagerUI(){
  if (!constantsPageLabel) return;
  constantsPageLabel.textContent = t("const.pageLabel", { page: String(constantsPage+1), total: String(KNOWN_PAGES_IDS.length) });
}

function buildConstants(page=constantsPage){
  if (!constantsList) return;
  constantsList.innerHTML="";
  const arr=KNOWN_PAGES_IDS[page]||[];
  for (const id of arr){
    const c=CONST_DATA[id]; if(!c) continue;

    const row=document.createElement("div"); row.className="const-row";

    const name=document.createElement("div"); name.className="const-name";
    const cname = t(`const.${id}.name`);
    name.textContent = `${c.sym} · ${cname}`;

    const easy=document.createElement("div");
    easy.textContent = t(`const.${id}.easy`);

    const why=document.createElement("div"); why.className="const-note";
    why.textContent = t(`const.${id}.why`);

    const act=document.createElement("div");
    const btn=document.createElement("button");
    btn.className="btn small";
    btn.textContent=c.value;

    btn.addEventListener("click",()=>{
      if (!constantsTarget) return;
      const map = {actual:inputActual, min:inputMin, max:inputMax};
      if (constantsTarget==="mathX"){
        $("#mathX").value=c.value;
        modals.constantsDialog?.close();
        constantsTarget=null;
        return;
      }
      map[constantsTarget].value=c.value;
      modals.constantsDialog?.close();
      recompute();
      constantsTarget=null;
    });

    act.appendChild(btn);
    row.append(name,easy,why,act);
    constantsList.appendChild(row);
  }
  updateConstantsPagerUI();
}

buildConstants();
constantsPrev?.addEventListener('click',()=>{ constantsPage=(constantsPage-1+KNOWN_PAGES_IDS.length)%KNOWN_PAGES_IDS.length; buildConstants(); });
constantsNext?.addEventListener('click',()=>{ constantsPage=(constantsPage+1)%KNOWN_PAGES_IDS.length; buildConstants(); });

document.querySelectorAll("[data-open-constants]").forEach(btn=>{
  btn.addEventListener("click",(e)=>{
    constantsTarget=e.currentTarget.getAttribute("data-open-constants");
    constantsPage=0; buildConstants();
    const mapTitle={actual:t("entradas.obs"),min:t("entradas.min"),max:t("entradas.max")};
    const tit=$("#constantsTitle");
    if (tit) tit.textContent=t("const.titulo")+" → "+(mapTitle[constantsTarget]||"");
    modals.constantsDialog?.showModal();
  });
});

/* ===========================
   Panel auxiliar (astros y mates) — i18n
   =========================== */
const BODIES=[
  ["sun",1.98847e30,696340e3],
  ["mercury",3.3011e23,2439.7e3],
  ["venus",4.8675e24,6051.8e3],
  ["earth",5.97237e24,6371.0e3],
  ["moon",7.342e22,1737.4e3],
  ["mars",6.4171e23,3389.5e3],
  ["phobos",1.0659e16,11.2667e3],
  ["deimos",1.4762e15,6.2e3],
  ["jupiter",1.8982e27,69911e3],
  ["io",8.931938e22,1821.6e3],
  ["europa",4.799844e22,1560.8e3],
  ["ganymede",1.4819e23,2634.1e3],
  ["callisto",1.075938e23,2410.3e3],
  ["saturn",5.6834e26,58232e3],
  ["titan",1.3452e23,2574.7e3],
  ["enceladus",1.08022e20,252.1e3],
  ["mimas",3.7493e19,198.2e3],
  ["tethys",6.17449e20,531.1e3],
  ["dione",1.095452e21,561.4e3],
  ["rhea",2.306518e21,763.8e3],
  ["iapetus",1.805635e21,734.5e3],
  ["uranus",8.6810e25,25362e3],
  ["neptune",1.02413e26,24622e3],
  ["triton",2.1390e22,1353.4e3],
  ["pluto",1.303e22,1188.3e3],
  ["charon",1.586e21,606.0e3],
  ["ceres",9.393e20,473e3],
  ["vesta",2.59076e20,262.7e3],
  ["eris",1.6466e22,1163e3],
  ["haumea",4.006e21,816e3],
  ["makemake",3.1e21,715e3],
  ["miranda",6.59e19,235.8e3]
];

const G_CONST=6.67430e-11, C_LIGHT=299792458;

const newtBody=$("#newtBody"),grBody=$("#grBody"),newtM=$("#newtM"),newtR=$("#newtR"),grM=$("#grM"),grR=$("#grR");
const newtG=$("#newtG"),grG=$("#grG"),grFactor=$("#grFactor");
const newtApply=$("#newtApply"), grApply=$("#grApply");
const mathX=$("#mathX"), mathApply=$("#mathApply");
const mathLn=$("#mathLn");

function sci16(x){
  if(!isFinite(x)||x===0) return {mantissa:"0.000000000000000",exp:0};
  const e=Math.floor(Math.log10(Math.abs(x)));
  const m=x/Math.pow(10,e);
  const s=Math.abs(m).toFixed(15);
  const mant=(m<0?"-":"")+s.replace(/(\d)$/,"0");
  return {mantissa:mant,exp:e};
}
function parseSci16(s){
  const m=s.match(/([-+]?\d+(?:\.\d+)?)/);
  const e=(s.match(/10\^(-?\d+)/)||[])[1];
  return (m?parseFloat(m[1]):NaN)*Math.pow(10, e?parseInt(e,10):0);
}

function fillBodiesSelect(sel){
  if(!sel) return;
  const prev = sel.value;
  sel.innerHTML="";
  BODIES.forEach((b,i)=>{
    const {mantissa,exp}=sci16(b[1]);
    const opt=document.createElement("option");
    opt.value=String(i);
    const name = t(`body.${b[0]}`);
    const radius = Math.round(b[2]).toLocaleString(getLang());
    opt.textContent = t("aux.bodyOption", { name, mantissa, exp: String(exp), radius });
    sel.appendChild(opt);
  });
  if (prev !== null && prev !== undefined && prev !== "") sel.value = prev;
}

function setBodyFields(idx,mEl,rEl){
  const b=BODIES[idx|0]; if(!b) return;
  const {mantissa,exp}=sci16(b[1]);
  mEl.value=`${mantissa} ×10^${exp}`;
  rEl.value=String(Math.round(b[2]));
}

fillBodiesSelect(newtBody); fillBodiesSelect(grBody);
if (newtBody && newtM && newtR){ setBodyFields(newtBody.value,newtM,newtR); newtBody.addEventListener('change',()=>setBodyFields(newtBody.value,newtM,newtR)); }
if (grBody && grM && grR){ setBodyFields(grBody.value,grM,grR); grBody.addEventListener('change',()=>setBodyFields(grBody.value,grM,grR)); }

$("#btnNewtCalc")?.addEventListener('click',()=>{
  const M=parseSci16(newtM.value), r=parseFloat(newtR.value);
  if(!isFinite(M)||!isFinite(r)||r<=0){ newtG&&(newtG.textContent="—"); return;}
  const g=G_CONST*M/(r*r);
  newtG&&(newtG.textContent=toMax16DigitsString(String(g))||"—");
});
$("#btnGRCalc")?.addEventListener('click',()=>{
  const M=parseSci16(grM.value), r=parseFloat(grR.value);
  if(!isFinite(M)||!isFinite(r)||r<=0){ grG&&(grG.textContent="—"); grFactor&&(grFactor.textContent="—"); return;}
  const rs=2*G_CONST*M/(C_LIGHT*C_LIGHT);
  if(r<=rs*1.0000001){ grG&&(grG.textContent="—"); grFactor&&(grFactor.textContent=t("aux.gr.rs")); return;}
  const base=G_CONST*M/(r*r);
  const corr=1/Math.sqrt(1-(2*G_CONST*M)/(C_LIGHT*C_LIGHT*r));
  const g=base*corr;
  grG&&(grG.textContent=toMax16DigitsString(String(g))||"—");
  grFactor&&(grFactor.textContent=Number(corr).toPrecision(10));
});

$("#btnNewtToCU")?.addEventListener('click',()=>{
  const v=toMax16DigitsString(newtG?.textContent||"");
  if(v){ ({actual:inputActual,min:inputMin,max:inputMax}[newtApply.value]).value=v; recompute(); }
});
$("#btnGRToCU")?.addEventListener('click',()=>{
  const v=toMax16DigitsString(grG?.textContent||"");
  if(v){ ({actual:inputActual,min:inputMin,max:inputMax}[grApply.value]).value=v; recompute(); }
});

$("#mathKnown")?.addEventListener('click',()=>{
  constantsTarget="mathX";
  constantsPage=0; buildConstants();
  const tit=$("#constantsTitle"); if(tit) tit.textContent=t("const.titulo")+" → x";
  modals.constantsDialog?.showModal();
});
$("#btnLn")?.addEventListener('click',()=>{
  const x=parseFloat(mathX.value);
  mathLn && (mathLn.textContent=(isFinite(x)&&x>0)?(toMax16DigitsString(String(Math.log(x)))||"—"):"—");
});
$("#btnMathToCU")?.addEventListener('click',()=>{
  const v=toMax16DigitsString(mathLn?.textContent||"");
  if(v){ ({actual:inputActual,min:inputMin,max:inputMax}[mathApply.value]).value=v; recompute(); }
});

/* ===========================
   Re-render en cambio de idioma
   =========================== */
window.addEventListener("i18n:change", () => {
  fillBodiesSelect(newtBody);
  fillBodiesSelect(grBody);
  buildConstants(constantsPage);

  // si el diálogo de constantes está abierto y hay target, refresca título
  if (constantsTarget){
    const mapTitle={actual:t("entradas.obs"),min:t("entradas.min"),max:t("entradas.max")};
    const tit=$("#constantsTitle");
    if (tit){
      if (constantsTarget==="mathX") tit.textContent=t("const.titulo")+" → x";
      else tit.textContent=t("const.titulo")+" → "+(mapTitle[constantsTarget]||"");
    }
  }

  recompute();
});