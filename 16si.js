/* ===========================
   Sᵢ — definiciones comunes
   =========================== */
const SI = [
  {i:1, tag:"S₁",  nameKey:"si.s1.name",  formulaId:"sin",       formulaText:"sin(r)"},
  {i:2, tag:"S₂",  nameKey:"si.s2.name",  formulaId:"cos",       formulaText:"cos(r)"},
  {i:3, tag:"S₃",  nameKey:"si.s3.name",  formulaId:"1 - sin",   formulaText:"1 − sin(r)"},
  {i:4, tag:"S₄",  nameKey:"si.s4.name",  formulaId:"tan",       formulaText:"tan(r)"},
  {i:5, tag:"S₅",  nameKey:"si.s5.name",  formulaId:"r^2",       formulaText:"r²"},
  {i:6, tag:"S₆",  nameKey:"si.s6.name",  formulaId:"e^r",       formulaText:"e^r"},
  {i:7, tag:"S₇",  nameKey:"si.s7.name",  formulaId:"1 / (r + 1)", formulaText:"1/(r+1)"},
  {i:8, tag:"S₈",  nameKey:"si.s8.name",  formulaId:"ln(r + 1)", formulaText:"ln(r+1)"},
  {i:9, tag:"S₉",  nameKey:"si.s9.name",  formulaId:"r^3",       formulaText:"r³"},
  {i:10,tag:"S₁₀", nameKey:"si.s10.name", formulaId:"r",         formulaText:"r"},
  {i:11,tag:"S₁₁", nameKey:"si.s11.name", formulaId:"r * sin",   formulaText:"r·sin(r)"},
  {i:12,tag:"S₁₂", nameKey:"si.s12.name", formulaId:"r * cos",   formulaText:"r·cos(r)"},
  {i:13,tag:"S₁₃", nameKey:"si.s13.name", formulaId:"r^2 * e^(-r)", formulaText:"r²·e^{-r}"},
  {i:14,tag:"S₁₄", nameKey:"si.s14.name", formulaId:"1 / (r^2 + 1)", formulaText:"1/(r²+1)"},
  {i:15,tag:"S₁₅", nameKey:"si.s15.name", formulaId:"r * ln(r + 1)", formulaText:"r·ln(r+1)"},
  {i:16,tag:"S₁₆", nameKey:"si.s16.name", formulaId:"(sin(r) * e^(-r^2)) / (1 + r^2)", formulaText:"(sin r·e^{-r²})/(1+r²)"}
];

/* ===========================
   Cadena A
   =========================== */
const sValues = new Array(16).fill(null);
// nombres personalizados por índice (null => usar i18n por defecto)
const sNames  = new Array(16).fill(null);

const siTable = $("#siTable");
const siManual=$("#siManual"), siFlow=$("#siFlow");
const autoDerive=$("#autoDerive"), autoDeriveInfo=$("#autoDeriveInfo");
const projGraph=$("#projGraph"), projInfo=$("#projInfo");
const clearSiValuesBtn=$("#clearSiValues");
const copySiCsv=$("#copySiCsv"), copySiJson=$("#copySiJson");
const templatesBtn=$("#templatesBtn");

/* ===========================
   Cadena B
   =========================== */
const sValuesB = new Array(16).fill(null);
// nombres personalizados por índice (null => usar i18n por defecto)
const sNamesB  = new Array(16).fill(null);

const siTableB = $("#siTableB");
const siManualB=$("#siManualB"), siFlowB=$("#siFlowB");
const autoDeriveB=$("#autoDeriveB"), autoDeriveInfoB=$("#autoDeriveInfoB");
const projGraphB=$("#projGraphB"), projInfoB=$("#projInfoB");
const clearSiValuesBtnB=$("#clearSiValuesB");
const copySiCsvB=$("#copySiCsvB"), copySiJsonB=$("#copySiJsonB");
const templatesBtnB=$("#templatesBtnB");

/* ===========================
   [NUEVO] Impulso desde S9 (A/B)
   - Inserta un check junto a "Modo algorítmico" (A y B)
   - Al activarlo: borra todo excepto S9 y re‑fluye desde S9 con el orden pedido
   =========================== */
function ensureImpulseCheckbox(flowEl, id){
  if(!flowEl) return null;
  const existing = document.getElementById(id);
  if (existing) return existing;

  const flowLabel = flowEl.closest("label.switch");
  const row = flowLabel?.parentElement;
  if (!row) return null;

  const lab=document.createElement("label"); lab.className="switch";
  const cb=document.createElement("input"); cb.type="checkbox"; cb.id=id;
  const sp=document.createElement("span"); sp.textContent=" Impulso desde S₉ ";
  lab.append(cb,sp);

  // Inserta justo después del label del modo algorítmico
  row.insertBefore(lab, flowLabel.nextSibling);
  return cb;
}

const siKickS9  = ensureImpulseCheckbox(siFlow,  "siKickS9");
const siKickS9B = ensureImpulseCheckbox(siFlowB, "siKickS9B");

// Al activar el check: limpia todo excepto S9, y si estás en modo algorítmico, recalcula.
siKickS9?.addEventListener("change",()=>{
  if (!siKickS9.checked) return;
  clearChainExceptS9("A");
  if (siFlow?.checked) runAlgorithmicFill();
  drawBars(); drawEllipses();
});
siKickS9B?.addEventListener("change",()=>{
  if (!siKickS9B.checked) return;
  clearChainExceptS9("B");
  if (siFlowB?.checked) runAlgorithmicFillB();
  drawBars(); drawEllipses();
});


/* ===========================
   Helpers i18n para nombres Sᵢ
   =========================== */
function siDefaultName(idx){
  const key = SI[idx]?.nameKey;
  return key ? t(key) : "";
}
function siNameFor(chain, idx){
  const arr = (chain==="B") ? sNamesB : sNames;
  const v = arr?.[idx];
  return (v && String(v).trim()) ? v : siDefaultName(idx);
}

/* ===========================
   Construcción de tablas Sᵢ (A/B)
   =========================== */
function openSiInfo(idx, chain){
  const dlg=modals.ellipseDialog; if(!dlg) return;
  $("#ellipseBody") && ($("#ellipseBody").innerHTML="");
  $("#ellipseTitle") && ($("#ellipseTitle").textContent = `${SI[idx].tag} · ${siNameFor(chain, idx)}`);
  $("#ellipseBody") && ($("#ellipseBody").innerHTML = 
    `<p><strong>${t("si.modal.formulaFamily")}:</strong> <code>${SI[idx].formulaText}</code></p>
    <p class="notes">${t("si.modal.p1")}</p>`);
  dlg.showModal();
}

function buildSiTableGeneric(tableEl, namesArr, valuesArr, opts){
  if(!tableEl) return;
  tableEl.innerHTML="";
  SI.forEach((s,idx)=>{
    const row=document.createElement("div"); row.className="si-row"; row.dataset.index=String(idx);
    const left=document.createElement("div"); left.className="si-left";

    const infoBtn=document.createElement("button");
    infoBtn.className="si-info";
    infoBtn.title = t("comunes.infoTitle");
    infoBtn.textContent=t("si.info");
    infoBtn.addEventListener("click",()=>openSiInfo(idx, opts.chain));

    const tag=document.createElement("span"); tag.className="si-tag";
    tag.textContent = `${s.tag} · ${siNameFor(opts.chain, idx)}`;
    left.append(infoBtn,tag);

    const inputName=document.createElement("input");
    inputName.placeholder = t("si.placeholder.customName");
    inputName.value = (namesArr[idx] ?? "");
    inputName.addEventListener("input",()=>{
      const v = (inputName.value || "").trim();
      namesArr[idx] = v ? inputName.value : null;
      // refleja el nombre en la etiqueta (Sᵢ · Nombre)
      tag.textContent = `${s.tag} · ${siNameFor(opts.chain, idx)}`;
    });

    const inputVal=document.createElement("input");
    inputVal.placeholder = t("si.placeholder.valueExample");
    inputVal.inputMode="decimal";
    inputVal.addEventListener("input",()=>{
      sanitize16digits(inputVal);
      const num=parseFloat(inputVal.value);
      valuesArr[idx]=Number.isFinite(num)?num:null;

      if (opts.flow?.checked) opts.runFlow();
      drawBars(); drawEllipses();
      // Si auto‑asignación está activa, recalcula sólo este índice
      if (autoRotBySi?.checked) autoAssignRotationForOne(opts.chain, idx);
      if (autoBallsBySi?.checked) autoAssignBallsForOne(opts.chain, idx);
    });

    const btnAssignCU=document.createElement("button");
    btnAssignCU.className="btn small ghost";
    btnAssignCU.textContent = t("si.assignCU");
    btnAssignCU.addEventListener("click",()=>assignFromResultGeneric(idx,inputVal,false,valuesArr,opts));

    const btnAssignCUX=document.createElement("button");
    btnAssignCUX.className="btn small ghost";
    btnAssignCUX.textContent = t("si.assignCUExt");
    btnAssignCUX.addEventListener("click",()=>assignFromResultGeneric(idx,inputVal,true,valuesArr,opts));

    row.append(left,inputName,inputVal,btnAssignCU,btnAssignCUX);
    tableEl.appendChild(row);
  });
}

function assignFromResultGeneric(idx,inputEl,useExtended,valuesArr,opts){
  const srcTxt = useExtended? readOut(cuExtEl) : readOut(cuValueEl);
  const s16 = toMax16DigitsString(srcTxt);
  if (!s16){ alert(t("resultados.titulo")+": "+t("errors.invalid")); return; }
  inputEl.value=s16; inputEl.classList.remove("computed");
  const num=parseFloat(s16); valuesArr[idx]=Number.isFinite(num)?num:null;
  // [NUEVO] Nivel de la cadena = nivel del Observado actual
  const obs = parseLevelAndDecimals(inputActual?.value||"");
  if (opts && opts.chain) setChainLevel(opts.chain, obs.level);

  if (opts.flow?.checked) opts.runFlow();
  drawBars(); drawEllipses();
  if (autoRotBySi?.checked) autoAssignRotationForOne(opts.chain, idx);
  if (autoBallsBySi?.checked) autoAssignBallsForOne(opts.chain, idx);
}

/* === Tabla A === */
function buildSiTable(){
  buildSiTableGeneric(siTable, sNames, sValues, {chain:"A", flow:siFlow, runFlow:runAlgorithmicFill});
}
/* === Tabla B === */
function buildSiTableB(){
  buildSiTableGeneric(siTableB, sNamesB, sValuesB, {chain:"B", flow:siFlowB, runFlow:runAlgorithmicFillB});
}

/* ===========================
   Info botones (FIX robusto)
   - Funciona aunque translatePage() o renders reemplacen los nodos
   - Evita que el click en "i" toggle el checkbox si está dentro de un <label>
   =========================== */
function safeShowDialog(dlg){
  if (!dlg) return;
  try{
    if (typeof dlg.showModal === "function") dlg.showModal();
    else if (typeof dlg.show === "function") dlg.show();
    else dlg.open = true;
  }catch(_){
    // Si ya estaba abierto o el navegador lanza excepción, lo intentamos de forma no-modal
    try{ dlg.open = true; }catch(__){}
  }
}

function openHelpDialog(kind){
  if (kind === "autoDerive"){
    const dlg =
      (typeof modals !== "undefined" && modals.autoDeriveHelp) ||
      document.getElementById("autoDeriveHelp") ||
      document.getElementById("autoDeriveHelpDialog");
    safeShowDialog(dlg);
    return;
  }
  if (kind === "projection"){
    const dlg =
      (typeof modals !== "undefined" && modals.projectionHelp) ||
      document.getElementById("projectionHelp") ||
      document.getElementById("projectionHelpDialog");
    safeShowDialog(dlg);
    return;
  }
}

// Por si son <button> dentro de un <form> (evita submits raros)
[autoDeriveInfo, projInfo, autoDeriveInfoB, projInfoB].forEach(btn=>{
  if (!btn) return;
  if ((btn.tagName || "").toUpperCase() === "BUTTON" && !btn.getAttribute("type")){
    btn.setAttribute("type","button");
  }
});

// Listeners directos (si el nodo existe ahora mismo)
autoDeriveInfo?.addEventListener("click",(e)=>{
  e.preventDefault(); e.stopPropagation();
  openHelpDialog("autoDerive");
});
projInfo?.addEventListener("click",(e)=>{
  e.preventDefault(); e.stopPropagation();
  openHelpDialog("projection");
});
autoDeriveInfoB?.addEventListener("click",(e)=>{
  e.preventDefault(); e.stopPropagation();
  openHelpDialog("autoDerive");
});
projInfoB?.addEventListener("click",(e)=>{
  e.preventDefault(); e.stopPropagation();
  openHelpDialog("projection");
});

// Delegación: si luego el DOM se regenera, igual seguirá funcionando
(function bindHelpInfoDelegation(){
  if (window.__siHelpInfoDelegationBound) return;
  window.__siHelpInfoDelegationBound = true;

  document.addEventListener("click", (e)=>{
    const btn = e.target?.closest?.("#autoDeriveInfo, #autoDeriveInfoB, #projInfo, #projInfoB");
    if (!btn) return;

    // Importante para que el click en la "i" no active el checkbox por estar dentro de <label>
    e.preventDefault();
    e.stopPropagation();

    const id = btn.id || "";
    if (id === "autoDeriveInfo" || id === "autoDeriveInfoB"){
      openHelpDialog("autoDerive");
    } else if (id === "projInfo" || id === "projInfoB"){
      openHelpDialog("projection");
    }
  }, false);
})();

/* Copiar/limpiar A */
copySiCsv?.addEventListener('click',()=>{ const csv=getVizValuesForBarsOf("A").map(v=>String(v??0)).join(","); copy(csv); });
copySiJson?.addEventListener('click',()=>{ const obj={}; getVizValuesForBarsOf("A").forEach((v,i)=>obj[SI[i].tag]=v??0); copy(JSON.stringify(obj)); });
clearSiValuesBtn?.addEventListener('click',()=>{
  for(let i=0;i<16;i++){
    sValues[i]=null;
    const row=siTable?.children[i];
    if(row){ const inputVal=row.querySelectorAll("input")[1]; inputVal.value=""; inputVal.classList.remove("computed"); }
  }
  selectionA.clear(); drawBars(); drawEllipses();
});

/* Copiar/limpiar B */
copySiCsvB?.addEventListener('click',()=>{ const csv=getVizValuesForBarsOf("B").map(v=>String(v??0)).join(","); copy(csv); });
copySiJsonB?.addEventListener('click',()=>{ const obj={}; getVizValuesForBarsOf("B").forEach((v,i)=>obj[SI[i].tag]=v??0); copy(JSON.stringify(obj)); });
clearSiValuesBtnB?.addEventListener('click',()=>{
  for(let i=0;i<16;i++){
    sValuesB[i]=null;
    const row=siTableB?.children[i];
    if(row){ const inputVal=row.querySelectorAll("input")[1]; inputVal.value=""; inputVal.classList.remove("computed"); }
  }
  selectionB.clear(); drawBars(); drawEllipses();
});

/* Plantillas A/B (reutilizo el mismo modal) */
const templatesList=$("#templatesList");
function buildTemplates(){
  if(!templatesList) return;
  templatesList.innerHTML="";

  const t1={
    name: t("si.templates.t1.name"),
    names: (SI.map((_,i)=>siDefaultName(i)))
  };

  const t2={
    name: t("si.templates.t2.name"),
    names:[
      t("si.templates.t2.s1"),
      t("si.templates.t2.s2"),
      t("si.templates.t2.s3"),
      t("si.templates.t2.s4"),
      t("si.templates.t2.s5"),
      t("si.templates.t2.s6"),
      t("si.templates.t2.s7"),
      t("si.templates.t2.s8"),
      t("si.templates.t2.s9"),
      t("si.templates.t2.s10"),
      t("si.templates.t2.s11"),
      t("si.templates.t2.s12"),
      t("si.templates.t2.s13"),
      t("si.templates.t2.s14"),
      t("si.templates.t2.s15"),
      t("si.templates.t2.s16")
    ]
  };

  [t1,t2].forEach(tpl=>{
    const row=document.createElement("div"); row.className="const-row";
    const name=document.createElement("div"); name.className="const-name"; name.textContent=tpl.name;
    const easy=document.createElement("div"); easy.textContent=t("si.plantillas");
    const why=document.createElement("div"); why.className="const-note"; why.textContent=t("si.templates.note");
    const act=document.createElement("div");
    const btn=document.createElement("button"); btn.className="btn small"; btn.textContent=t("comunes.aplicarNombres");
    btn.addEventListener('click',()=>{
      const chain = $("#rtChainB")?.checked ? "B" : "A";
      const arr = (chain==="B")? sNamesB : sNames;
      SI.forEach((_,i)=>{ arr[i]=tpl.names[i]; });

      const table = (chain==="B")? siTableB : siTable;
      table?.querySelectorAll(".si-row")?.forEach((r,i)=>{
        const input=r.querySelectorAll("input")[0];
        if(input) input.value=tpl.names[i];
        const tagEl = r.querySelector(".si-tag");
        if(tagEl) tagEl.textContent = `${SI[i].tag} · ${siNameFor(chain, i)}`;
      });

      fillRtSelect();
      buildRtPickList();
      updateRtPickSummary();

      modals.templatesDialog?.close();
    });
    act.appendChild(btn);
    row.append(name,easy,why,act); templatesList.appendChild(row);
  });
}

templatesBtn?.addEventListener('click',()=>modals.templatesDialog?.showModal());
templatesBtnB?.addEventListener('click',()=>modals.templatesDialog?.showModal());

/* ===========================
   Patrones (lista ÚNICA GLOBAL)
   =========================== */
const patternsList=$("#patternsList"), patternName=$("#patternName");
const btnSavePatternNow=$("#btnSavePatternNow"), btnExportCSV=$("#btnExportCSV"), btnExportJSON=$("#btnExportJSON");

const PATTERNS_KEY = "cu_patterns_all";
function loadPatterns(){ try{ return JSON.parse(localStorage.getItem(PATTERNS_KEY)||"[]"); }catch(_){ return []; } }
function savePatterns(a){ localStorage.setItem(PATTERNS_KEY, JSON.stringify(a)); }

/** Migración desde claves antiguas (A/B) → global (una sola vez) */
function migratePatternsToGlobal(){
  try{
    if (localStorage.getItem(PATTERNS_KEY)) return; // ya migrado
    const a = JSON.parse(localStorage.getItem("cu_patterns")||"[]");
    const b = JSON.parse(localStorage.getItem("cu_patterns_B")||"[]");
    const merged = [...(Array.isArray(a)?a:[]), ...(Array.isArray(b)?b:[])];
    if (merged.length>0) localStorage.setItem(PATTERNS_KEY, JSON.stringify(merged));
  }catch(_){}
}

function refreshPatternsUI(){
  const chain = $("#rtChainB")?.checked ? "B" : "A"; // SOLO para aplicar al cargar
  const pats=loadPatterns(); if(!patternsList) return;
  patternsList.innerHTML="";
  if(pats.length===0){ patternsList.innerHTML=`<p class='notes'>${t("patterns.empty")}</p>`; return; }

  pats.forEach((p,idx)=>{
    const row=document.createElement("div"); row.className="const-row";

    const name=document.createElement("div"); name.className="const-name";
    name.textContent = p.name || t("patterns.defaultName", {n: idx+1});

    const meta=document.createElement("div");
    const modeLabel =
      (p.mode==="manual") ? t("patterns.mode.manual") :
      (p.mode==="flow")   ? t("patterns.mode.flow") :
      (p.mode ?? "—");
    const nivelLabel = (typeof p.nivel==="number") ? String(p.nivel) : "—";
    const dateLabel  = new Date(p.ts).toLocaleString();
    meta.textContent = t("patterns.meta", {mode: modeLabel, nivel: nivelLabel, date: dateLabel});

    const vals=document.createElement("div"); vals.className="const-note"; vals.textContent=p.values.join(", ");
    const act=document.createElement("div");

    const b1=document.createElement("button"); b1.className="btn small"; b1.textContent=t("comunes.cargar");
    b1.addEventListener('click',()=>{
      const valuesArr = (chain==="B")? sValuesB : sValues;
      const table = (chain==="B")? siTableB : siTable;
      table?.querySelectorAll(".si-row")?.forEach((r,i)=>{
        const inputVal=r.querySelectorAll("input")[1];
        valuesArr[i]=p.values[i];
        if(inputVal){ inputVal.value=toMax16DigitsString(String(p.values[i]))||String(p.values[i]); inputVal.classList.remove("computed"); }
      });
      modals.patternsDialog?.close();
      // [NUEVO] Si el patrón trae nivel, úsalo para el estilo de esta cadena
      if (typeof p.nivel === "number") { setChainLevel(chain, p.nivel); }

      drawBars(); drawEllipses();
      if (autoRotBySi?.checked) autoAssignRotationBySi(chain);
      if (autoBallsBySi?.checked) autoAssignBallsBySi(chain);
    });

    const b2=document.createElement("button"); b2.className="btn small ghost"; b2.textContent=t("comunes.eliminar");
    b2.addEventListener('click',()=>{
      const now=loadPatterns(); now.splice(idx,1); savePatterns(now);
      refreshPatternsUI(); refreshBallsPatternOptions();
    });

    act.append(b1,b2);
    row.append(name,meta,vals,act); patternsList.appendChild(row);
  });
}

$("#openPatterns")?.addEventListener('click',()=>{ refreshPatternsUI(); modals.patternsDialog?.showModal(); });
$("#openPatternsB")?.addEventListener('click',()=>{ $("#rtChainB").checked=true; refreshPatternsUI(); modals.patternsDialog?.showModal(); });

btnSavePatternNow?.addEventListener('click',()=>{
  const chain = $("#rtChainB")?.checked ? "B" : "A";
  const vals=getVizValuesForBarsOf(chain);
  const pats=loadPatterns();
  pats.push({
    name:(patternName?.value||""),
    values: vals,
    mode: ((chain==="B"?siManualB:siManual)?.checked?"manual":"flow"),
    nivel: CHAIN_LEVEL[chain]|0,          // ← [NUEVO]
    ts: Date.now()
  });

  savePatterns(pats);
  if(patternName) patternName.value="";
  refreshPatternsUI(); refreshBallsPatternOptions();
});

btnExportCSV?.addEventListener('click',()=>{
  const pats=loadPatterns();
  const rows=pats.map(p=>[p.name??"",p.mode??"",new Date(p.ts).toISOString(),...p.values].join(","));
  copy(rows.join("\n"));
});
btnExportJSON?.addEventListener('click',()=>{ copy(JSON.stringify(loadPatterns())); });


/* ===========================
   Algoritmos e inversión
   =========================== */
const invUseRoot5 = $("#invUseRoot5");
const vizFormulaMode = $("#vizFormulaMode");

function inversionUsesPow5(){ return (invUseRoot5 ? !!invUseRoot5.checked : true); }
invUseRoot5?.addEventListener('change',()=>{ drawBars(); drawEllipses(); });
vizFormulaMode?.addEventListener('change', ()=>{ drawEllipses(); });


function roundN(x,n=16){ return Math.round(x*Math.pow(10,n))/Math.pow(10,n); }
function calcularInversionCU(valorDeseado,formulaId){
  let fx; switch(formulaId){
    case "sin": fx=r=>Math.sin(r); break;
    case "cos": fx=r=>Math.cos(r); break;
    case "tan": fx=r=>Math.tan(r); break;
    case "1 - sin": fx=r=>1-Math.sin(r); break;
    case "sqrt": fx=r=>Math.sqrt(r); break;
    case "r * sin": fx=r=>r*Math.sin(r); break;
    case "r * cos": fx=r=>r*Math.cos(r); break;
    case "ln(r + 1)": fx=r=>Math.log(r+1); break;
    case "r^2": fx=r=>Math.pow(r,2); break;
    case "e^r": fx=r=>Math.pow(Math.E,r); break;
    case "1 / (r + 1)": fx=r=>1/(r+1); break;
    case "r^3": fx=r=>Math.pow(r,3); break;
    case "r": fx=r=>r; break;
    case "1 / (r^2 + 1)": fx=r=>1/(Math.pow(r,2)+1); break;
    case "r * ln(r + 1)": fx=r=>r*Math.log(r+1); break;
    case "r^2 * e^(-r)": fx=r=>Math.pow(r,2)*Math.pow(Math.E,-r); break;
    case "(sin(r) * e^(-r^2)) / (1 + r^2)": fx=r=>(Math.sin(r)*Math.pow(Math.E,-r*r))/(1+r*r); break;
    default: return undefined;
  }
  if (inversionUsesPow5()){
    for (let r=0.001;r<=10;r+=0.001){
      const f=fx(r);
      if (!Number.isFinite(f) || Math.abs(f)<1e-4) continue;
      const prod=valorDeseado/f;
      const xRes=Math.pow(Math.abs(prod),1/5) * (prod<0?-1:1);
      if (xRes>0 && xRes<=1){
        return {r:roundN(r),x:roundN(xRes),fx:roundN(f)};
      }
    }
    return undefined;
  }else{
    let bestR=null, bestF=null, bestDiff=Infinity;
    for (let r=0.001;r<=10;r+=0.001){
      const f=fx(r); if (!Number.isFinite(f)) continue;
      const diff=Math.abs(f-valorDeseado);
      const signOK = (f===0 && valorDeseado===0) || (f*valorDeseado>=0);
      if (signOK && diff<=0.005){
        return {r:roundN(r),x:null,fx:roundN(f)};
      }
      if (diff<bestDiff){ bestDiff=diff; bestR=r; bestF=f; }
    }
    if (bestR!=null) return {r:roundN(bestR),x:null,fx:roundN(bestF)};
    return undefined;
  }
}

/* ===========================
   Algoritmo de flujo (A/B)
   =========================== */
function seeds(vals){ const arr=[]; for(let i=0;i<16;i++){ if (vals[i]!=null) arr.push(i); } return arr; }
function baseRFromSeed(val){
  if (isFinite(val) && Math.abs(val)<=1){ const a=Math.asin(val); if (Number.isFinite(a)) return a; }
  const inv=calcularInversionCU(val,"sin"); return inv?inv.r:0.1;
}

/* ===========================
   [NUEVO] Impulso desde S9 (A/B) — helpers + flujo especial
   =========================== */
function impulseFromS9Enabled(chain){
  return (chain==="B") ? !!(siKickS9B?.checked) : !!(siKickS9?.checked);
}

// Limpia todo excepto S9 (y deja S9 como "manual")
function clearChainExceptS9(chain){
  const valuesArr = (chain==="B") ? sValuesB : sValues;
  const table     = (chain==="B") ? siTableB : siTable;

  for (let i=0;i<16;i++){
    if (i===8) continue; // S9
    valuesArr[i]=null;
    const row = table?.children[i];
    const inputVal = row?.querySelectorAll("input")[1];
    if (inputVal){
      inputVal.value = "";
      inputVal.classList.remove("computed");
    }
  }
  const row9 = table?.children[8];
  const input9 = row9?.querySelectorAll("input")[1];
  if (input9) input9.classList.remove("computed");
}

// Propagación "forward" limitada a un rango
function propagateForwardRange(vals, seedIdx, startIdx, endIdx){
  const r_usado = baseRFromSeed(vals[seedIdx]);
  for (let i=startIdx;i<=endIdx;i++){
    if (vals[i]!=null) continue;
    let suma_prev=0; for (let t=0;t<i;t++) suma_prev += (vals[t]??0);
    let suma_int =0; 
    const a=Math.min(seedIdx,i-1), b=Math.max(seedIdx,i-1);
    for (let t=a;t<=b;t++) suma_int += (vals[t]??0);
    let r_si_in = r_usado + suma_prev + suma_int;
    const inv = calcularInversionCU(r_si_in, SI[i].formulaId);
    vals[i] = Math.sin(inv?inv.r:r_si_in);
  }
}
// Propagación "backward" limitada a un rango
function propagateBackwardRange(vals, seedIdx, startIdx, endIdx){
  const r_usado = baseRFromSeed(vals[seedIdx]);
  for (let i=startIdx;i>=endIdx;i--){
    if (vals[i]!=null) continue;
    let suma_prev=0; for (let t=0;t<i;t++) suma_prev += (vals[t]??0);
    let suma_int =0;
    const a=Math.min(i+1, seedIdx), b=Math.max(i+1, seedIdx);
    for (let t=a;t<=b;t++) suma_int += (vals[t]??0);
    let r_si_in = r_usado + suma_prev + suma_int;
    const inv = calcularInversionCU(r_si_in, SI[i].formulaId);
    vals[i] = Math.sin(inv?inv.r:r_si_in);
  }
}

// Flujo especial: S9 -> (S1 y S16) directo, y luego extremos -> S9
function runAlgorithmicFillKickS9(chain){
  const valuesArr = (chain==="B") ? sValuesB : sValues;
  const table     = (chain==="B") ? siTableB : siTable;

  const seed = valuesArr[8]; // S9
  if (seed==null){
    // si está activado el impulso pero no hay S9, dejamos la cadena limpia salvo S9 vacío
    clearChainExceptS9(chain);
    drawBars(); drawEllipses();
    return;
  }

  // Computamos desde cero usando solo S9 como semilla (intermedias = 0 en el salto)
  const vals = new Array(16).fill(null);
  vals[8] = seed;

  // 1) S9 -> S16 (salto directo)
  {
    let sum=0; for(let i=0;i<15;i++) sum += (vals[i]??0);
    const r_avg = sum/15;
    vals[15] = (Math.sin(r_avg)*Math.pow(Math.E,-r_avg*r_avg))/(1+r_avg*r_avg);
  }

  // 2) S16 -> S1 (salto directo)
  {
    let sum=0; for(let i=1;i<15;i++) sum += (vals[i]??0);
    const densidad = sum/14;
    vals[0] = Math.sin((vals[15]??0)*Math.PI)*densidad;
  }

  // 3) Desde S1 volvemos a S9 pasando por S2..S8
  propagateForwardRange(vals, 0, 1, 7);

  // 4) Desde S16 volvemos a S9 pasando por S15..S10
  propagateBackwardRange(vals, 15, 14, 9);

  // Escribimos TODO menos S9 (S9 se queda como semilla/manual)
  for (let idx=0; idx<16; idx++){
    const row = table?.children[idx];
    const inputVal = row?.querySelectorAll("input")[1];
    if (!inputVal) continue;

    if (idx===8){
      valuesArr[8] = seed;
      inputVal.classList.remove("computed");
      continue;
    }

    const v = vals[idx];
    valuesArr[idx] = v;
    inputVal.value = toMax16DigitsString(String(v)) || String(v);
    inputVal.classList.add("computed");
  }

  drawBars(); drawEllipses();
  if (autoRotBySi?.checked) autoAssignRotationBySi(chain);
  if (autoBallsBySi?.checked) autoAssignBallsBySi(chain);
}

function runAlgorithmicFill(){
  if (!siFlow?.checked) return;

  // [NUEVO] Impulso desde S9 (Cadena A)
  if (impulseFromS9Enabled("A")){
    runAlgorithmicFillKickS9("A");
    return;
  }

  const vals = sValues.slice();
  const seedIdx = seeds(vals); if (seedIdx.length===0) return;
  function propagateFrom(k){
    const r_usado = baseRFromSeed(vals[k]);
    for (let i=k+1;i<15;i++){
      if (vals[i]!=null) continue;
      let suma_prev=0; for (let t=0;t<i;t++) suma_prev += (vals[t]??0);
      let suma_int =0; const a=Math.min(k,i-1), b=Math.max(k,i-1); for (let t=a;t<=b;t++) suma_int += (vals[t]??0);
      let r_si_in = r_usado + suma_prev + suma_int;
      const inv = calcularInversionCU(r_si_in, SI[i].formulaId);
      vals[i] = Math.sin(inv?inv.r:r_si_in);
    }
    for (let i=k-1;i>=1;i--){
      if (vals[i]!=null) continue;
      let suma_prev=0; for (let t=0;t<i;t++) suma_prev += (vals[t]??0);
      let suma_int =0; const a=Math.min(i+1,k), b=Math.max(i+1,k); for (let t=a;t<=b;t++) suma_int += (vals[t]??0);
      let r_si_in = r_usado + suma_prev + suma_int;
      const inv = calcularInversionCU(r_si_in, SI[i].formulaId);
      vals[i] = Math.sin(inv?inv.r:r_si_in);
    }
  }
  seeds(vals).forEach(k=>propagateFrom(k));
  if (vals[15]==null){
    let sum=0; for(let i=0;i<15;i++) sum+=(vals[i]??0);
    const r_avg = sum/15;
    vals[15] = (Math.sin(r_avg)*Math.pow(Math.E,-r_avg*r_avg))/(1+r_avg*r_avg);
  }
  if (vals[0]==null){
    let sum=0; for(let i=1;i<15;i++) sum+=(vals[i]??0);
    const densidad=sum/14;
    vals[0] = Math.sin((vals[15]??0)*Math.PI)*densidad;
  }
  SI.forEach((s,idx)=>{
    const row=siTable?.children[idx];
    const inputVal=row?.querySelectorAll("input")[1];
    if (!row||!inputVal) return;
    if (sValues[idx]==null){
      const txt = toMax16DigitsString(String(vals[idx])) || String(vals[idx]);
      inputVal.value = txt;
      inputVal.classList.add("computed");
      sValues[idx] = vals[idx];
    }
  });
  drawBars(); drawEllipses();
  if (autoRotBySi?.checked) autoAssignRotationBySi("A");
  if (autoBallsBySi?.checked) autoAssignBallsBySi("A");
}

function runAlgorithmicFillB(){
  if (!siFlowB?.checked) return;

  // [NUEVO] Impulso desde S9 (Cadena B)
  if (impulseFromS9Enabled("B")){
    runAlgorithmicFillKickS9("B");
    return;
  }

  const vals = sValuesB.slice();
  const seedIdx = seeds(vals); if (seedIdx.length===0) return;
  function propagateFrom(k){
    const r_usado = baseRFromSeed(vals[k]);
    for (let i=k+1;i<15;i++){
      if (vals[i]!=null) continue;
      let suma_prev=0; for (let t=0;t<i;t++) suma_prev += (vals[t]??0);
      let suma_int =0; const a=Math.min(k,i-1), b=Math.max(k,i-1); for (let t=a;t<=b;t++) suma_int += (vals[t]??0);
      let r_si_in = r_usado + suma_prev + suma_int;
      const inv = calcularInversionCU(r_si_in, SI[i].formulaId);
      vals[i] = Math.sin(inv?inv.r:r_si_in);
    }
    for (let i=k-1;i>=1;i--){
      if (vals[i]!=null) continue;
      let suma_prev=0; for (let t=0;t<i;t++) suma_prev += (vals[t]??0);
      let suma_int =0; const a=Math.min(i+1,k), b=Math.max(i+1,k); for (let t=a;t<=b;t++) suma_int += (vals[t]??0);
      let r_si_in = r_usado + suma_prev + suma_int;
      const inv = calcularInversionCU(r_si_in, SI[i].formulaId);
      vals[i] = Math.sin(inv?inv.r:r_si_in);
    }
  }
  seeds(vals).forEach(k=>propagateFrom(k));
  if (vals[15]==null){
    let sum=0; for(let i=0;i<15;i++) sum+=(vals[i]??0);
    const r_avg = sum/15;
    vals[15] = (Math.sin(r_avg)*Math.pow(Math.E,-r_avg*r_avg))/(1+r_avg*r_avg);
  }
  if (vals[0]==null){
    let sum=0; for(let i=1;i<15;i++) sum+=(vals[i]??0);
    const densidad=sum/14;
    vals[0] = Math.sin((vals[15]??0)*Math.PI)*densidad;
  }
  SI.forEach((s,idx)=>{
    const row=siTableB?.children[idx];
    const inputVal=row?.querySelectorAll("input")[1];
    if (!row||!inputVal) return;
    if (sValuesB[idx]==null){
      const txt = toMax16DigitsString(String(vals[idx])) || String(vals[idx]);
      inputVal.value = txt;
      inputVal.classList.add("computed");
      sValuesB[idx] = vals[idx];
    }
  });
  drawBars(); drawEllipses();
  if (autoRotBySi?.checked) autoAssignRotationBySi("B");
  if (autoBallsBySi?.checked) autoAssignBallsBySi("B");
}

/* ===========================
   Valores para BARRAS (A/B)
   =========================== */
function getVizValuesForBars(){ return getVizValuesForBarsOf("A"); }
function getVizValuesForBarsOf(chain){
  const aut = chain==="B" ? autoDeriveB : autoDerive;
  const valsRaw = (chain==="B"? sValuesB : sValues).map(v=>(v==null?0:v));
  if ((aut?.checked)){
    let sum=0; for(let i=0;i<15;i++) sum+=valsRaw[i]||0;
    const r_avg=sum/15;
    valsRaw[15]=(Math.sin(r_avg)*Math.pow(Math.E,-r_avg*r_avg))/(1+r_avg*r_avg);
    const densidad=r_avg;
    valsRaw[0]=Math.sin(valsRaw[15]*Math.PI)*densidad;
  }
  return valsRaw;
}
siManual?.addEventListener('change',()=>{ if(siManual.checked){ projGraph && (projGraph.checked=false); } drawBars();drawEllipses(); });
siFlow?.addEventListener('change',()=>{ if(siFlow.checked){ projGraph && (projGraph.checked=true); runAlgorithmicFill(); } drawBars();drawEllipses(); });
projGraph?.addEventListener('change',()=>{ drawBars();drawEllipses(); });
autoDerive?.addEventListener('change',()=>{ drawBars();drawEllipses(); });

siManualB?.addEventListener('change',()=>{ if(siManualB.checked){ projGraphB && (projGraphB.checked=false); } drawBars();drawEllipses(); });
siFlowB?.addEventListener('change',()=>{ if(siFlowB.checked){ projGraphB && (projGraphB.checked=true); runAlgorithmicFillB(); } drawBars();drawEllipses(); });
projGraphB?.addEventListener('change',()=>{ drawBars();drawEllipses(); });
autoDeriveB?.addEventListener('change',()=>{ drawBars();drawEllipses(); });

/* ===========================
   Visualizadores
   =========================== */
const vizDrawA=$("#vizDrawA"), vizDrawB=$("#vizDrawB");
vizDrawA?.addEventListener('change',()=>{ drawBars(); drawEllipses(); toggleEllCanvases(); });
vizDrawB?.addEventListener('change',()=>{ drawBars(); drawEllipses(); toggleEllCanvases(); });

const btnVizBars=$("#btnVizBars"), btnVizEllipses=$("#btnVizEllipses");
// --- Vista 2D/3D ---
const btnView2D = $("#btnView2D"), btnView3D = $("#btnView3D");
let viewMode = "3D";
let saved3DView = null;

// Escalado para encuadrar la cadena (A/B) en 2D
function computeFitScaleForChain(chain, canvas){
  if(!canvas) return 1;
  const rc = canvas.getBoundingClientRect();
  const W = rc.width, H = rc.height;
  const margin = 40;
  const avail = Math.max(60, Math.min(W,H) - margin);

  const vals = chain==="B" ? sValuesB : sValues;
  const filterEnabled = !!(rtOnly?.checked);
  const allowed = filterEnabled ? rtSelectedSet : null;
  const useForm = !!vizFormulaMode?.checked;

  let maxR = 1;
  for (let i=0;i<16;i++){
    if (filterEnabled && !allowed.has(i)) continue;
    let sVal = useForm ? getFormulaAnchorFor(i) : vals[i];
    if (!useForm && sVal==null) continue;
    if (ellipsesSignMode==='pos' && !(sVal>0)) continue;
    if (ellipsesSignMode==='neg' && !(sVal<0)) continue;

    const inv = calcularInversionCU(sVal, SI[i].formulaId); if(!inv) continue;

    const rVal=inv.r;
    const base = rVal*(i+1)*8;

    const deform=1+rVal*0.4;
    const rx=base*deform, ry=base;
    const r=Math.max(rx,ry);
    if (r>maxR) maxR=r;
  }
  if (!isFinite(maxR) || maxR<=0) return 1;
  return clamp((avail/(2*maxR))*0.98, 0.1, 30);
}

function enter2D(){
  if (viewMode==="2D") return;
  saved3DView = {
    ellScaleA, ellPanXA, ellPanYA, ellRotXA, ellRotYA,
    ellScaleB, ellPanXB, ellPanYB, ellRotXB, ellRotYB
  };
  viewMode = "2D";
  // Frontal y centrado; el encuadre (scale) se recalcula en cada draw
  ellPanXA=0; ellPanYA=0; ellRotXA=0; ellRotYA=0;
  ellPanXB=0; ellPanYB=0; ellRotXB=0; ellRotYB=0;

  btnView2D?.classList.remove("ghost");
  btnView3D?.classList.add("ghost");
  drawEllipses();
}

function enter3D(){
  viewMode = "3D";
  if (saved3DView){
    ({ellScaleA, ellPanXA, ellPanYA, ellRotXA, ellRotYA,
      ellScaleB, ellPanXB, ellPanYB, ellRotXB, ellRotYB} = saved3DView);
  }
  btnView3D?.classList.remove("ghost");
  btnView2D?.classList.add("ghost");
  drawEllipses();
}

btnView2D?.addEventListener("click", enter2D);
btnView3D?.addEventListener("click", enter3D);

const btnVizHelp=$("#btnVizHelp"); btnVizHelp?.addEventListener('click',()=>modals.vizHelp?.showModal());

const cvsBars=$("#vizBars");
const cvsEllA=$("#vizEllipses");
const cvsEllB=$("#vizEllipsesB");
const ctxBars=cvsBars?.getContext("2d");
const ctxEllA=cvsEllA?.getContext("2d");
const ctxEllB=cvsEllB?.getContext("2d");

function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
function resizeVizHeights(){
  const wrap=document.querySelector(".viz-center");
  if(!wrap) return;
  const w = wrap.getBoundingClientRect().width || 800;
  if (cvsBars){ const h = clamp(Math.round(w*0.26), 200, 300); cvsBars.style.height = h+"px"; }
  if (cvsEllA){ const h = clamp(Math.round(w*0.40), 320, 520); cvsEllA.style.height = h+"px"; }
  if (cvsEllB){ const h = clamp(Math.round(w*0.40), 320, 520); cvsEllB.style.height = h+"px"; }
}
resizeVizHeights();

function setupHiDPI(canvas, ctx){
  if(!canvas||!ctx) return;
  const dpr = Math.max(1, window.devicePixelRatio||1);
  const rc = canvas.getBoundingClientRect();
  canvas.width = Math.round(rc.width * dpr);
  canvas.height = Math.round(rc.height * dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
window.addEventListener('resize',()=>{ resizeVizHeights(); setupHiDPI(cvsBars,ctxBars); setupHiDPI(cvsEllA,ctxEllA); setupHiDPI(cvsEllB,ctxEllB); drawBars(); drawEllipses(); });

btnVizBars?.addEventListener('click',()=>{ showViz("bars"); });
btnVizEllipses?.addEventListener('click',()=>{ showViz("ell"); });

function showViz(which){
  const ellWrap = document.querySelector(".viz-ellipses-grid");
  if (cvsBars) cvsBars.hidden = which!=="bars";
  if (ellWrap) ellWrap.hidden = which!=="ell";
  btnVizBars?.classList.toggle('ghost', which!=="bars");
  btnVizEllipses?.classList.toggle('ghost', which!=="ell");
  setupHiDPI(cvsBars,ctxBars); setupHiDPI(cvsEllA,ctxEllA); setupHiDPI(cvsEllB,ctxEllB);
  toggleEllCanvases();
  drawBars(); drawEllipses();
}
function toggleEllCanvases(){
  if(!cvsEllA || !cvsEllB) return;
  const showA = !!vizDrawA?.checked;
  const showB = !!vizDrawB?.checked;
  cvsEllA.hidden = !showA;
  cvsEllB.hidden = !showB;
  const ellWrap = document.querySelector(".viz-ellipses-grid");
  if (ellWrap){
    ellWrap.style.gridTemplateColumns = (showA && showB) ? "1fr 1fr" : "1fr";
  }
}

/* Barras: dibuja A y/o B */
/* Barras: dibuja A y/o B */
function drawBars(){
  if(!cvsBars||!ctxBars) return;

  setupHiDPI(cvsBars,ctxBars);
  const rc=cvsBars.getBoundingClientRect(), W=rc.width, H=rc.height, ctx=ctxBars;
  ctx.clearRect(0,0,W,H);

  const s=getComputedStyle(document.documentElement);
  const c1=s.getPropertyValue('--viz1').trim()||"#0b1020";
  const c2=s.getPropertyValue('--viz2').trim()||"#0a132d";
  const textCol=s.getPropertyValue('--text').trim()||"#111111";
  const lineCol=s.getPropertyValue('--line').trim()||"#24304f";

  const grad=ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,c1); grad.addColorStop(1,c2);
  ctx.fillStyle=grad; ctx.fillRect(0,0,W,H);

  const axisY=Math.round(H/2), N=16;
  const drawA=!!vizDrawA?.checked, drawB=!!vizDrawB?.checked;

  // ✅ Layout "por slots": nunca se recorta en móvil
  const margin = 10;
  const innerW = Math.max(10, W - margin*2);
  const slot = innerW / N;

  let bw = 10, barGap = 0;
  if (drawA && drawB){
    barGap = clamp(Math.round(slot*0.15), 2, 6);
    bw = clamp(Math.round((slot - barGap) / 2), 3, 14);
  }else{
    bw = clamp(Math.round(slot*0.65), 4, 24);
  }

  const escala = Math.min(120, Math.max(12, (H/2 - 30)));

  ctx.strokeStyle=lineCol;
  ctx.beginPath();
  ctx.moveTo(margin,axisY+0.5);
  ctx.lineTo(W-margin,axisY+0.5);
  ctx.stroke();

  const fontSize = clamp(Math.round(slot*0.60), 8, 12);
  ctx.font=`${fontSize}px ui-monospace,monospace`;
  ctx.textAlign="center";
  ctx.textBaseline="top";

  const valsA = drawA? getVizValuesForBarsOf("A") : null;
  const valsB = drawB? getVizValuesForBarsOf("B") : null;

  for(let i=0;i<N;i++){
    const centerX = margin + (i + 0.5) * slot;

    if (drawA){
      const v=valsA[i]||0;
      const h=Math.max(-axisY+30, Math.min(axisY-30, v*escala));
      const x = (drawA && drawB)
        ? (centerX - (bw*2 + barGap)/2)
        : (centerX - bw/2);
      const y = v>=0 ? axisY-h : axisY;
      ctx.fillStyle=v>=0?"#22c55e":"#ef4444";
      ctx.fillRect(Math.round(x), Math.round(y), bw, Math.abs(h));
    }

    if (drawB){
      const v=valsB[i]||0;
      const h=Math.max(-axisY+30, Math.min(axisY-30, v*escala));
      const x0 = (drawA && drawB)
        ? (centerX - (bw*2 + barGap)/2)
        : (centerX - bw/2);
      const x = (drawA && drawB) ? (x0 + bw + barGap) : x0;
      const y = v>=0 ? axisY-h : axisY;
      ctx.fillStyle=v>=0?"#2dd4bf":"#f97316";
      ctx.fillRect(Math.round(x), Math.round(y), bw, Math.abs(h));
    }

    ctx.fillStyle=textCol;
    ctx.fillText(SI[i].tag, centerX, axisY + 6 + fontSize);
  }
}
// Valor "ancla" cuando está activo el modo Fórmulas (ignora Sᵢ reales).
// Usamos una magnitud estándar que funciona bien con todas las familias;
// para funciones más "nerviosas" (tan, r^3) bajamos un poco la ancla.
function getFormulaAnchorFor(i){
  const sign = (ellipsesSignMode==='neg') ? -1 : 1;  // respeta el filtro ± del visor
  const fid = SI[i].formulaId;
  const mag = (fid === "tan" || fid === "r^3") ? 0.60 : 0.75; // 0.75 por defecto
  return sign * mag;
}

/* ====== Elipses (A y B, con animación local y bolitas) ====== */
// Estados A
let ellScaleA=1, ellPanXA=0, ellPanYA=0;
let ellipsesCacheA=[]; let selectionA=new Set();
let isPanningA=false, panStartA=[0,0], movedDuringPanA=false, suppressNextClickA=false;
const DEFAULT_ROT_X = -0.5; const DEFAULT_ROT_Y =  0.3;
let ellRotXA = DEFAULT_ROT_X; let ellRotYA = DEFAULT_ROT_Y;
const ELL_PERSPECTIVE = 900;

// Estados B
let ellScaleB=1, ellPanXB=0, ellPanYB=0;
let ellipsesCacheB=[]; let selectionB=new Set();
let isPanningB=false, panStartB=[0,0], movedDuringPanB=false, suppressNextClickB=false;
let ellRotXB = DEFAULT_ROT_X; let ellRotYB = DEFAULT_ROT_Y;

// Selección múltiple + filtros
const rtSelect=$("#rtSelect"), rtValue=$("#rtValue"), rtSlider=$("#rtSlider"), rtApply=$("#rtApply"), rtRevert=$("#rtRevert"), rtOnly=$("#rtOnly");
const rtPickBtn=$("#rtPickBtn"), rtPickSummary=$("#rtPickSummary");
const rtPickWrap=$("#rtPickWrap"), rtPickAll=$("#rtPickAll"), rtPickNone=$("#rtPickNone"), rtPickApply=$("#rtPickApply");
const ellFilterAll=$("#ellFilterAll"), ellFilterPos=$("#ellFilterPos"), ellFilterNeg=$("#ellFilterNeg");
// Ocultar por visor (independiente)
const ellHideA = $("#ellHideA");
const ellHideB = $("#ellHideB");
const ellHideLabels = $("#ellHideLabels");
const ellHideActive = null;
// Filtros del visor para las mini‑elipses de las bolitas (patrones)
const patFilterAll = $("#patFilterAll"), patFilterPos = $("#patFilterPos"), patFilterNeg = $("#patFilterNeg");
const patHideLabels = $("#patHideLabels");
const patHideA2 = $("#patHideA2");
const patHideB2 = $("#patHideB2");
let patSignMode = 'all';

// OJO: ya no usamos ellHideActive; ahora hay ellHideA/ellHideB

// Conjunto de Sᵢ permitidas (rtOnly)
let rtSelectedSet = new Set(Array.from({length:16}, (_,i)=>i));
let ellipsesSignMode = 'all';

// Animación — rotación y bolitas A/B
const rotSpeed=$("#rotSpeed"), rotSpeedNum=$("#rotSpeedNum");
const rotDirCW=$("#rotDirCW"), rotDirCCW=$("#rotDirCCW");
const rotPitch=$("#rotPitch"), rotPitchNum=$("#rotPitchNum");
const rotYaw=$("#rotYaw"), rotYawNum=$("#rotYawNum");
const rotApplyOne=$("#rotApplyOne"), rotApplyAll=$("#rotApplyAll");
const animPause=$("#animPause"), animResume=$("#animResume");
const animSlower=$("#animSlower"), animFaster=$("#animFaster"), speedFactorEl=$("#speedFactor");

const ballsCount=$("#ballsCount");
const ballsSpeed=$("#ballsSpeed"), ballsSpeedNum=$("#ballsSpeedNum");
const ballsDirCW=$("#ballsDirCW"), ballsDirCCW=$("#ballsDirCCW");
const ballsApplyOne=$("#ballsApplyOne"), ballsApplyAll=$("#ballsApplyAll");
// NUEVOS controles por bolita (patrón)
const ballIndexSelect = $("#ballIndexSelect");
const ballApplyAll    = $("#ballApplyAll");

const patSpeed   = $("#patSpeed"),   patSpeedNum   = $("#patSpeedNum");
const patDirCW   = $("#patDirCW"),   patDirCCW     = $("#patDirCCW");
const patPitch   = $("#patPitch"),   patPitchNum   = $("#patPitchNum");
const patYaw     = $("#patYaw"),     patYawNum     = $("#patYawNum");
const patApplyOne = $("#patApplyOne"), patApplyAllBalls = $("#patApplyAllBalls");

// Factor global manual (acelerar/ralentizar)
const speedFactorNum = $("#speedFactorNum"), speedFactorApply = $("#speedFactorApply");

// Auto‑asignación por Sᵢ (checks)
const autoRotBySi=$("#autoRotBySi");
const autoBallsBySi=$("#autoBallsBySi");
const autoPatternMotion = $("#autoPatternMotion");


// Patrones para bolitas por Sᵢ
const ballsPatternSelect=$("#ballsPatternSelect");
const ballsPatternApplyOne=$("#ballsPatternApplyOne");
const ballsPatternClearOne=$("#ballsPatternClearOne");

const DEG = Math.PI/180;
const TWO_PI = Math.PI*2;
// Datos por Sᵢ
const ROT = Array.from({length:16},()=>({pitch:0, yaw:0, speed:0, dir:1, spin:0}));
const ROT_B = Array.from({length:16},()=>({pitch:0, yaw:0, speed:0, dir:1, spin:0}));
const BALLS = Array.from({length:16},()=>({count:0, speedDeg:90, dir:1, phases:[]}));
const BALLS_B = Array.from({length:16},()=>({count:0, speedDeg:90, dir:1, phases:[]}));

// Patrones asignados (mini‑cadenas sin bolitas internas)
const BALLS_PATTERN = Array.from({length:16},()=>null);
const BALLS_PATTERN_B = Array.from({length:16},()=>null);
// Spin independiente para cada mini‑elipse del patrón (A/B)
const PAT_SPIN = Array.from({length:16},()=> new Float32Array(16).fill(0));
const PAT_SPIN_B = Array.from({length:16},()=> new Float32Array(16).fill(0));
// Config por bolita (A/B): pattern + orientación/velocidad de las mini‑elipses
const BALL_CFG       = Array.from({length:16},()=>[]); // A
const BALL_CFG_B     = Array.from({length:16},()=>[]); // B
// Spin por bolita (cada una con 16 mini‑elipses)
const PAT_SPIN_PER_BALL   = Array.from({length:16},()=>[]);
const PAT_SPIN_PER_BALL_B = Array.from({length:16},()=>[]);


let animPaused=false;
let lastAnimTime=performance.now();
let globalSpeedFactor=1.00;
function updateSpeedFactorLabel(){ if(speedFactorEl) speedFactorEl.textContent=`×${globalSpeedFactor.toFixed(2)}`; }

/* === RT: selector de cadena === */
const rtChainA=$("#rtChainA"), rtChainB=$("#rtChainB");
function currentChain(){ return rtChainB?.checked ? "B" : "A"; }

/* Helper: sincronizar slider <-> num */
function syncPair(slider, num){
  slider?.addEventListener('input',()=>{ if(num) num.value=slider.value; });
  num?.addEventListener('input',()=>{ if(slider) slider.value=num.value; });
}
syncPair(rotSpeed,rotSpeedNum);
syncPair(rotPitch,rotPitchNum);
syncPair(rotYaw,rotYawNum);
syncPair(ballsSpeed,ballsSpeedNum);
syncPair(patSpeed, patSpeedNum);
syncPair(patPitch, patPitchNum);
syncPair(patYaw,   patYawNum);

/* === RT: lista de Sᵢ / selección === */
function updateRtPickSummary(){
  if(!rtPickSummary){ return; }
  if(!rtOnly?.checked){ rtPickSummary.textContent="—"; return; }
  const n = rtSelectedSet.size;
  if (n===16){ rtPickSummary.textContent = t("rt.todos"); return; }
  if (n===0){ rtPickSummary.textContent = t("rt.ninguno"); return; }
  const tags = [...rtSelectedSet].sort((a,b)=>a-b).map(i=>SI[i].tag);
  const preview = tags.slice(0,6).join(", ");
  const extra = tags.length>6? ` … (+${tags.length-6})`:"";
  rtPickSummary.textContent = `${preview}${extra}`;
}
function buildRtPickList(){
  if (!rtPickWrap) return;
  rtPickWrap.innerHTML="";
  const chain = currentChain();
  SI.forEach((s,i)=>{
    const lab=document.createElement("label"); lab.className="switch";
    const cb=document.createElement("input"); cb.type="checkbox"; cb.value=String(i); cb.checked=rtSelectedSet.has(i);
    cb.addEventListener('change',()=>{ if(cb.checked) rtSelectedSet.add(i); else rtSelectedSet.delete(i); });
    const sp=document.createElement("span"); sp.textContent=`${s.tag} · ${siNameFor(chain, i)}`;
    lab.append(cb,sp); rtPickWrap.appendChild(lab);
  });
}
rtPickBtn?.addEventListener('click',()=>{ buildRtPickList(); modals.rtPickDialog?.showModal(); });
rtPickAll?.addEventListener('click',()=>{ rtSelectedSet = new Set(Array.from({length:16},(_,i)=>i)); buildRtPickList(); });
rtPickNone?.addEventListener('click',()=>{ rtSelectedSet.clear(); buildRtPickList(); });
rtPickApply?.addEventListener('click',()=>{ modals.rtPickDialog?.close(); updateRtPickSummary(); drawEllipses(); });
rtOnly?.addEventListener('change',()=>{ updateRtPickSummary(); drawEllipses(); });
rtChainA?.addEventListener('change',()=>{ fillRtSelect(); readSiIntoRt(); refreshBallsPatternOptions(); drawEllipses(); });
rtChainB?.addEventListener('change',()=>{ fillRtSelect(); readSiIntoRt(); refreshBallsPatternOptions(); drawEllipses(); });

[ellFilterAll,ellFilterPos,ellFilterNeg].forEach(el=>{
  el?.addEventListener('change',()=>{
    if (ellFilterAll?.checked) ellipsesSignMode='all';
    else if (ellFilterPos?.checked) ellipsesSignMode='pos';
    else if (ellFilterNeg?.checked) ellipsesSignMode='neg';
    drawEllipses();
  });
});
ellHideLabels?.addEventListener('change',()=>drawEllipses());
ellHideA?.addEventListener('change',()=>drawEllipses());
ellHideB?.addEventListener('change',()=>drawEllipses());
[patFilterAll, patFilterPos, patFilterNeg].forEach(el=>{
  el?.addEventListener('change', ()=>{
    if (patFilterAll?.checked) patSignMode='all';
    else if (patFilterPos?.checked) patSignMode='pos';
    else if (patFilterNeg?.checked) patSignMode='neg';
    drawEllipses();
  });
});

patHideLabels?.addEventListener('change', ()=>drawEllipses());
patHideA2?.addEventListener('change', ()=>drawEllipses());
patHideB2?.addEventListener('change', ()=>drawEllipses());

/* === Aplicar/leer rotación por Sᵢ según cadena === */
function loadRotationUI(idx){
  const R = currentChain()==="B" ? ROT_B[idx] : ROT[idx];
  const spdDeg = Math.abs(R.speed/DEG);
  if(rotSpeed) rotSpeed.value=String(Math.max(0,Math.min(360, spdDeg)));
  if(rotSpeedNum) rotSpeedNum.value=String(Math.round(Math.max(0,Math.min(360, spdDeg))));
  if(rotDirCW && rotDirCCW){ if(R.dir>=0){ rotDirCW.checked=true; rotDirCCW.checked=false; } else { rotDirCW.checked=false; rotDirCCW.checked=true; } }
  if(rotPitch) { rotPitch.value=String(Math.round(R.pitch/DEG)); rotPitchNum.value=String(Math.round(R.pitch/DEG)); }
  if(rotYaw)   { rotYaw.value=String(Math.round(R.yaw/DEG));   rotYawNum.value=String(Math.round(R.yaw/DEG)); }
}
function applyRotationTo(idx){
  const arr = currentChain()==="B" ? ROT_B : ROT;
  const speedAbs = Math.max(0, Math.min(360, parseFloat(rotSpeedNum?.value||"0")));
  const dir = (rotDirCCW?.checked? -1 : 1);
  const pitch = (parseFloat(rotPitchNum?.value||"0")||0)*DEG;
  const yaw   = (parseFloat(rotYawNum?.value||"0")||0)*DEG;
  arr[idx].speed = speedAbs*DEG;
  arr[idx].dir   = dir;
  arr[idx].pitch = pitch;
  arr[idx].yaw   = yaw;
}
function applyRotationAll(){ for(let i=0;i<16;i++) applyRotationTo(i); }

/* === Aplicar/leer bolitas por Sᵢ según cadena === */
function loadBallsUI(idx){
  const b = currentChain()==="B" ? BALLS_B[idx] : BALLS[idx];
  if(ballsCount) ballsCount.value=String(b.count);
  if(ballsSpeed) ballsSpeed.value=String(Math.round(b.speedDeg));
  if(ballsSpeedNum) ballsSpeedNum.value=String(Math.round(b.speedDeg));
  if(ballsDirCW && ballsDirCCW){ if(b.dir>=0){ ballsDirCW.checked=true; ballsDirCCW.checked=false; } else { ballsDirCW.checked=false; ballsDirCCW.checked=true; } }
  updateBallIndexOptions();
}
function rebuildPhases(i, arr){
  const b=arr[i];
  b.phases = Array.from({length:Math.max(0,b.count)}, (_,k)=> (TWO_PI*k/Math.max(1,b.count)));
}
function ensureBallCfgLength(chain, si){
  const cfgArr = chain==="B" ? BALL_CFG_B : BALL_CFG;
  const spinArr= chain==="B" ? PAT_SPIN_PER_BALL_B : PAT_SPIN_PER_BALL;
  const cnt = chain==="B" ? (BALLS_B[si].count|0) : (BALLS[si].count|0);
  while ((cfgArr[si].length|0) < cnt) cfgArr[si].push({pattern:null, speedDeg:90, dir:1, pitch:0, yaw:0});
  cfgArr[si].length = cnt;
  while ((spinArr[si].length|0) < cnt) spinArr[si].push(new Float32Array(16));
  spinArr[si].length = cnt;
}
function updateBallIndexOptions(){
  const si = parseInt(rtSelect?.value||"0",10)||0;
  const cnt = currentChain()==="B" ? (BALLS_B[si].count|0) : (BALLS[si].count|0);
  if (!ballIndexSelect) return;
  ballIndexSelect.innerHTML="";
  for(let i=0;i<Math.max(1,cnt);i++){
    const o=document.createElement("option"); o.value=String(i); o.textContent=`#${i+1}`;
    ballIndexSelect.appendChild(o);
  }
}

function applyBallsTo(idx){
  const arr = currentChain()==="B" ? BALLS_B : BALLS;
  const count = Math.max(0, Math.min(64, parseInt(ballsCount?.value||"0",10)||0));
  const speedDeg = Math.max(0, Math.min(720, parseFloat(ballsSpeedNum?.value||"90")));
  const dir = (ballsDirCCW?.checked? -1 : 1);
  arr[idx].count = count;
  arr[idx].speedDeg = speedDeg;
  arr[idx].dir = dir;
  rebuildPhases(idx, arr);
  ensureBallCfgLength(currentChain(), idx);
  updateBallIndexOptions();
}
function applyBallsAll(){
  for(let i=0;i<16;i++) applyBallsTo(i);
  updateBallIndexOptions();
}

/* === Patrones para bolitas === */
function refreshBallsPatternOptions(){
  if(!ballsPatternSelect) return;
  const pats = loadPatterns(); // lista global
  ballsPatternSelect.innerHTML = "";
  const noneOpt = document.createElement("option");
  noneOpt.value = "";
  noneOpt.textContent = t("filters.noPattern");
  ballsPatternSelect.appendChild(noneOpt);
  pats.forEach((p,idx)=>{
    const opt=document.createElement("option");
    opt.value=String(idx);
    opt.textContent = p.name || t("patterns.defaultName", {n: idx+1});
    ballsPatternSelect.appendChild(opt);
  });
}
ballsPatternApplyOne?.addEventListener('click', ()=>{
  const chain=currentChain();
  const si=parseInt(rtSelect?.value||"0",10)||0;
  const pats=loadPatterns();
  const sel = parseInt(ballsPatternSelect?.value||"-1",10);
  if (sel<0 || !pats[sel]) return;

  ensureBallCfgLength(chain, si);
  if (ballApplyAll?.checked){
    const cfgArr = chain==="B" ? BALL_CFG_B[si] : BALL_CFG[si];
    cfgArr.forEach(cfg=>{ cfg.pattern = pats[sel].values.slice(); });
  }else{
    const j = parseInt(ballIndexSelect?.value||"0",10)||0;
    const cfgArr = chain==="B" ? BALL_CFG_B[si] : BALL_CFG[si];
    if (cfgArr[j]) cfgArr[j].pattern = pats[sel].values.slice();
  }
  drawEllipses();
});

ballsPatternClearOne?.addEventListener('click',()=>{
  const chain=currentChain();
  const si=parseInt(rtSelect?.value||"0",10)||0;
  ensureBallCfgLength(chain, si);
  if (ballApplyAll?.checked){
    const cfgArr = chain==="B" ? BALL_CFG_B[si] : BALL_CFG[si];
    cfgArr.forEach(cfg=>{ cfg.pattern=null; });
  }else{
    const j=parseInt(ballIndexSelect?.value||"0",10)||0;
    const cfgArr = chain==="B" ? BALL_CFG_B[si] : BALL_CFG[si];
    if (cfgArr[j]) cfgArr[j].pattern=null;
  }
  drawEllipses();
});


/* Eventos UI rotación/bolitas */
rotApplyOne?.addEventListener('click',()=>{ const idx=parseInt(rtSelect?.value||"0",10)||0; applyRotationTo(idx); });
rotApplyAll?.addEventListener('click',()=>{ applyRotationAll(); });
animPause?.addEventListener('click',()=>{ animPaused=true; });
animResume?.addEventListener('click',()=>{ animPaused=false; lastAnimTime=performance.now(); });

ballsApplyOne?.addEventListener('click',()=>{ const idx=parseInt(rtSelect?.value||"0",10)||0; applyBallsTo(idx); });
ballsApplyAll?.addEventListener('click',()=>{ applyBallsAll(); });
function readPatInputs(){
  return {
    speedDeg: Math.max(0, Math.min(720, parseFloat(patSpeedNum?.value||"90"))),
    dir: (patDirCCW?.checked? -1 : 1),
    pitch: (parseFloat(patPitchNum?.value||"0")||0)*DEG,
    yaw:   (parseFloat(patYawNum?.value||"0")||0)*DEG
  };
}
patApplyOne?.addEventListener('click', ()=>{
  const chain=currentChain();
  const si=parseInt(rtSelect?.value||"0",10)||0;
  ensureBallCfgLength(chain, si);
  const j=parseInt(ballIndexSelect?.value||"0",10)||0;
  const cfgArr = chain==="B" ? BALL_CFG_B[si] : BALL_CFG[si];
  Object.assign(cfgArr[j], readPatInputs());
});
patApplyAllBalls?.addEventListener('click', ()=>{
  const chain=currentChain();
  const si=parseInt(rtSelect?.value||"0",10)||0;
  ensureBallCfgLength(chain, si);
  const cfgArr = chain==="B" ? BALL_CFG_B[si] : BALL_CFG[si];
  const inp = readPatInputs();
  cfgArr.forEach(cfg=>Object.assign(cfg, inp));
});

/* === Auto‑asignación por Sᵢ === */
function valFor(chain, i){
  const arr = chain==="B" ? sValuesB : sValues;
  const v = arr[i];
  return (Number.isFinite(v)? v : 0);
}
// Rotación (velocidad, dirección, pitch, yaw) por valor Sᵢ
function autoAssignRotationBySi(chain){
  for(let i=0;i<16;i++) autoAssignRotationForOne(chain,i);
  if (parseInt(rtSelect?.value||"0",10) >= 0) loadRotationUI(parseInt(rtSelect.value,10)||0);
}
function autoAssignRotationForOne(chain,i){
  const v = clamp(valFor(chain,i), -1, 1);
  const a = Math.abs(v);
  const speedDeg = Math.round(a * 240);                  // 0..240 °/s
  const dir = (v>=0)? 1 : -1;                            // signo ⇒ sentido
  const pitchDeg = Math.round(v * 45);                   // −45..+45
  const yawDeg   = Math.round(v * 90);                   // −90..+90
  const arr = (chain==="B")? ROT_B : ROT;
  arr[i].speed = speedDeg*DEG;
  arr[i].dir   = dir;
  arr[i].pitch = pitchDeg*DEG;
  arr[i].yaw   = yawDeg*DEG;
}
// Bolitas (cantidad, velocidad, dirección) por valor Sᵢ
function autoAssignBallsBySi(chain){
  for(let i=0;i<16;i++) autoAssignBallsForOne(chain,i);
  if (parseInt(rtSelect?.value||"0",10) >= 0) loadBallsUI(parseInt(rtSelect.value,10)||0);
}
function autoAssignBallsForOne(chain,i){
  const v = clamp(valFor(chain,i), -1, 1);
  const a = Math.abs(v);
  const count = Math.round(a * 12);                      // 0..12 bolitas
  const dir   = (v>=0)? 1 : -1;
  const speed = Math.round(30 + a*690);                  // 30..720 °/s
  const arr = (chain==="B")? BALLS_B : BALLS;
  arr[i].count   = count;
  arr[i].dir     = dir;
  arr[i].speedDeg= speed;
  rebuildPhases(i, arr);
}
// Eventos de los checks
autoRotBySi?.addEventListener('change',()=>{
  if (autoRotBySi.checked) autoAssignRotationBySi(currentChain());
});
autoBallsBySi?.addEventListener('change',()=>{
  if (autoBallsBySi.checked) autoAssignBallsBySi(currentChain());
});

/* === RT leer/aplicar valor Sᵢ === */
let rtPrev=null;
function fillRtSelect(){
  if (!rtSelect) return;
  const prev = rtSelect.value;
  const chain = currentChain();
  rtSelect.innerHTML="";
  SI.forEach((s,i)=>{
    const opt=document.createElement("option");
    opt.value=String(i);
    opt.textContent=`${s.tag} · ${siNameFor(chain, i)}`;
    rtSelect.appendChild(opt);
  });
  if (prev!=null && prev!=="") rtSelect.value = prev;
}
function readSiIntoRt(){
  const idx = parseInt(rtSelect.value,10)||0;
  const arr = currentChain()==="B" ? sValuesB : sValues;
  const v = arr[idx];
  if (rtValue) rtValue.value = toMax16DigitsString(String(v??0)) || "0.000000000000000";
  if (rtSlider) rtSlider.value = String(Math.max(-1, Math.min(1, v??0)));
  loadRotationUI(idx);
  loadBallsUI(idx);
  updateBallIndexOptions();
}
rtSelect?.addEventListener('change',()=>{ readSiIntoRt(); if (rtOnly?.checked) drawEllipses(); });
rtSlider?.addEventListener('input',()=>{ const v=parseFloat(rtSlider.value); rtValue.value = toMax16DigitsString(String(v)) || String(v); });
rtValue?.addEventListener('input',()=>sanitize16digits(rtValue));
rtApply?.addEventListener('click',()=>{
  const idx=parseInt(rtSelect.value,10)||0;
  const v=parseFloat(rtValue.value);
  const arr = currentChain()==="B" ? sValuesB : sValues;
  const table = currentChain()==="B" ? siTableB : siTable;
  rtPrev = arr[idx];
  arr[idx] = Number.isFinite(v)?v:null;
  const inputVal=table?.children[idx]?.querySelectorAll("input")[1];
  if (inputVal){ inputVal.value=toMax16DigitsString(String(v))||String(v); inputVal.classList.remove("computed"); }
  if ((currentChain()==="B"?siFlowB:siFlow)?.checked) (currentChain()==="B"?runAlgorithmicFillB:runAlgorithmicFill)();
  // Si auto‑asignación activa, recalcular sólo este
  if (autoRotBySi?.checked) autoAssignRotationForOne(currentChain(), idx);
  if (autoBallsBySi?.checked) autoAssignBallsForOne(currentChain(), idx);
  drawBars(); drawEllipses();
});
rtRevert?.addEventListener('click',()=>{
  const idx=parseInt(rtSelect.value,10)||0;
  if (rtPrev===null||rtPrev===undefined) return;
  const arr = currentChain()==="B" ? sValuesB : sValues;
  const table = currentChain()==="B" ? siTableB : siTable;
  arr[idx]=rtPrev;
  const inputVal=table?.children[idx]?.querySelectorAll("input")[1];
  if (inputVal){ inputVal.value=toMax16DigitsString(String(rtPrev))||String(rtPrev); inputVal.classList.remove("computed"); }
  rtPrev=null;
  // Reaplicar auto‑asignación si procede
  if (autoRotBySi?.checked) autoAssignRotationForOne(currentChain(), idx);
  if (autoBallsBySi?.checked) autoAssignBallsForOne(currentChain(), idx);
  drawBars(); drawEllipses();
});

/* ===========================
   (resto del archivo SIN CAMBIOS)
   - a partir de aquí tu código sigue igual: pan/zoom, elipses A/B, temas, animación, etc.
   =========================== */

/* === Transformaciones comunes (pan/zoom + proyección) === */
function currentScaleForCanvas(canvas){ return (canvas===cvsEllA) ? ellScaleA : ellScaleB; }
function currentPanForCanvas(canvas){ return (canvas===cvsEllA) ? [ellPanXA, ellPanYA] : [ellPanXB, ellPanYB]; }
function worldToScreen(canvas,x,y){
  const rc=canvas.getBoundingClientRect();
  const cx=rc.width*0.5, cy=rc.height*0.5;
  const scale=currentScaleForCanvas(canvas);
  const [panX,panY]=currentPanForCanvas(canvas);
  return [cx + panX + x*scale, cy + panY + y*scale];
}
function rotateAndProject3D(rotX,rotY,canvas,x,y,z){

  const cY=Math.cos(rotY), sY=Math.sin(rotY);
  let x1=cY*x + sY*z; let z1=-sY*x + cY*z;
  const cX=Math.cos(rotX), sX=Math.sin(rotX);
  let y2=cX*y - sX*z1; let z2=sX*y + cX*z1;
  // Evita inversión de perspectiva (k<0) que produce “reflejo”
  if (z2 > ELL_PERSPECTIVE - 1) z2 = ELL_PERSPECTIVE - 1;
  const k = ELL_PERSPECTIVE/(ELL_PERSPECTIVE - z2);
  const xs = x1 * k, ys = y2 * k;
  const [sx,sy] = worldToScreen(canvas,xs,ys);
  return {sx,sy,z:z2,k};
}

/* === NUEVO: Brújula en esquina inferior izquierda === */
function drawCompassOverlay(ctx, W, H, yawRad, pitchRad, nivel){
  const s=getComputedStyle(document.documentElement);
  const textCol=(s.getPropertyValue('--text').trim()||"#e5e7eb");
  const lineCol=(s.getPropertyValue('--line').trim()||"rgba(255,255,255,0.35)");
  const accCol=(s.getPropertyValue('--accent').trim()||"#60a5fa");

  const R=28;
  const cx=14+R;
  const cy=H-(14+R);

  ctx.save();
  // Fondo suave para legibilidad
  ctx.globalAlpha=0.9;
  ctx.beginPath(); ctx.arc(cx,cy,R+6,0,TWO_PI); ctx.fillStyle="rgba(0,0,0,0.28)"; ctx.fill();

  // Aro
  ctx.beginPath(); ctx.arc(cx,cy,R,0,TWO_PI);
  ctx.strokeStyle=lineCol; ctx.lineWidth=1.2; ctx.stroke();

  // Marcas cardinales
  for(let ang=0; ang<360; ang+=45){
    const rad=ang*DEG;
    const r1=R-4, r2=R;
    const x1=cx + r1*Math.cos(rad), y1=cy + r1*Math.sin(rad);
    const x2=cx + r2*Math.cos(rad), y2=cy + r2*Math.sin(rad);
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.strokeStyle=lineCol; ctx.lineWidth=1; ctx.stroke();
  }

  // Flecha de yaw (orientación horizontal)
  ctx.save();
  ctx.translate(cx,cy);
  ctx.rotate(yawRad);
  ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-R+6);
  ctx.strokeStyle=accCol; ctx.lineWidth=2; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0,-R+6); ctx.lineTo(-4,-R+14); ctx.lineTo(4,-R+14); ctx.closePath();
  ctx.fillStyle=accCol; ctx.fill();
  ctx.restore();

  // Texto de grados
  const yawDeg = ((yawRad/DEG)%360+360)%360 | 0;
  const pitchDeg = (pitchRad/DEG | 0);
  ctx.font="10px ui-monospace,monospace";
  ctx.textAlign="left"; ctx.fillStyle=textCol;

  ctx.fillText(`${t("viz.hud.level")}: ${nivel}`, cx+R+8, cy-16);
  ctx.fillText(`${t("viz.hud.yaw")} ${yawDeg}°`, cx+R+8, cy-2);
  ctx.fillText(`${t("viz.hud.pitch")} ${pitchDeg}°`, cx+R+8, cy+10);

  ctx.restore();
}

// Rotación local reutilizable (fuera de los dibujados A/B)
function applyLocalRotation(x,y,z, pitch, yaw, roll){
  const cz=Math.cos(roll), sz=Math.sin(roll); let x1 = x*cz - y*sz; let y1 = x*sz + y*cz; let z1 = z;
  const cx=Math.cos(pitch), sx=Math.sin(pitch); let x2 = x1; let y2 = y1*cx - z1*sx; let z2 = y1*sx + z1*cx;
  const cy=Math.cos(yaw), sy=Math.sin(yaw); let x3 = x2*cy + z2*sy; let y3 = y2; let z3 = -x2*sy + z2*cy;
  return [x3,y3,z3];
}

// HUD: indicador de zoom (esquina inferior izquierda)
function drawRoundRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
}
function drawZoomHUD(ctx, canvas, zoom){
  const rc = canvas.getBoundingClientRect(); const W=rc.width, H=rc.height;
  const txt = `×${(zoom||1).toFixed(2)}`;
  ctx.save();
  ctx.font="12px ui-monospace,monospace";
  const m = ctx.measureText(txt);
  const padX=8, padY=4, h=18, w=m.width+padX*2, x=10, y=H-h-10;
  ctx.fillStyle="rgba(0,0,0,.35)"; drawRoundRect(ctx,x+1,y+1,w,h,8); ctx.fill();
  ctx.fillStyle="rgba(16,20,32,.55)"; drawRoundRect(ctx,x,y,w,h,8); ctx.fill();
  ctx.fillStyle="#fff"; ctx.textBaseline="middle"; ctx.fillText(txt, x+padX, y+h/2);
  ctx.restore();
}


/* Dibujo de mini‑cadenas (patrón) alrededor de una bolita
   Importante: NUNCA se dibujan bolitas internas aquí (sólo elásticos/mini‑elipses),
   y su tamaño ahora escala con la perspectiva k y con el zoom del visor. */
// Mini‑cadenas (patrón) 3D anidadas a la elipse madre y proyectadas con la misma cámara
function drawMiniPatternCluster(ctx, canvas, chain, siIndex, ballIndex, pLocalBall, rx, ry, Rparent, globalRotX, globalRotY, patternVals, cfg){
  if(!patternVals) return;

  // Ocultar todo el cluster de mini‑elipses de bolitas por cadena (sólo afecta a patrones)
  if ((chain==="A" && patHideA2?.checked) || (chain==="B" && patHideB2?.checked)) return;

  const s = getComputedStyle(document.documentElement);
  const textCol = (s.getPropertyValue('--text').trim() || "#e5e7eb");

  const SPIN = chain==="B" ? PAT_SPIN_PER_BALL_B : PAT_SPIN_PER_BALL;
  const spinArr = SPIN[siIndex] && SPIN[siIndex][ballIndex];

  const miniFactor = 0.28;
  const rmx = Math.max(2, rx*miniFactor), rmy = Math.max(2, ry*miniFactor);
  const segs = 40;
  const clusterLabels = [];
  for(let k=0;k<16;k++){
    const val = patternVals[k];
    if (val==null || !isFinite(val)) continue;
    // Filtro por signo EXCLUSIVO de mini‑elipses (panel de abajo)
    if (patSignMode==='pos' && !(val>0)) continue;
    if (patSignMode==='neg' && !(val<0)) continue;

    const invPat = calcularInversionCU(val, SI[k].formulaId);
    const rPat   = invPat? invPat.r : 0;
    const deform = 1 + rPat*0.25;
    const rxP = Math.max(2, rmx*deform), ryP = Math.max(2, rmy);

    let pPitch=0, pYaw=0, pSpin=0;
    if (autoPatternMotion?.checked){
      const v = clamp(val,-1,1);
      pPitch = v*45*DEG;  pYaw = v*90*DEG;
    } else if (cfg){
      pPitch = cfg.pitch||0;  pYaw = cfg.yaw||0;
    }
    if (spinArr) pSpin = spinArr[k] || 0;

    ctx.save();
    ctx.globalAlpha = 0.55;
    const strokeCol = `hsl(${(k*22)%360} 100% 70%)`;
    ctx.strokeStyle = strokeCol;
    ctx.lineWidth   = 1;

    let minY=Infinity, minPt=[0,0];

    ctx.beginPath();
    for(let t=0;t<=segs;t++){
      const ang = (t/segs)*TWO_PI;
      let dx = rxP*Math.cos(ang), dy = ryP*Math.sin(ang), dz = 0;

      const p1 = applyLocalRotation(dx,dy,dz, pPitch, pYaw, pSpin);
      const p2 = applyLocalRotation(p1[0],p1[1],p1[2], Rparent.pitch, Rparent.yaw, Rparent.spin);

      const xw = pLocalBall[0] + p2[0], yw = pLocalBall[1] + p2[1], zw = pLocalBall[2] + p2[2];
      const scr = rotateAndProject3D(globalRotX, globalRotY, canvas, xw, yw, zw);
      if(t===0) ctx.moveTo(scr.sx, scr.sy); else ctx.lineTo(scr.sx, scr.sy);
      if (scr.sy < minY){ minY = scr.sy; minPt = [scr.sx, scr.sy]; }
    }
    ctx.stroke();

    // Acumular etiqueta; se dibuja después evitando solapes
    if (!patHideLabels?.checked){
      clusterLabels.push({ x:minPt[0], y:minPt[1]-5, text:SI[k].tag });
    }
    // Dibujo de etiquetas acumuladas evitando superposición (por cluster)
    if (!patHideLabels?.checked && clusterLabels.length){
      clusterLabels.sort((a,b)=> (a.y - b.y) || (a.x - b.x));
      const tol = 10;
      const placed = [];
      for (let i=0;i<clusterLabels.length;i++){
        const L = clusterLabels[i];
        let dx = 0;
        for (let j=0;j<i;j++){
          const P = clusterLabels[j];
          if (Math.abs(L.y - P.y) < tol && Math.abs((L.x+dx) - P.x) < tol){
            dx += tol + 6;
          }
        }
        L.x += dx; placed.push(L);
      }
      ctx.font="10px ui-monospace,monospace";
      ctx.textAlign="center";
      for (const L of placed){
        ctx.fillStyle="rgba(0,0,0,0.45)"; ctx.fillText(L.text, L.x, L.y+1);
        ctx.fillStyle=textCol;            ctx.fillText(L.text, L.x, L.y);
      }
    }
    ctx.restore();
  }
}



/* === Elipses cadena A === */
function getVizValuesForEllipsesA(){ return sValues.slice(); }
function drawEllipsesA(){
  if (!cvsEllA||!ctxEllA||cvsEllA.hidden) return;
  const hideEllA = !!ellHideA?.checked; 
  // NUEVO: no hacemos return; solo ocultaremos el contorno si se pidió ocultar la cadena activa
  const hideOutlinesForActiveA = !!(ellHideActive?.checked && currentChain()==="A");

  setupHiDPI(cvsEllA,ctxEllA);
  if (viewMode==="2D"){
    ellPanXA=0; ellPanYA=0; ellRotXA=0; ellRotYA=0;
    ellScaleA = computeFitScaleForChain("A", cvsEllA);
  }

  const vals=getVizValuesForEllipsesA();
  const rc=cvsEllA.getBoundingClientRect(), W=rc.width, H=rc.height, ctx=ctxEllA;
  ctx.clearRect(0,0,W,H);

  const s=getComputedStyle(document.documentElement);
  const STYLE = LEVEL_STYLE_A; // ← estilo propio de la Cadena A

  const c1=s.getPropertyValue('--viz1').trim()||"#0b1020";
  const c2=s.getPropertyValue('--viz2').trim()||"#091123";
  const textCol=s.getPropertyValue('--text').trim()||"#111111";

  const rg=ctx.createRadialGradient(W*0.5,H*0.5,20, W*0.5,H*0.5,Math.max(W,H));
  rg.addColorStop(0,c1); rg.addColorStop(1,c2); ctx.fillStyle=rg; ctx.fillRect(0,0,W,H);

  ellipsesCacheA=[]; const labels=[];
  const filterEnabled = !!(rtOnly?.checked);
  const allowed = filterEnabled ? rtSelectedSet : null;

  function applyLocalRotation(x,y,z, pitch, yaw, roll){
    const cz=Math.cos(roll), sz=Math.sin(roll); let x1 = x*cz - y*sz; let y1 = x*sz + y*cz; let z1 = z;
    const cx=Math.cos(pitch), sx=Math.sin(pitch); let x2 = x1; let y2 = y1*cx - z1*sx; let z2 = y1*sx + z1*cx;
    const cy=Math.cos(yaw), sy=Math.sin(yaw); let x3 = x2*cy + z2*sy; let y3 = y2; let z3 = -x2*sy + z2*cy;
    return [x3,y3,z3];
  }

  for (let i=0;i<16;i++){
    if (filterEnabled && !allowed.has(i)) continue;
    const useFormula = !!vizFormulaMode?.checked;
    let sVal = useFormula ? getFormulaAnchorFor(i) : vals[i];
    if (!useFormula && sVal==null) continue;

    // Decidimos si la ELIPSE/ETIQUETA se dibuja y si la BOLITA (disco) aparece.
    // Las mini‑elipses del patrón se dibujan aparte (no dependen de esto).
    const allowOutline = (ellipsesSignMode==='all') ||
                        (ellipsesSignMode==='pos' ? (sVal>0) :
                          (ellipsesSignMode==='neg' ? (sVal<0) : true));
    const showBall = allowOutline; // la bolita sólo si coincide el signo de la Sᵢ con el filtro global

    const inv=calcularInversionCU(sVal, SI[i].formulaId); if (!inv) continue;
    const rVal=inv.r, base = rVal*(i+1)*8;

    // Estilo dependiente del nivel (warp/skew/twist/jitter + hue)
    const skew  = STYLE.skew;
    const warp  = STYLE.warp;
    const jitter= STYLE.jitter;
    const twist = STYLE.twist;

    const deform = 1 + rVal*(0.4 + warp);
    const rx = base * (1+skew) * deform;
    const ry = base * (1-skew);

    // Desplazamiento de color por nivel (hue fijo por nivel)
    const hue = ( (i*22) + STYLE.hue ) % 360;
    const color=`hsl(${hue} 100% 65%)`;

    // Rotación local “retocada” por nivel (misma para el mismo nivel)
    const R0 = ROT[i];
    const R = { pitch: R0.pitch + twist*(1 + i*0.02), yaw: R0.yaw + jitter*(1 + i*0.03), spin: R0.spin };

    const segs = 140; const poly = new Array(segs);
    let minY=Infinity, minIdx=0, zSum=0;

    for (let t=0;t<segs;t++){
      const ang = (t/segs)*Math.PI*2;
      let x = rx*Math.cos(ang), y = ry*Math.sin(ang), z = 0;
      const pLocal = applyLocalRotation(x,y,z, R.pitch, R.yaw, R.spin);
      const p = rotateAndProject3D(ellRotXA,ellRotYA,cvsEllA, pLocal[0], pLocal[1], pLocal[2]);
      poly[t] = [p.sx, p.sy]; zSum += p.z; if (p.sy < minY){ minY=p.sy; minIdx=t; }
    }
    const zAvg = zSum/segs;

    // Dibujo del contorno SOLO si no está oculto para cadena activa
    if (!hideEllA && allowOutline){
      ctx.save();
      ctx.shadowBlur=8; ctx.shadowColor=color; ctx.strokeStyle=color;
      ctx.globalAlpha=Math.max(0.18, 1 - i*0.05);
      ctx.lineWidth = selectionA.has(i)? 2.6 : 1.2;
      ctx.beginPath(); ctx.moveTo(poly[0][0], poly[0][1]); for(let k=1;k<segs;k++) ctx.lineTo(poly[k][0], poly[k][1]); ctx.closePath(); ctx.stroke();
      ctx.restore();
    }

    // Bolitas A (se mantienen aunque se oculten las elipses)
    const b = BALLS[i];
    if (b.count>0){
      for(let j=0;j<b.count;j++){
        const theta = b.phases[j] ?? 0;
        let bx = rx*Math.cos(theta), by = ry*Math.sin(theta), bz=0;
        const pLocal = applyLocalRotation(bx,by,bz, R.pitch, R.yaw, R.spin);
        const q = rotateAndProject3D(ellRotXA,ellRotYA,cvsEllA, pLocal[0], pLocal[1], pLocal[2]);
        const rad = Math.max(1.5, 2.2*q.k) * Math.max(0.7, ellScaleA);
        if (showBall){
          ctx.beginPath(); ctx.fillStyle=color; ctx.arc(q.sx, q.sy, rad, 0, Math.PI*2); ctx.fill();
        }
        // Mini‑cadena (si hay patrón) — sin bolitas internas
        const pLocalBall = applyLocalRotation(bx,by,bz, R.pitch, R.yaw, R.spin);
        const cfgArr = /* A: */ BALL_CFG[i];   // en B usa BALL_CFG_B[i]
        const cfg    = (cfgArr && cfgArr[j]) || null;
        const patVals= (cfg && cfg.pattern) || /* A: */ BALLS_PATTERN[i];  // en B usa BALLS_PATTERN_B[i]
        if (patVals){
          // A:
          drawMiniPatternCluster(ctx, cvsEllA, "A", i, j, pLocalBall, rx, ry, R, ellRotXA, ellRotYA, patVals, cfg);
        }
      }
    }

    if(!ellHideLabels?.checked && allowOutline){
      const labelPt = poly[minIdx];
      labels.push({i, x:labelPt[0], y:labelPt[1]-6, text:SI[i].tag, color, z:zAvg});
    }

    if (allowOutline) ellipsesCacheA.push({i, rx, ry, inv, color, value:sVal, poly, zAvg});
  }

  if(!ellHideLabels?.checked){
    labels.sort((a,b)=> (a.y - b.y) || (a.x - b.x));
    const used=[]; const tol=12;
    for(let k=0;k<labels.length;k++){
      const L=labels[k]; let offset=0;
      for (let j=0;j<k;j++){
        const P=labels[j];
        if (Math.abs(L.y - P.y) < tol && Math.abs((L.x+offset) - P.x) < tol){
          offset += tol+6;
        }
      }
      L.x += offset; used.push(L);
    }

    ctx.font="12px ui-monospace,monospace"; ctx.textAlign="center";
    for (const L of used){
      ctx.fillStyle="rgba(0,0,0,0.45)"; ctx.fillText(L.text, L.x, L.y+1);
      ctx.fillStyle=textCol;          ctx.fillText(L.text, L.x, L.y);
    }
  }

  // NUEVO: brújula
  drawCompassOverlay(ctx, W, H, ellRotYA, ellRotXA, CHAIN_LEVEL.A);
  drawZoomHUD(ctx, cvsEllA, ellScaleA);

}
/* Interacción A */
function distPointToSeg(px,py, x1,y1, x2,y2){
  const vx=x2-x1, vy=y2-y1; const wx=px-x1, wy=py-y1;
  const c1=wx*vx+wy*vy; if (c1<=0) return Math.hypot(px-x1, py-y1);
  const c2=vx*vx+vy*vy; if (c2<=c1) return Math.hypot(px-x2, py-y2);
  const b=c1/c2; const bx=x1+b*vx, by=y1+b*vy; return Math.hypot(px-bx, py-by);
}
function hitEllipseAt(x,y, E){
  const P=E.poly; const n=P.length; const tol=6;
  for(let k=0;k<n;k++){
    const a=P[k], b=P[(k+1)%n];
    if (distPointToSeg(x,y, a[0],a[1], b[0],b[1])<=tol) return true;
  }
  return false;
}
// ✅ Reutilizable: selección/click (sirve para mouse y para tap táctil)
function handleEllipseSelect(chain, x, y, shiftKey){
  const cache = (chain==="B") ? ellipsesCacheB : ellipsesCacheA;
  const sel   = (chain==="B") ? selectionB : selectionA;

  let hit=-1, data=null;
  for(let k=cache.length-1;k>=0;k--){
    if (hitEllipseAt(x,y,cache[k])){ hit=cache[k].i; data=cache[k]; break; }
  }

  if (hit>=0){
    if (shiftKey){
      sel.has(hit)?sel.delete(hit):sel.add(hit);
      openSelectionPanel(chain);
    }else{
      sel.clear(); sel.add(hit);
      openEllipseInfoPanel(data, chain);
    }
    drawEllipses();
  }else{
    sel.clear();
    drawEllipses();
  }
}
cvsEllA?.addEventListener('click',e=>{
  if (suppressNextClickA){ suppressNextClickA=false; return; }
  const rc=cvsEllA.getBoundingClientRect();
  const x=e.clientX-rc.left, y=e.clientY-rc.top;
  handleEllipseSelect("A", x, y, e.shiftKey);
});
cvsEllA?.addEventListener('mousedown', e=>{
  if (e?.sourceCapabilities?.firesTouchEvents) return;
  if (e.button!==0) return;
  if (viewMode==="2D") return;

  const rc=cvsEllA.getBoundingClientRect(); const x=e.clientX-rc.left, y=e.clientY-rc.top;
  let hitAlgo=false;
  for(let k=ellipsesCacheA.length-1;k>=0;k--){ if (hitEllipseAt(x,y,ellipsesCacheA[k])){ hitAlgo=true; break; } }
  if (e.altKey || !hitAlgo){ isPanningA=true; panStartA=[e.clientX,e.clientY]; movedDuringPanA=false; e.preventDefault(); }
});
window.addEventListener('mouseup',()=>{ if (isPanningA && movedDuringPanA){ suppressNextClickA=true; setTimeout(()=>suppressNextClickA=false,0); } isPanningA=false; });
window.addEventListener('mousemove',e=>{ if(!isPanningA) return; ellPanXA += (e.clientX-panStartA[0]); ellPanYA += (e.clientY-panStartA[1]); panStartA=[e.clientX,e.clientY]; movedDuringPanA=true; drawEllipsesA(); });

cvsEllA?.addEventListener('wheel',e=>{
  e.preventDefault();
  if (viewMode==="2D") return;

  const rc=cvsEllA.getBoundingClientRect(); const x=e.clientX-rc.left, y=e.clientY-rc.top;
  const before=[(x-rc.width*0.5-ellPanXA)/ellScaleA,(y-rc.height*0.5-ellPanYA)/ellScaleA];
  const factor=e.deltaY<0?1.12:1/1.12; ellScaleA=Math.min(50,Math.max(0.1, ellScaleA*factor));

  const after=[(x-rc.width*0.5-ellPanXA)/ellScaleA,(y-rc.height*0.5-ellPanYA)/ellScaleA];
  ellPanXA += (before[0]-after[0])*ellScaleA; ellPanYA += (before[1]-after[1])*ellScaleA;
  drawEllipsesA();
},{passive:false});

/* === Elipses cadena B === */
function getVizValuesForEllipsesB(){ return sValuesB.slice(); }
function drawEllipsesB(){
  if (!cvsEllB||!ctxEllB||cvsEllB.hidden) return;
  // NUEVO: misma lógica que en A
  const hideEllB = !!ellHideB?.checked;

  setupHiDPI(cvsEllB,ctxEllB);
  if (viewMode==="2D"){
    ellPanXB=0; ellPanYB=0; ellRotXB=0; ellRotYB=0;
    ellScaleB = computeFitScaleForChain("B", cvsEllB);
  }

  const vals=getVizValuesForEllipsesB();
  const rc=cvsEllB.getBoundingClientRect(), W=rc.width, H=rc.height, ctx=ctxEllB;
  ctx.clearRect(0,0,W,H);

  const s=getComputedStyle(document.documentElement);
  const STYLE = LEVEL_STYLE_B; // ← estilo propio de la Cadena B

  const c1=s.getPropertyValue('--viz1').trim()||"#0b1020";
  const c2=s.getPropertyValue('--viz2').trim()||"#091123";
  const textCol=s.getPropertyValue('--text').trim()||"#111111";

  const rg=ctx.createRadialGradient(W*0.5,H*0.5,20, W*0.5,H*0.5,Math.max(W,H));
  rg.addColorStop(0,c1); rg.addColorStop(1,c2); ctx.fillStyle=rg; ctx.fillRect(0,0,W,H);

  ellipsesCacheB=[]; const labels=[];
  const filterEnabled = !!(rtOnly?.checked);
  const allowed = filterEnabled ? rtSelectedSet : null;

  function applyLocalRotation(x,y,z, pitch, yaw, roll){
    const cz=Math.cos(roll), sz=Math.sin(roll); let x1 = x*cz - y*sz; let y1 = x*sz + y*cz; let z1 = z;
    const cx=Math.cos(pitch), sx=Math.sin(pitch); let x2 = x1; let y2 = y1*cx - z1*sx; let z2 = y1*sx + z1*cx;
    const cy=Math.cos(yaw), sy=Math.sin(yaw); let x3 = x2*cy + z2*sy; let y3 = y2; let z3 = -x2*sy + z2*cy;
    return [x3,y3,z3];
  }

  for (let i=0;i<16;i++){
    if (filterEnabled && !allowed.has(i)) continue;
    const useFormula = !!vizFormulaMode?.checked;
    let sVal = useFormula ? getFormulaAnchorFor(i) : vals[i];
    if (!useFormula && sVal==null) continue;

    const allowOutline = (ellipsesSignMode==='all') ||
                        (ellipsesSignMode==='pos' ? (sVal>0) :
                          (ellipsesSignMode==='neg' ? (sVal<0) : true));
    const showBall = allowOutline;

    const inv=calcularInversionCU(sVal, SI[i].formulaId); if (!inv) continue;
    const rVal=inv.r, base = rVal*(i+1)*8;

    // Estilo dependiente del nivel (warp/skew/twist/jitter + hue)
    const skew  = STYLE.skew;
    const warp  = STYLE.warp;
    const jitter= STYLE.jitter;
    const twist = STYLE.twist;

    const deform = 1 + rVal*(0.4 + warp);
    const rx = base * (1+skew) * deform;
    const ry = base * (1-skew);

    // Desplazamiento de color por nivel (hue fijo por nivel)
    const hue = ( (i*22) + STYLE.hue ) % 360;
    const color=`hsl(${hue} 100% 65%)`;

    // Rotación local “retocada” por nivel (misma para el mismo nivel)
    const R0 = ROT_B[i];
    const R = { pitch: R0.pitch + twist*(1 + i*0.02), yaw: R0.yaw + jitter*(1 + i*0.03), spin: R0.spin };

    const segs = 140; const poly = new Array(segs);
    let minY=Infinity, minIdx=0, zSum=0;

    for (let t=0;t<segs;t++){
      const ang = (t/segs)*Math.PI*2;
      let x = rx*Math.cos(ang), y = ry*Math.sin(ang), z = 0;
      const pLocal = applyLocalRotation(x,y,z, R.pitch, R.yaw, R.spin);
      const p = rotateAndProject3D(ellRotXB,ellRotYB,cvsEllB, pLocal[0], pLocal[1], pLocal[2]);
      poly[t] = [p.sx, p.sy]; zSum += p.z; if (p.sy < minY){ minY=p.sy; minIdx=t; }
    }
    const zAvg = zSum/segs;

    if (!hideEllB && allowOutline) {
      ctx.save();
      ctx.shadowBlur=8; ctx.shadowColor=color; ctx.strokeStyle=color;
      ctx.globalAlpha=Math.max(0.18, 1 - i*0.05);
      ctx.lineWidth = selectionB.has(i)? 2.6 : 1.2;
      ctx.beginPath(); ctx.moveTo(poly[0][0], poly[0][1]); for(let k=1;k<segs;k++) ctx.lineTo(poly[k][0], poly[k][1]); ctx.closePath(); ctx.stroke();
      ctx.restore();
    }

    const b = BALLS_B[i];
    if (b.count>0){
      for(let j=0;j<b.count;j++){
        const theta = b.phases[j] ?? 0;
        let bx = rx*Math.cos(theta), by = ry*Math.sin(theta), bz=0;
        const pLocal = applyLocalRotation(bx,by,bz, R.pitch, R.yaw, R.spin);
        const q = rotateAndProject3D(ellRotXB,ellRotYB,cvsEllB, pLocal[0], pLocal[1], pLocal[2]);
        const rad = Math.max(1.5, 2.2*q.k) * Math.max(0.7, ellScaleB);
        if (showBall){
          ctx.beginPath(); ctx.fillStyle=color; ctx.arc(q.sx, q.sy, rad, 0, Math.PI*2); ctx.fill();
        }
        const pLocalBall = pLocal;
        const cfgArrB = BALL_CFG_B[i];
        const cfgB    = (cfgArrB && cfgArrB[j]) || null;
        const patValsB= (cfgB && cfgB.pattern) || BALLS_PATTERN_B[i];
        if (patValsB){
          drawMiniPatternCluster(ctx, cvsEllB, "B", i, j, pLocalBall, rx, ry, R, ellRotXB, ellRotYB, patValsB, cfgB);
        }
      }
    }

    if(!ellHideLabels?.checked && allowOutline){
      const labelPt = poly[minIdx];
      labels.push({i, x:labelPt[0], y:labelPt[1]-6, text:SI[i].tag, color, z:zAvg});
    }

    if (allowOutline) ellipsesCacheB.push({i, rx, ry, inv, color, value:sVal, poly, zAvg});
  }

  if(!ellHideLabels?.checked){
    labels.sort((a,b)=> (a.y - b.y) || (a.x - b.x));
    const used=[]; const tol=12;
    for(let k=0;k<labels.length;k++){
      const L=labels[k]; let offset=0;
      for (let j=0;j<k;j++){
        const P=labels[j];
        if (Math.abs(L.y - P.y) < tol && Math.abs((L.x+offset) - P.x) < tol){
          offset += tol+6;
        }
      }
      L.x += offset; used.push(L);
    }

    ctx.font="12px ui-monospace,monospace"; ctx.textAlign="center";
    for (const L of used){
      ctx.fillStyle="rgba(0,0,0,0.45)"; ctx.fillText(L.text, L.x, L.y+1);
      ctx.fillStyle=textCol;          ctx.fillText(L.text, L.x, L.y);
    }
  }

  // NUEVO: brújula
  drawCompassOverlay(ctx, W, H, ellRotYB, ellRotXB, CHAIN_LEVEL.B);
  drawZoomHUD(ctx, cvsEllB, ellScaleB);
}
/* Interacción B */
cvsEllB?.addEventListener('click',e=>{
  if (suppressNextClickB){ suppressNextClickB=false; return; }
  const rc=cvsEllB.getBoundingClientRect();
  const x=e.clientX-rc.left, y=e.clientY-rc.top;
  handleEllipseSelect("B", x, y, e.shiftKey);
});
cvsEllB?.addEventListener('mousedown', e=>{
  if (e?.sourceCapabilities?.firesTouchEvents) return;
  if (e.button!==0) return;
  if (viewMode==="2D") return;

  const rc=cvsEllB.getBoundingClientRect(); const x=e.clientX-rc.left, y=e.clientY-rc.top;
  let hitAlgo=false;
  for(let k=ellipsesCacheB.length-1;k>=0;k--){ if (hitEllipseAt(x,y,ellipsesCacheB[k])){ hitAlgo=true; break; } }
  if (e.altKey || !hitAlgo){ isPanningB=true; panStartB=[e.clientX,e.clientY]; movedDuringPanB=false; e.preventDefault(); }
});
window.addEventListener('mouseup',()=>{ if (isPanningB && movedDuringPanB){ suppressNextClickB=true; setTimeout(()=>suppressNextClickB=false,0); } isPanningB=false; });
window.addEventListener('mousemove',e=>{ if(!isPanningB) return; ellPanXB += (e.clientX-panStartB[0]); ellPanYB += (e.clientY-panStartB[1]); panStartB=[e.clientX,e.clientY]; movedDuringPanB=true; drawEllipsesB(); });

cvsEllB?.addEventListener('wheel',e=>{
  e.preventDefault();
  if (viewMode==="2D") return;

  const rc=cvsEllB.getBoundingClientRect(); const x=e.clientX-rc.left, y=e.clientY-rc.top;
  const before=[(x-rc.width*0.5-ellPanXB)/ellScaleB,(y-rc.height*0.5-ellPanYB)/ellScaleB];
  const factor=e.deltaY<0?1.12:1/1.12; ellScaleB=Math.min(50,Math.max(0.1, ellScaleB*factor));

  const after=[(x-rc.width*0.5-ellPanXB)/ellScaleB,(y-rc.height*0.5-ellPanYB)/ellScaleB];
  ellPanXB += (before[0]-after[0])*ellScaleB; ellPanYB += (before[1]-after[1])*ellScaleB;
  drawEllipsesB();
},{passive:false});
/* ===========================
   ✅ Touch controls (móvil)
   - 1 dedo: rotar (pitch/yaw)
   - 2 dedos: pan
   - Pinch: zoom
   - Tap: seleccionar elipse
   =========================== */
function bindTouchOrbitControls(canvas, chain){
  if(!canvas) return;
  if(canvas.__touchOrbitBound) return;
  canvas.__touchOrbitBound = true;

  // Asegura que el navegador no se “robe” el gesto para scroll/zoom de página
  canvas.style.touchAction = "none";

  const state = {
    pts: new Map(),      // pointerId -> {x,y}
    mode: "none",        // 'one' | 'pinch' | 'none'
    startX:0, startY:0,
    startRotX:0, startRotY:0,
    startPanX:0, startPanY:0,
    startScale:1,
    startDist:1,
    moved:false,
    downT:0
  };

  const getRotX  = ()=> (chain==="A" ? ellRotXA  : ellRotXB);
  const getRotY  = ()=> (chain==="A" ? ellRotYA  : ellRotYB);
  const setRotX  = (v)=>{ if(chain==="A") ellRotXA=v; else ellRotXB=v; };
  const setRotY  = (v)=>{ if(chain==="A") ellRotYA=v; else ellRotYB=v; };

  const getPanX  = ()=> (chain==="A" ? ellPanXA  : ellPanXB);
  const getPanY  = ()=> (chain==="A" ? ellPanYA  : ellPanYB);
  const setPanX  = (v)=>{ if(chain==="A") ellPanXA=v; else ellPanXB=v; };
  const setPanY  = (v)=>{ if(chain==="A") ellPanYA=v; else ellPanYB=v; };

  const getScale = ()=> (chain==="A" ? ellScaleA : ellScaleB);
  const setScale = (v)=>{ if(chain==="A") ellScaleA=v; else ellScaleB=v; };

  // Suprime el click sintético tras un gesto táctil (en touch suele tardar más que en mouse)
  const suppressClick = ()=>{
    if(chain==="A"){
      suppressNextClickA = true;
      setTimeout(()=>suppressNextClickA=false, 450);
    }else{
      suppressNextClickB = true;
      setTimeout(()=>suppressNextClickB=false, 450);
    }
  };

  const dist = (a,b)=> Math.hypot(a.x-b.x, a.y-b.y);

  function startPinchFromCurrent(){
    const pts = Array.from(state.pts.values());
    if (pts.length<2) return;
    const p1=pts[0], p2=pts[1];
    state.mode = "pinch";
    state.startDist  = Math.max(1, dist(p1,p2));
    state.startScale = getScale();
    state.startPanX  = getPanX();
    state.startPanY  = getPanY();
    state.moved = true;
  }

  canvas.addEventListener("pointerdown", (e)=>{
    if (e.pointerType!=="touch") return;
    if (viewMode==="2D") return;

    state.downT = performance.now();

    try{ canvas.setPointerCapture(e.pointerId); }catch(_){}
    state.pts.set(e.pointerId, {x:e.clientX, y:e.clientY});

    if (state.pts.size===1){
      state.mode="one";
      state.startX=e.clientX; state.startY=e.clientY;
      state.startRotX=getRotX(); state.startRotY=getRotY();
      state.moved=false;
    }else{
      startPinchFromCurrent();
    }

    e.preventDefault();
  }, {passive:false});

  canvas.addEventListener("pointermove", (e)=>{
    if (e.pointerType!=="touch") return;
    if (!state.pts.has(e.pointerId)) return;
    if (viewMode==="2D") return;

    state.pts.set(e.pointerId, {x:e.clientX, y:e.clientY});

    if (state.mode==="one" && state.pts.size===1){
      const dx = e.clientX - state.startX;
      const dy = e.clientY - state.startY;
      if (Math.hypot(dx,dy) > 6) state.moved=true;

      const sens = 0.008; // rad/px (ajuste “natural”)
      let rx = state.startRotX + dy*sens;
      let ry = state.startRotY + dx*sens;
      rx = clamp(rx, -1.4, 1.4);
      ry = clamp(ry, -Math.PI, Math.PI);
      setRotX(rx); setRotY(ry);

    }else if (state.pts.size>=2){
      const pts = Array.from(state.pts.values());
      const p1=pts[0], p2=pts[1];

      const newDist = Math.max(1, dist(p1,p2));
      const ratio   = newDist / state.startDist;
      const newScale= clamp(state.startScale * ratio, 0.1, 50);

      // Midpoint (ancla de zoom/pan)
      const midX = (p1.x+p2.x)/2;
      const midY = (p1.y+p2.y)/2;

      const rc = canvas.getBoundingClientRect();
      const mx = midX - rc.left;
      const my = midY - rc.top;
      const cx = rc.width*0.5;
      const cy = rc.height*0.5;

      // mundo bajo el dedo (en el estado inicial)
      const wx = (mx - cx - state.startPanX) / state.startScale;
      const wy = (my - cy - state.startPanY) / state.startScale;

      // pan nuevo para mantener el ancla estable
      const panX = mx - cx - wx*newScale;
      const panY = my - cy - wy*newScale;

      setScale(newScale);
      setPanX(panX);
      setPanY(panY);

      state.moved = true;
    }

    e.preventDefault();
  }, {passive:false});

  function onEnd(e){
    if (e.pointerType!=="touch") return;
    if (state.pts.has(e.pointerId)) state.pts.delete(e.pointerId);

    if (state.pts.size===0){
      const dt = performance.now() - (state.downT||0);

      if (!state.moved && dt < 350){
        // ✅ Tap => selección
        const rc = canvas.getBoundingClientRect();
        const x = e.clientX - rc.left;
        const y = e.clientY - rc.top;
        suppressClick();
        handleEllipseSelect(chain, x, y, false);
      }else{
        // gesto => evita click fantasma
        suppressClick();
      }

      state.mode="none";
      state.moved=false;

    }else if (state.pts.size===1){
      // Si queda 1 dedo tras pinch, continuamos como rotación desde aquí
      const p = Array.from(state.pts.values())[0];
      state.mode="one";
      state.startX=p.x; state.startY=p.y;
      state.startRotX=getRotX(); state.startRotY=getRotY();
      state.moved=true;

    }else{
      startPinchFromCurrent();
    }

    e.preventDefault();
  }

  canvas.addEventListener("pointerup", onEnd, {passive:false});
  canvas.addEventListener("pointercancel", onEnd, {passive:false});
}

// Activación (A y B)
bindTouchOrbitControls(cvsEllA, "A");
bindTouchOrbitControls(cvsEllB, "B");
/* Centro / reset (afecta a ambos) */
const centerBtn = document.getElementById('centerEllipses')
                  || document.getElementById('resetEllipses')
                  || document.getElementById('resetBtn')
                  || document.getElementById('btnReset');
if (centerBtn){
  centerBtn.textContent = t("viz.centrar");
  centerBtn.addEventListener('click', (e)=>{
    const resetAngles = e.shiftKey;
    if (viewMode==="2D"){
      // re‑encuadre 2D: frontal + centrado; scale se recalcula en drawEllipses*
      ellPanXA=ellPanYA=0; ellPanXB=ellPanYB=0;
      ellRotXA=ellRotYA=0; ellRotXB=ellRotYB=0;
      drawEllipses();
      return;
    }

    ellScaleA=1; ellPanXA=0; ellPanYA=0;
    ellScaleB=1; ellPanXB=0; ellPanYB=0;
    if (resetAngles){ ellRotXA=DEFAULT_ROT_X; ellRotYA=DEFAULT_ROT_Y; ellRotXB=DEFAULT_ROT_X; ellRotYB=DEFAULT_ROT_Y; }
    drawEllipses();
  });
}

/* Rotación 3D global por teclado (sobre el último canvas usado) */
let activeCanvas = "A";
[cvsEllA,cvsEllB].forEach((cv,idx)=>cv?.addEventListener('mouseenter',()=>{ activeCanvas = idx===0?"A":"B"; }));
window.addEventListener('keydown', (e)=>{
  const ae = document.activeElement;
  const tag  = (ae?.tagName || "").toLowerCase();
  const type = (ae?.getAttribute && ae.getAttribute('type') || "").toLowerCase();
  const isTextEditing =
    (ae?.isContentEditable) ||
    tag === "textarea" ||
    (tag === "input" && !["range","button","checkbox","radio","color","file","reset","submit"].includes(type));
  if (isTextEditing) return;
  const isEll = (activeCanvas==="A"? !cvsEllA?.hidden : !cvsEllB?.hidden);
  if (!isEll) return;
  if (viewMode==="2D") return;

  const step = e.shiftKey ? 0.15 : 0.08; 
  let changed = false;

  const rX = activeCanvas==="A"? ()=>ellRotXA : ()=>ellRotXB;
  const rY = activeCanvas==="A"? ()=>ellRotYA : ()=>ellRotYB;
  const setRX = activeCanvas==="A"? (v)=>{ellRotXA=v;} : (v)=>{ellRotXB=v;};
  const setRY = activeCanvas==="A"? (v)=>{ellRotYA=v;} : (v)=>{ellRotYB=v;};

  switch (e.key) {
    case "ArrowUp":    setRX( clamp(rX()-step, -1.4,  1.4) );        changed = true; break;
    case "ArrowDown":  setRX( clamp(rX()+step, -1.4,  1.4) );        changed = true; break;
    case "ArrowLeft":  setRY( clamp(rY()-step, -Math.PI, Math.PI) ); changed = true; break;
    case "ArrowRight": setRY( clamp(rY()+step, -Math.PI, Math.PI) ); changed = true; break;
  }
  if (changed) { e.preventDefault(); e.stopPropagation(); drawEllipses(); }
});

/* Ventanas info selección */
function openEllipseInfoPanel(data, chain){
  const {i, rx, ry, inv, color, value} = data;
  $("#ellipseTitle") && ($("#ellipseTitle").textContent = `${SI[i].tag} · ${siNameFor(chain, i)}`);
  const xPart = (inv.x===null || inv.x===undefined) ? `<em>${t("ellipse.info.rPureMode")}</em>` : `x=<code>${inv.x}</code>`;
  $("#ellipseBody") && ($("#ellipseBody").innerHTML = `
    <p><strong>${t("ellipse.info.chainLabel")}:</strong> ${chain}</p>
    <p><strong>${t("ellipse.info.valueLabel")}:</strong> ${Number(value).toPrecision(10)}</p>
    <p><strong>${t("ellipse.info.formulaLabel")}:</strong> <code>${SI[i].formulaText}</code></p>
    <p><strong>${t("ellipse.info.inversionLabel")}:</strong> r=<code>${inv.r}</code>, ${xPart}, f(r)=<code>${inv.fx}</code></p>
    <p><strong>${t("ellipse.info.baseRadiiLabel")}:</strong> rx=<code>${Math.round(rx)}</code>, ry=<code>${Math.round(ry)}</code></p>
    <p class="notes">${t("ellipse.info.colorNote", {color})}</p>`);
  modals.ellipseDialog?.showModal();
}
function openSelectionPanel(chain){
  const dlg=modals.selectionDialog; if (!dlg) return;
  const sel = chain==="B"? selectionB : selectionA;
  if (sel.size===0){ dlg.close(); return; }
  const body=$("#selectionBody");
  const vals = getVizValuesForBarsOf(chain);
  const rows=[...sel].sort((a,b)=>a-b).map(i=>`<tr><td>${SI[i].tag}</td><td>${siNameFor(chain, i)}</td><td><code>${Number((vals[i]||0)).toPrecision(10)}</code></td></tr>`).join("");
  if (body) body.innerHTML=`<p>${t("chain.nota")}</p>
  <table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left">${t("sel.col.si")}</th><th style="text-align:left">${t("sel.col.nombre")}</th><th style="text-align:left">${t("sel.col.valor")}</th></tr></thead><tbody>${rows}</tbody></table>`;
  dlg.showModal();
}

/* Dibujo combinado A+B */
function drawEllipses(){ drawEllipsesA(); drawEllipsesB(); }

/* ===========================
   Temas + Fondo visores
   =========================== */
const THEME_KEY="cu_theme";
function syncMetaThemeColor(){
  const meta = document.getElementById("metaThemeColor");
  if (!meta) return;
  const s = getComputedStyle(document.documentElement);
  const bg = s.getPropertyValue('--bg').trim() || "#0b1120";
  meta.setAttribute("content", bg);
}
function applyTheme(theme){
  document.documentElement.setAttribute("data-theme", theme||"default");
  localStorage.setItem(THEME_KEY, theme||"default");
  syncMetaThemeColor();
}
(function initTheme(){
  const saved=localStorage.getItem(THEME_KEY)||"default";
  applyTheme(saved);
  $("#themesBtn")?.addEventListener("click", ()=>{
    const dlg=modals.themesDialog; if (!dlg) return;
    const savedNow=localStorage.getItem(THEME_KEY)||"default";
    dlg.querySelectorAll('input[name="theme"]').forEach(r=>r.checked=(r.value===savedNow));
  });
})();
/* === Menú de temas en el header (dropdown) === */
(function setupThemeDropdown(){
  const btn  = document.getElementById('btnThemesMenu');
  const menu = document.getElementById('themesMenu');
  if (!btn || !menu) return;

  const close = ()=>{ menu.classList.add('hidden'); btn.setAttribute('aria-expanded','false'); };
  const open  = ()=>{ menu.classList.remove('hidden'); btn.setAttribute('aria-expanded','true'); };

  btn.addEventListener('click', (e)=>{
    e.stopPropagation();
    menu.classList.contains('hidden') ? open() : close();
  });

  menu.querySelectorAll('.item[data-theme]').forEach(el=>{
    el.addEventListener('click', ()=>{
      const theme = el.getAttribute('data-theme');
      applyTheme(theme);
      close();
    });
  });

  // Cerrar al hacer click fuera
  document.addEventListener('click', (e)=>{
    if (!menu.contains(e.target) && e.target !== btn) close();
  });
})();

$("#applyTheme")?.addEventListener('click',()=>{
  const r=modals.themesDialog?.querySelector('input[name="theme"]:checked');
  if (r){ applyTheme(r.value); }
  modals.themesDialog?.close();
});

/* Fondos visores (A/B) */
const VIZ_KEY="cu_vizbg";
const VIZ_PRESETS={
  a:["#0b1020","#091123"],
  b:["#0b1228","#001e42"],
  c:["#171033","#0b1230"],
  d:["#001f21","#042725"]
};
function applyVizBg(code){
  const p=VIZ_PRESETS[code]||VIZ_PRESETS.a;
  document.documentElement.style.setProperty('--viz1', p[0]);
  document.documentElement.style.setProperty('--viz2', p[1]);
  localStorage.setItem(VIZ_KEY, code);
  drawBars(); drawEllipses();
}
document.querySelectorAll('[data-vizbg]').forEach(btn=>{
  btn.addEventListener('click',()=>applyVizBg(btn.getAttribute('data-vizbg')));
});
const vizBgSelect = $("#vizBgSelect");
vizBgSelect?.addEventListener("change", ()=>applyVizBg(vizBgSelect.value));
(function initVizBg(){
  const saved = localStorage.getItem(VIZ_KEY)||"a";
  applyVizBg(saved);
  if (vizBgSelect) vizBgSelect.value = saved;
})();

/* ===========================
   Arranque
   =========================== */
btnVizBars?.click();
window.addEventListener('DOMContentLoaded',()=>{
  initLang(); translatePage();

  // Construcción de UI dinámica dependiente de t()
  buildSiTable();
  buildSiTableB();
  buildTemplates();
  fillRtSelect();

  updateCounts(); recompute(); showViz("bars");
  resizeVizHeights(); setupHiDPI(cvsBars,ctxBars); setupHiDPI(cvsEllA,ctxEllA); setupHiDPI(cvsEllB,ctxEllB);
  drawBars(); drawEllipses();
  fillBodiesSelect(newtBody); fillBodiesSelect(grBody);

  updateRtPickSummary();
  migratePatternsToGlobal();
  readSiIntoRt(); // carga UI RT
  refreshBallsPatternOptions();
  updateSpeedFactorLabel();
  requestAnimationFrame(animate);
});

/* ===========================
   Animación global (A/B)
   =========================== */
function animate(t){
  const dtReal = Math.max(0, (t - lastAnimTime)/1000);
  lastAnimTime = t;
  const dt = dtReal * globalSpeedFactor;
  if(!animPaused){
    for(let i=0;i<16;i++){
      const rA=ROT[i]; if(rA.speed>0){ rA.spin = (rA.spin + rA.dir * rA.speed * dt) % TWO_PI; }
      const rB=ROT_B[i]; if(rB.speed>0){ rB.spin = (rB.spin + rB.dir * rB.speed * dt) % TWO_PI; }
      const bA=BALLS[i]; if(bA.count>0 && bA.speedDeg>0){ const d=(bA.speedDeg*DEG)*bA.dir*dt; for(let k=0;k<bA.phases.length;k++) bA.phases[k]=(bA.phases[k]+d)%TWO_PI; }
      const bB=BALLS_B[i]; if(bB.count>0 && bB.speedDeg>0){ const d=(bB.speedDeg*DEG)*bB.dir*dt; for(let k=0;k<bB.phases.length;k++) bB.phases[k]=(bB.phases[k]+d)%TWO_PI; }
    }
  }
  // Giro de mini‑elipses de PATRONES (si está activo)
  // Giro de mini‑elipses de PATRONES (por bolita; auto ó manual)
  if(!animPaused){
    for(let si=0; si<16; si++){
      // A
      ensureBallCfgLength("A", si);
      for(let j=0; j<(PAT_SPIN_PER_BALL[si]?.length||0); j++){
        const cfg = (BALL_CFG[si] && BALL_CFG[si][j]) || {};
        const pat = cfg.pattern || BALLS_PATTERN[si];
        if (!pat) continue;
        const spin = PAT_SPIN_PER_BALL[si][j];
        for(let k=0;k<16;k++){
          let speed=0, dir=1;
          if (autoPatternMotion?.checked){
            const v = clamp(pat[k]??0,-1,1);
            speed = Math.abs(v)*240*DEG;  dir = v>=0?1:-1;
          }else{
            speed = Math.max(0,(cfg.speedDeg||0)*DEG); dir = cfg.dir||1;
          }
          spin[k] = (spin[k] + dir*speed*dt) % TWO_PI;
        }
      }
      // B
      ensureBallCfgLength("B", si);
      for(let j=0; j<(PAT_SPIN_PER_BALL_B[si]?.length||0); j++){
        const cfg = (BALL_CFG_B[si] && BALL_CFG_B[si][j]) || {};
        const pat = cfg.pattern || BALLS_PATTERN_B[si];
        if (!pat) continue;
        const spin = PAT_SPIN_PER_BALL_B[si][j];
        for(let k=0;k<16;k++){
          let speed=0, dir=1;
          if (autoPatternMotion?.checked){
            const v = clamp(pat[k]??0,-1,1);
            speed = Math.abs(v)*240*DEG;  dir = v>=0?1:-1;
          }else{
            speed = Math.max(0,(cfg.speedDeg||0)*DEG); dir = cfg.dir||1;
          }
          spin[k] = (spin[k] + dir*speed*dt) % TWO_PI;
        }
      }
    }
  }

  drawEllipses();
  requestAnimationFrame(animate);
}

 /*===========================
   Ralentizar / Acelerar
   =========================== */
animSlower?.addEventListener('click',()=>{
  globalSpeedFactor = Math.max(0.05, globalSpeedFactor/1.25);
  updateSpeedFactorLabel();
});
animFaster?.addEventListener('click',()=>{
  globalSpeedFactor = Math.min(8, globalSpeedFactor*1.25);
  updateSpeedFactorLabel();
});
speedFactorApply?.addEventListener('click', ()=>{
  const v = parseFloat(speedFactorNum?.value||"1");
  if (Number.isFinite(v) && v>0){
    globalSpeedFactor = clamp(v, 0.05, 8);
    updateSpeedFactorLabel();
  }
});