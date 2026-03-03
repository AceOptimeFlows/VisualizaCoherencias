/* Conversor CU (PWA) — v4.4 DUAL

   - Segunda cadena Sᵢ (Cadena B) independiente: tabla, modos, patrones, plantillas, copiar CSV/JSON, limpiar.
   - Visor de Barras: dibuja A y/o B; si son dos, ajusta ancho por Sᵢ.
   - Visor de Elipses: dos canvas lado a lado (A y B). Pueden mostrarse uno o ambos.
   - Ajuste en tiempo real: selector de Cadena (A/B); todo actúa sobre la cadena elegida.
   - Bolitas con “patrón”: asigna un patrón guardado a las bolitas de una Sᵢ y dibuja mini‑cadena (16 mini‑elipses) alrededor de cada bolita.
   - I18N/temas intactos. 
*/

/* ===========================
   Utilidades de DOM / Básicas
   =========================== */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const FACTOR = 0.999999999999990;
// ——— Estilo determinista por “nivel” ———
// PRNG determinista (semilla entera) — Mulberry32
function seedRand(seed){
  let t = seed >>> 0;
  return function(){
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ t >>> 15, 1 | t);
    r ^= r + Math.imul(r ^ r >>> 7, 61 | r);
    return ((r ^ r >>> 14) >>> 0) / 4294967296;
  };
}

// Estilo actual (se recalcula al cambiar el nivel observado)
let LEVEL_STYLE = { seed:0, warp:0.12, twist:0, skew:0, hue:0, jitter:0 };

function updateLevelStyle(levelInt){
  // semilla estable por nivel
  const s = (levelInt|0) ^ 0x9e3779b9;
  const rnd = seedRand(s);
  LEVEL_STYLE = {
    seed: s,
    warp: 0.08 + rnd()*0.22,      // 0.08..0.30 (deformación radial extra)
    twist: (rnd()*2-1)*0.6,       // -0.6..0.6 rad (inclinación base)
    skew:  (rnd()*2-1)*0.35,      // -0.35..0.35 (escorzo rx/ry)
    hue:   Math.floor(rnd()*360), // 0..359 (desplazamiento de color)
    jitter:(rnd()*2-1)*0.12       // -0.12..0.12 (ligera variación angular por Sᵢ)
  };
}
// === [NUEVO] Nivel por cadena (A/B) y estilos por cadena ===
const CHAIN_LEVEL = { A: 0, B: 0 };

function computeStyleForLevel(levelInt){
  const s = (levelInt|0) ^ 0x9e3779b9;
  const rnd = seedRand(s);
  return {
    seed: s,
    warp: 0.08 + rnd()*0.22,
    twist: (rnd()*2-1)*0.6,
    skew:  (rnd()*2-1)*0.35,
    hue:   Math.floor(rnd()*360),
    jitter:(rnd()*2-1)*0.12
  };
}

let LEVEL_STYLE_A = computeStyleForLevel(CHAIN_LEVEL.A);
let LEVEL_STYLE_B = computeStyleForLevel(CHAIN_LEVEL.B);

function setChainLevel(chain, levelInt){
  CHAIN_LEVEL[chain] = levelInt|0;
  if (chain === "B") LEVEL_STYLE_B = computeStyleForLevel(CHAIN_LEVEL.B);
  else               LEVEL_STYLE_A = computeStyleForLevel(CHAIN_LEVEL.A);
}


/* ===========================
   i18n (ES, EN, PT-BR, CA, DE)
   (idéntico a tu archivo; se conserva tal cual)
   =========================== */
const LANG_KEY = "cu_lang";

const I18N = {

    es: {
    "meta.title": "Conversor CU · PWA",
    brand: "Conversor CU",
    "nav.escala": "Escala CU",
    "nav.calc": "Calculadora (paso a paso)",
    "nav.si": "Funciones Sᵢ",
    "nav.temas": "Temas",
    "nav.idioma": "Idioma",
    "aux.titulo": "Panel auxiliar",
    "aux.newton.titulo": "Gravedad clásica (Newton)",
    "aux.newton.cuerpo": "Cuerpo",
    "aux.newton.masa": "Masa (kg, mantisa ×10^exp)",
    "aux.newton.radio": "Radio (m)",
    "aux.newton.calc": "Calcular g",
    "aux.gr.titulo": "Relatividad general (corrección)",
    "aux.gr.cuerpo": "Cuerpo",
    "aux.gr.masa": "Masa (kg, mantisa ×10^exp)",
    "aux.gr.radio": "Radio (m)",
    "aux.gr.calc": "Calcular g",
    "aux.gr.factor": "Factor relativista:",
    "aux.math.titulo": "Matemáticas (ln)",
    "aux.math.valores": "Valores conocidos",
    "aux.math.ln": "ln(x)",
    "aux.transmutar": "Transmutar a CU",
    "aux.aplicar.actual": "→ Observado",
    "aux.aplicar.min": "→ Mínimo",
    "aux.aplicar.max": "→ Máximo",
    "modo.titulo": "Modo",
    "modo.ep": " Estructural Puro ",
    "modo.nr": " Normalizado por Referencia ",
    "modo.descripcion":
      "<strong>Estructural Puro (EP):</strong> signo automático (±) y sin recorte de magnitud.  <br><strong>Normalizado por Referencia (NR):</strong> acota el cociente a [0,1] y aplica ±0.999…990; si hay desbordes sugiere redefinir el mínimo/máximo.",
    "entradas.titulo": "Entradas",
    "entradas.obs": "Valor observado",
    "entradas.min": "Valor mínimo observado",
    "entradas.max": "Valor máximo observado",
    "entradas.cifras": "/16 cifras",
    "entradas.valores": "Valores conocidos",
    "entradas.limpiar": "Limpiar",
    "resultados.titulo": "Resultados",
    "resultados.cu": "Valor CU",
    "resultados.cuExt": "Valor CU extendido",
    "resultados.copiar": "Copiar",
    "resultados.nota":
      "En la Escala CU el <strong>0</strong> es un <em>límite asintótico inalcanzable</em>; trabajamos siempre con expresiones mínimas/máximas ±0.000…010 y ±0.999…990.",
    "si.titulo": "Funciones Sᵢ (16)",
    "si.limpiar": "Limpiar Sᵢ",
    "si.plantillas": "Plantillas",
    "si.patrones": "Patrones",
    "si.manual": " Modo manual ",
    "si.algoritmico": " Modo algorítmico ",
    "si.proyeccion": " Proyección (gráfico) ",
    "si.autoderive": " Auto‑derivaciones (S₁ y S₁₆) al visualizar ",
    "si.info": "i",
    "si.csv": "Copiar Sᵢ (CSV)",
    "si.json": "Copiar Sᵢ (JSON)",
    "si.modal.titulo": "Funciones Sᵢ",
    "si.modal.p1":
      "Las 16 Sᵢ operan simultáneamente; S₁ y S₁₆ se “cierran” al final del ciclo como referencias de base y proyección.",
    "viz.titulo": "Visualizador estructural",
    "viz.inversion": " Inversión <code>x^{1/5}</code> (clásico)",
    "viz.formulas": " Dibujar elipses por fórmula (ignorar Sᵢ)",
    "viz.info": "i",
    "viz.nota":
      "OFF ⇒ “r puro” (sin x). Usa ↑ ↓ ← → para rotar el visor 3D.",
    "viz.fondo": "Fondo visores:",
    "viz.masFondos": "Más fondos:",
    "viz.barras": "Barras",
    "viz.elipses": "Elipses",
    "viz.centrar": "Centrar",
    "viz.como": "¿Cómo funciona?",
    "viz.filtroElipses": "Elipses a dibujar:",
    "viz.filtro.all": "Todas",
    "viz.filtro.pos": "Sólo positivas",
    "viz.filtro.neg": "Sólo negativas",
    "rt.titulo": "Ajuste en tiempo real",
    "rt.sel": "Selecciona Sᵢ",
    "rt.valor": "Valor (16 cifras)",
    "rt.rapido": "Ajuste rápido",
    "rt.solo": " Mostrar Sᵢ seleccionadas ",
    "rt.elegir": "Elegir Sᵢ…",
    "rt.seleccion": "Selección actual:",
    "rt.todos": "Todos",
    "rt.ninguno": "Ninguno",
    "rt.aplicar": "Aplicar",
    "rt.revertir": "Revertir",
    "rt.nota":
      "Se refleja en Sᵢ y en ambos visores. Puedes revertir al valor previo.",
    "chain.titulo": "Cadenas (exploración)",
    "chain.comenzar": "Comenzar en",
    "chain.criterio": "Criterio",
    "chain.allpos": "Todos positivos",
    "chain.allneg": "Todos negativos",
    "chain.posexcept": "Positivos excepto ≤k",
    "chain.negexcept": "Negativos excepto ≤k",
    "chain.excepciones": "Excepciones (k)",
    "chain.resolucion": "Resolución búsqueda",
    "chain.paso": "Paso: ",
    "chain.buscar": "Buscar",
    "chain.hallazgo": "Hallazgo",
    "chain.transmutar": "Transmutar a Sᵢ",
    "chain.nota":
      "Shift‑click en el visor para selección múltiple de elipses.",
    "chain.nohits":
      "Sin hallazgos con el criterio/resolución actual.",
    "cu.titulo": "Escala CU (resumen didáctico)",
    "cu.p1":
      "<strong>Centro estructural (Cₛ):</strong> <code>0.000000000000000</code> es un límite ideal <em>inalcanzable</em>; todo lo medible orbita ese centro y se expresa en el rango operativo ±0.000…010 ↔ ±0.999…990.",
    "cu.p2":
      "<strong>Conversión CU:</strong> <code>(Obs − Mín) / (Máx − Mín) × (±0.999…990)</code>. El signo (±) se selecciona automáticamente según pertenencia al rango.",
    "cu.p3": "<strong>Modos:</strong> EP (sin recorte); NR (acota a [0,1] y aplica ±0.999…990).",
    "cu.p4":
      "<strong>Lectura fractal:</strong> cada decimal es una “capa” y puede contener una escala completa anidada.",
    "calc.titulo": "Calculadora (paso a paso)",
    "calc.s1":
      "Introduce Observado/Mín/Máx con exactamente <strong>16 cifras</strong> (no cuentan signo ni punto). Último decimal “0”.",
    "calc.s2":
      "Elije <em>EP</em> o <em>NR</em>. El factor visual (±0.999…990) se decide solo.",
    "calc.s3":
      "Lee <strong>Valor CU</strong> y <strong>CU ext.</strong> (GMS: <code>toFixed(14)+\"0\"</code> y <code>toFixed(28)+\"0\"</code>).",
    "const.titulo": "Valores conocidos",
    "comunes.cerrar": "Cerrar",
    "comunes.aplicar": "Aplicar",
    "comunes.cargar": "Cargar",
    "comunes.eliminar": "Eliminar",
    "comunes.aplicarNombres": "Aplicar nombres",
    "footer.instalar": "Instalar PWA",
    version: "v4.0",

    // === Footer / legales (alias que usas en el HTML) ===
    "footer.license": "Licencia (MIT)",
    "footer.privacy": "Políticas de privacidad",

    // Licencia MIT (claves “legal.*” originales)
    "legal.license.title": "Licencia MIT",
    "legal.license.copy": "Copiar",
    "legal.license.close": "Cerrar",
    "legal.license.body": `MIT License

Copyright (c) {{year}} {{author}}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`,

    // Privacidad (claves “legal.*” originales)
    "legal.privacy.title": "Políticas de privacidad",
    "legal.privacy.close": "Cerrar",
    "legal.privacy.body": `<p><b>{{app}}</b> se ejecuta 100&nbsp;% en tu navegador. No enviamos tus datos a ningún servidor.</p>
<ul>
  <li><b>Datos que maneja:</b> (a) entradas/valores que introduces, (b) patrones/plantillas y ajustes guardados localmente (IndexedDB/LocalStorage), (c) preferencias de interfaz (tema, idioma, filtros, modo).</li>
  <li><b>Control local:</b> puedes <b>exportar</b> o <b>vaciar la base local</b> cuando quieras. Nada se borra fuera de tu dispositivo.</li>
  <li><b>Cookies:</b> no usamos cookies de seguimiento ni analítica.</li>
  <li><b>Seguridad:</b> tus datos permanecen en tu equipo. Evita introducir material sensible en dispositivos compartidos.</li>
  <li><b>Licencia y descargo:</b> el software se ofrece “tal cual”, sin garantías.</li>
</ul>
<p><b>Autor:</b> {{author}}.<br/>Última actualización: {{updated}}.</p>`,

    // === Alias para que coincidan con tu HTML (license.* y privacy.*) ===
    "license.titulo": "Licencia MIT",
    "license.cuerpo": `MIT License

Copyright (c) {{year}} {{author}}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...`,

    "privacy.titulo": "Política de privacidad",
    "privacy.cuerpo": `<p><b>{{app}}</b> se ejecuta 100&nbsp;% en tu navegador...`
  },

  en: {
    "meta.title": "CU Converter · PWA",
    brand: "CU Converter",
    "nav.escala": "CU Scale",
    "nav.calc": "Step‑by‑step Calculator",
    "nav.si": "Sᵢ Functions",
    "nav.temas": "Themes",
    "nav.idioma": "Language",

    "aux.titulo": "Auxiliary panel",
    "aux.newton.titulo": "Classical Gravity (Newton)",
    "aux.newton.cuerpo": "Body",
    "aux.newton.masa": "Mass (kg, mantissa ×10^exp)",
    "aux.newton.radio": "Radius (m)",
    "aux.newton.calc": "Compute g",
    "aux.gr.titulo": "General Relativity (correction)",
    "aux.gr.cuerpo": "Body",
    "aux.gr.masa": "Mass (kg, mantissa ×10^exp)",
    "aux.gr.radio": "Radius (m)",
    "aux.gr.calc": "Compute g",
    "aux.gr.factor": "Relativistic factor:",
    "aux.math.titulo": "Mathematics (ln)",
    "aux.math.valores": "Known values",
    "aux.math.ln": "ln(x)",
    "aux.transmutar": "Transmute to CU",
    "aux.aplicar.actual": "→ Observed",
    "aux.aplicar.min": "→ Minimum",
    "aux.aplicar.max": "→ Maximum",

    "modo.titulo": "Mode",
    "modo.ep": " Pure Structural ",
    "modo.nr": " Reference‑Normalized ",
    "modo.descripcion":
      "<strong>Pure Structural (EP):</strong> automatic sign (±), no magnitude clipping.  <br><strong>Reference‑Normalized (NR):</strong> clamps the ratio to [0,1] and applies ±0.999…990; on overflow it suggests redefining min/max.",

    "entradas.titulo": "Inputs",
    "entradas.obs": "Observed value",
    "entradas.min": "Minimum observed value",
    "entradas.max": "Maximum observed value",
    "entradas.cifras": "/16 digits",
    "entradas.valores": "Known values",
    "entradas.limpiar": "Clear",

    "resultados.titulo": "Results",
    "resultados.cu": "CU value",
    "resultados.cuExt": "Extended CU value",
    "resultados.copiar": "Copy",
    "resultados.nota":
      "On the CU Scale, <strong>0</strong> is an <em>unreachable asymptotic limit</em>; we always use ±0.000…010 and ±0.999…990.",

    "si.titulo": "Sᵢ functions (16)",
    "si.limpiar": "Clear Sᵢ",
    "si.plantillas": "Templates",
    "si.patrones": "Patterns",
    "si.manual": " Manual mode ",
    "si.algoritmico": " Algorithmic mode ",
    "si.proyeccion": " Projection (chart) ",
    "si.autoderive": " Auto‑derivations (S₁ & S₁₆) on view ",
    "si.info": "i",
    "si.csv": "Copy Sᵢ (CSV)",
    "si.json": "Copy Sᵢ (JSON)",
    "si.modal.titulo": "Sᵢ Functions",
    "si.modal.p1":
      "The 16 Sᵢ operate simultaneously; S₁ and S₁₆ close the cycle as base/projection references.",

    "viz.titulo": "Structural viewer",
    "viz.inversion": " Inversion <code>x^{1/5}</code> (classic)",
    "viz.formulas": " Draw formula ellipses (ignore Sᵢ values)",

    "viz.info": "i",
    "viz.nota":
      "OFF ⇒ “pure r” (no x). Use ↑ ↓ ← → to rotate the 3D viewer.",
    "viz.fondo": "Viewers background:",
    "viz.masFondos": "More backgrounds:",
    "viz.barras": "Bars",
    "viz.elipses": "Ellipses",
    "viz.centrar": "Center",
    "viz.como": "How it works?",
    "viz.filtroElipses": "Ellipses to draw:",
    "viz.filtro.all": "All",
    "viz.filtro.pos": "Only positive",
    "viz.filtro.neg": "Only negative",

    "rt.titulo": "Real‑time adjustment",
    "rt.sel": "Pick Sᵢ",
    "rt.valor": "Value (16 digits)",
    "rt.rapido": "Quick adjust",
    "rt.solo": " Show selected Sᵢ ",
    "rt.elegir": "Pick Sᵢ…",
    "rt.seleccion": "Current selection:",
    "rt.todos": "All",
    "rt.ninguno": "None",
    "rt.aplicar": "Apply",
    "rt.revertir": "Revert",
    "rt.nota":
      "Affects Sᵢ and both viewers. You can revert to the previous value.",

    "chain.titulo": "Chains (exploration)",
    "chain.comenzar": "Start at",
    "chain.criterio": "Criterion",
    "chain.allpos": "All positive",
    "chain.allneg": "All negative",
    "chain.posexcept": "Positive except ≤k",
    "chain.negexcept": "Negative except ≤k",
    "chain.excepciones": "Exceptions (k)",
    "chain.resolucion": "Search resolution",
    "chain.paso": "Step: ",
    "chain.buscar": "Search",
    "chain.hallazgo": "Finding",
    "chain.transmutar": "Transmute to Sᵢ",
    "chain.nota":
      "Shift‑click in the viewer for multi‑ellipse selection.",
    "chain.nohits": "No findings with current criterion/resolution.",

    "cu.titulo": "CU Scale (didactic summary)",
    "cu.p1":
      "<strong>Structural center (Cₛ):</strong> <code>0.000000000000000</code> is an <em>unreachable</em> ideal limit; measurements orbit this center within ±0.000…010 ↔ ±0.999…990.",
    "cu.p2":
      "<strong>CU conversion:</strong> <code>(Obs − Min) / (Max − Min) × (±0.999…990)</code>. The sign (±) is chosen automatically.",
    "cu.p3":
      "<strong>Modes:</strong> EP (no clipping); NR (clamps to [0,1] and applies ±0.999…990).",
    "cu.p4":
      "<strong>Fractal reading:</strong> each decimal is a “layer” that can host a full nested scale.",

    "calc.titulo": "Step‑by‑step Calculator",
    "calc.s1":
      "Enter Observed/Min/Max with exactly <strong>16 digits</strong> (sign and dot don’t count). Last decimal “0”.",
    "calc.s2":
      "Choose <em>EP</em> or <em>NR</em>. Visual factor (±0.999…990) is auto‑decided.",
    "calc.s3":
      "Read <strong>CU value</strong> and <strong>Extended CU</strong> (GMS format: <code>toFixed(14)+\"0\"</code> and <code>toFixed(28)+\"0\"</code>).",

    "const.titulo": "Known values",
    "comunes.cerrar": "Close",
    "comunes.aplicar": "Apply",
    "comunes.cargar": "Load",
    "comunes.eliminar": "Delete",
    "comunes.aplicarNombres": "Apply names",
    "footer.instalar": "Install PWA",
    version: "v4.0",

    "temas.titulo": "Themes",
    "temas.default": "Default",
    "temas.ocean": "Ocean",
    "temas.forest": "Forest",
    "temas.amethyst": "Amethyst",
    "temas.sunrise": "Sunrise (light)",
    "temas.frost": "Frost (light)",
    "temas.sand": "Sand (light)",
    "temas.graphite": "Graphite (high contrast)",
    "temas.nota": "Theme is stored on this device.",

    "idioma.titulo": "Language",
    "idioma.nota":
      "On apply, all interface texts (labels, buttons, messages, notes) change to the selected language.",

    "plantillas.titulo": "Templates",
    "patrones.titulo": "Patterns",
    "patrones.placeholder": "Pattern name (optional)",
    "patrones.guardar": "Save now",
    "patrones.csv": "Export CSV",
    "patrones.json": "Export JSON",
    "patterns.empty": "No saved patterns.",

    "inv.titulo": "Inversion: x^{1/5} vs pure r",
    "inv.p1":
      "<strong>What does <code>x^{1/5}</code> do?</strong> it projects the desired value as <em>x</em>∈(0,1] via <code>x^{1/5}</code> within the Sᵢ family (smooth fractal contraction).",
    "inv.p2":
      "<strong>OFF (“pure r”):</strong> searches an <em>r</em> such that <code>f(r)≈value</code> without forcing <em>x</em>.",

    "errors.16digits":
      "Complete all three fields with exactly 16 digits (excluding sign and dot).",
    "errors.invalid": "Invalid inputs.",
    "errors.maxgtmin": "Max must be greater than Min.",
    "warn.swapMin":
      "Observed is below Min. If correct, use it as the new minimum: swap “Observed” with “Min” and recalc.",
    "warn.swapMax":
      "Observed exceeds Max. If correct, use it as the new maximum: swap “Observed” with “Max” and recalc."
  },
  "pt-BR": {
    "meta.title": "Conversor CU · PWA",
    brand: "Conversor CU",
    "nav.escala": "Escala CU",
    "nav.calc": "Calculadora (passo a passo)",
    "nav.si": "Funções Sᵢ",
    "nav.temas": "Temas",
    "nav.idioma": "Idioma",
    "aux.titulo": "Painel auxiliar",
    "aux.newton.titulo": "Gravidade clássica (Newton)",
    "aux.newton.cuerpo": "Corpo",
    "aux.newton.masa": "Massa (kg, mantissa ×10^exp)",
    "aux.newton.radio": "Raio (m)",
    "aux.newton.calc": "Calcular g",
    "aux.gr.titulo": "Relatividade geral (correção)",
    "aux.gr.cuerpo": "Corpo",
    "aux.gr.masa": "Massa (kg, mantissa ×10^exp)",
    "aux.gr.radio": "Raio (m)",
    "aux.gr.calc": "Calcular g",
    "aux.gr.factor": "Fator relativístico:",
    "aux.math.titulo": "Matemática (ln)",
    "aux.math.valores": "Valores conhecidos",
    "aux.math.ln": "ln(x)",
    "aux.transmutar": "Transmutar para CU",
    "aux.aplicar.actual": "→ Observado",
    "aux.aplicar.min": "→ Mínimo",
    "aux.aplicar.max": "→ Máximo",

    "modo.titulo": "Modo",
    "modo.ep": " Estrutural Puro ",
    "modo.nr": " Normalizado por Referência ",
    "modo.descripcion":
      "<strong>Estrutural Puro (EP):</strong> sinal automático (±) sem corte de magnitude.  <br><strong>Normalizado por Referência (NR):</strong> limita o quociente a [0,1] e aplica ±0.999…990; se houver estouro, sugere redefinir mín/máx.",

    "entradas.titulo": "Entradas",
    "entradas.obs": "Valor observado",
    "entradas.min": "Valor mínimo observado",
    "entradas.max": "Valor máximo observado",
    "entradas.cifras": "/16 dígitos",
    "entradas.valores": "Valores conhecidos",
    "entradas.limpiar": "Limpar",

    "resultados.titulo": "Resultados",
    "resultados.cu": "Valor CU",
    "resultados.cuExt": "Valor CU estendido",
    "resultados.copiar": "Copiar",
    "resultados.nota":
      "Na Escala CU o <strong>0</strong> é um <em>limite assintótico inalcançável</em>; usamos sempre ±0.000…010 e ±0.999…990.",

    "si.titulo": "Funções Sᵢ (16)",
    "si.limpiar": "Limpar Sᵢ",
    "si.plantillas": "Modelos",
    "si.patrones": "Padrões",
    "si.manual": " Modo manual ",
    "si.algoritmico": " Modo algorítmico ",
    "si.proyeccion": " Projeção (gráfico) ",
    "si.autoderive": " Auto‑derivações (S₁ e S₁₆) ao visualizar ",
    "si.info": "i",
    "si.csv": "Copiar Sᵢ (CSV)",
    "si.json": "Copiar Sᵢ (JSON)",
    "si.modal.titulo": "Funções Sᵢ",
    "si.modal.p1":
      "As 16 Sᵢ operam simultaneamente; S₁ e S₁₆ fecham o ciclo como referências de base/projeção.",

    "viz.titulo": "Visualizador estrutural",
    "viz.inversion": " Inversão <code>x^{1/5}</code> (clássico)",
    "viz.formulas": " Desenhar elipses por fórmula (ignorar Sᵢ)",

    "viz.info": "i",
    "viz.nota":
      "OFF ⇒ “r puro” (sem x). Use ↑ ↓ ← → para girar o visor 3D.",
    "viz.fondo": "Fundo dos visores:",
    "viz.masFondos": "Mais fundos:",
    "viz.barras": "Barras",
    "viz.elipses": "Elipses",
    "viz.centrar": "Centralizar",
    "viz.como": "Como funciona?",
    "viz.filtroElipses": "Elipses a desenhar:",
    "viz.filtro.all": "Todas",
    "viz.filtro.pos": "Somente positivas",
    "viz.filtro.neg": "Somente negativas",

    "rt.titulo": "Ajuste em tempo real",
    "rt.sel": "Selecione Sᵢ",
    "rt.valor": "Valor (16 dígitos)",
    "rt.rapido": "Ajuste rápido",
    "rt.solo": " Mostrar Sᵢ selecionadas ",
    "rt.elegir": "Escolher Sᵢ…",
    "rt.seleccion": "Seleção atual:",
    "rt.todos": "Todos",
    "rt.ninguno": "Nenhum",
    "rt.aplicar": "Aplicar",
    "rt.revertir": "Reverter",
    "rt.nota":
      "Reflete em Sᵢ e em ambos os visores. Você pode reverter ao valor anterior.",

    "chain.titulo": "Cadeias (exploração)",
    "chain.comenzar": "Começar em",
    "chain.criterio": "Critério",
    "chain.allpos": "Todos positivos",
    "chain.allneg": "Todos negativos",
    "chain.posexcept": "Positivos exceto ≤k",
    "chain.negexcept": "Negativos excepto ≤k",
    "chain.excepciones": "Exceções (k)",
    "chain.resolucion": "Resolução da busca",
    "chain.paso": "Passo: ",
    "chain.buscar": "Buscar",
    "chain.hallazgo": "Achado",
    "chain.transmutar": "Transmutar para Sᵢ",
    "chain.nota":
      "Shift‑click no visor para seleção múltipla de elipses.",
    "chain.nohits": "Sem achados com o critério/resolução atual.",

    "cu.titulo": "Escala CU (resumo didático)",
    "cu.p1":
      "<strong>Centro estrutural (Cₛ):</strong> <code>0.000000000000000</code> é um limite ideal <em>inalcançável</em>…",
    "cu.p2":
      "<strong>Conversão CU:</strong> <code>(Obs − Mín) / (Máx − Mín) × (±0.999…990)</code>.",
    "cu.p3": "<strong>Modos:</strong> EP; NR.",
    "cu.p4":
      "<strong>Leitura fractal:</strong> cada decimal é uma “camada” que pode conter uma escala aninhada.",

    "calc.titulo": "Calculadora (passo a passo)",
    "calc.s1":
      "Informe Observado/Mín/Máx com exatamente <strong>16 dígitos</strong>…",
    "calc.s2":
      "Escolha <em>EP</em> ou <em>NR</em>. O fator visual é decidido automaticamente.",
    "calc.s3":
      "Leia <strong>Valor CU</strong> e <strong>CU ext.</strong>…",

    "const.titulo": "Valores conhecidos",
    "comunes.cerrar": "Fechar",
    "comunes.aplicar": "Aplicar",
    "comunes.cargar": "Carregar",
    "comunes.eliminar": "Excluir",
    "comunes.aplicarNombres": "Aplicar nomes",
    "footer.instalar": "Instalar PWA",
    version: "v4.0",

    "temas.titulo": "Temas",
    "temas.default": "Padrão",
    "temas.ocean": "Oceano",
    "temas.forest": "Floresta",
    "temas.amethyst": "Ametista",
    "temas.sunrise": "Amanhecer (claro)",
    "temas.frost": "Geada (claro)",
    "temas.sand": "Areia (claro)",
    "temas.graphite": "Grafite (alto contraste)",
    "temas.nota": "O tema é salvo neste dispositivo.",

    "idioma.titulo": "Idioma",
    "idioma.nota":
      "Ao aplicar, toda a interface muda para o idioma selecionado.",

    "plantillas.titulo": "Modelos",
    "patrones.titulo": "Padrões",
    "patrones.placeholder": "Nome do padrão (opcional)",
    "patrones.guardar": "Salvar agora",
    "patrones.csv": "Exportar CSV",
    "patrones.json": "Exportar JSON",
    "patterns.empty": "Não há padrões salvos.",

    "inv.titulo": "Inversão: x^{1/5} vs r puro",
    "inv.p1":
      "<strong>O que faz <code>x^{1/5}</code>?</strong> projeta o valor desejado como <em>x</em>∈(0,1] via <code>x^{1/5}</code> na família Sᵢ.",
    "inv.p2":
      "<strong>OFF (“r puro”):</strong> busca um <em>r</em> tal que <code>f(r)≈valor</code> sem impor <em>x</em>.",

    "errors.16digits":
      "Complete os três campos com exatamente 16 dígitos (sem sinal e ponto).",
    "errors.invalid": "Entradas inválidas.",
    "errors.maxgtmin": "Máximo deve ser maior que Mínimo.",
    "warn.swapMin":
      "Observado é menor que o mínimo. Se correto, use como novo mínimo: troque “Observado” por “Mínimo” e recalcule.",
    "warn.swapMax":
      "Observado excede o máximo. Se correto, use como novo máximo: troque “Observado” por “Máximo” e recalcule."
  },
  ca: {
    "meta.title": "Convertidor CU · PWA",
    brand: "Convertidor CU",
    "nav.escala": "Escala CU",
    "nav.calc": "Calculadora (pas a pas)",
    "nav.si": "Funcions Sᵢ",
    "nav.temas": "Temes",
    "nav.idioma": "Idioma",

    "aux.titulo": "Panell auxiliar",
    "aux.newton.titulo": "Gravetat clàssica (Newton)",
    "aux.newton.cuerpo": "Cos",
    "aux.newton.masa": "Massa (kg, mantissa ×10^exp)",
    "aux.newton.radio": "Radi (m)",
    "aux.newton.calc": "Calcular g",
    "aux.gr.titulo": "Relativitat general (correcció)",
    "aux.gr.cuerpo": "Cos",
    "aux.gr.masa": "Massa (kg, mantissa ×10^exp)",
    "aux.gr.radio": "Radi (m)",
    "aux.gr.calc": "Calcular g",
    "aux.gr.factor": "Factor relativista:",
    "aux.math.titulo": "Matemàtiques (ln)",
    "aux.math.valores": "Valors coneguts",
    "aux.math.ln": "ln(x)",
    "aux.transmutar": "Transmutar a CU",
    "aux.aplicar.actual": "→ Observat",
    "aux.aplicar.min": "→ Mínim",
    "aux.aplicar.max": "→ Màxim",

    "modo.titulo": "Mode",
    "modo.ep": " Estructural Pur ",
    "modo.nr": " Normalitzat per Referència ",
    "modo.descripcion":
      "<strong>Estructural Pur (EP):</strong> signe automàtic (±) i sense retall.  <br><strong>Normalitzat per Referència (NR):</strong> limita el quocient a [0,1] i aplica ±0.999…990; si hi ha desbordaments, proposa redefinir mín/màx.",

    "entradas.titulo": "Entrades",
    "entradas.obs": "Valor observat",
    "entradas.min": "Valor mínim observat",
    "entradas.max": "Valor màxim observat",
    "entradas.cifras": "/16 xifres",
    "entradas.valores": "Valors coneguts",
    "entradas.limpiar": "Netejar",

    "resultados.titulo": "Resultats",
    "resultados.cu": "Valor CU",
    "resultados.cuExt": "Valor CU estès",
    "resultados.copiar": "Copiar",
    "resultados.nota":
      "A l’Escala CU el <strong>0</strong> és un <em>límit asimptòtic inabastable</em>; fem servir sempre ±0.000…010 i ±0.999…990.",

    "si.titulo": "Funcions Sᵢ (16)",
    "si.limpiar": "Netejar Sᵢ",
    "si.plantillas": "Plantilles",
    "si.patrones": "Patrons",
    "si.manual": " Mode manual ",
    "si.algoritmic": " Mode algorísmic ",
    "si.proyeccion": " Projecció (gràfic) ",
    "si.autoderive": " Auto‑derivacions (S₁ i S₁₆) al visualitzar ",
    "si.info": "i",
    "si.csv": "Copiar Sᵢ (CSV)",
    "si.json": "Copiar Sᵢ (JSON)",
    "si.modal.titulo": "Sᵢ",
    "si.modal.p1":
      "Les 16 Sᵢ operen simultàniament; S₁ i S₁₆ tanquen el cicle com a referències de base/projecció.",

    "viz.titulo": "Visualitzador estructural",
    "viz.inversion": " Inversió <code>x^{1/5}</code> (clàssic)",
    "viz.formulas": " Dibuixar el·lipses per fórmula (ignorar Sᵢ)",

    "viz.info": "i",
    "viz.nota":
      "OFF ⇒ “r pur” (sense x). Fes servir ↑ ↓ ← → per girar el visor 3D.",
    "viz.fondo": "Fons dels visors:",
    "viz.masFondos": "Més fons:",
    "viz.barras": "Barres",
    "viz.elipses": "El·lipses",
    "viz.centrar": "Centrar",
    "viz.como": "Com funciona?",
    "viz.filtroElipses": "El·lipses a dibuixar:",
    "viz.filtro.all": "Totes",
    "viz.filtro.pos": "Només positives",
    "viz.filtro.neg": "Només negatives",

    "rt.titulo": "Ajust en temps real",
    "rt.sel": "Selecciona Sᵢ",
    "rt.valor": "Valor (16 xifres)",
    "rt.rapido": "Ajust ràpid",
    "rt.solo": " Mostrar Sᵢ seleccionades ",
    "rt.elegir": "Triar Sᵢ…",
    "rt.seleccion": "Selecció actual:",
    "rt.todos": "Totes",
    "rt.ninguno": "Cap",
    "rt.aplicar": "Aplicar",
    "rt.revertir": "Revertir",
    "rt.nota":
      "Es reflecteix en Sᵢ y en ambdós visors. Pots revertir al valor previ.",

    "chain.titulo": "Cadenes (exploració)",
    "chain.comenzar": "Començar a",
    "chain.criterio": "Criteri",
    "chain.allpos": "Tots positius",
    "chain.allneg": "Tots negatius",
    "chain.posexcept": "Positius excepte ≤k",
    "chain.negexcept": "Negatius excepte ≤k",
    "chain.excepciones": "Excepcions (k)",
    "chain.resolucion": "Resolució de cerca",
    "chain.paso": "Pas: ",
    "chain.buscar": "Cercar",
    "chain.hallazgo": "Trobada",
    "chain.transmutar": "Transmutar a Sᵢ",
    "chain.nota":
      "Shift‑click al visor per a selecció múltiple d’el·lipses.",
    "chain.nohits": "Sense troballes amb el criteri/resolució actual.",

    "cu.titulo": "Escala CU (resum didàctic)",
    "cu.p1":
      "<strong>Centre estructural (Cₛ):</strong> <code>0.000000000000000</code> és un límit ideal <em>inabastable</em>…",
    "cu.p2":
      "<strong>Conversió CU:</strong> <code>(Obs − Mín) / (Màx − Mín) × (±0.999…990)</code>.",
    "cu.p3": "<strong>Modes:</strong> EP; NR.",
    "cu.p4":
      "<strong>Lectura fractal:</strong> cada decimal pot contenir una escala anidada.",

    "calc.titulo": "Calculadora (pas a pas)",
    "calc.s1":
      "Introdueix Observat/Mín/Màx amb exactament <strong>16 xifres</strong>…",
    "calc.s2":
      "Tria <em>EP</em> o <em>NR</em>. El factor visual és automàtic.",
    "calc.s3":
      "Llegeix <strong>Valor CU</strong> i <strong>CU ext.</strong>…",

    "const.titulo": "Valors coneguts",
    "comunes.cerrar": "Tancar",
    "comunes.aplicar": "Aplicar",
    "comunes.cargar": "Carregar",
    "comunes.eliminar": "Eliminar",
    "comunes.aplicarNombres": "Aplicar noms",
    "footer.instalar": "Instal·lar PWA",
    version: "v4.0",

    "temas.titulo": "Temes",
    "temas.default": "Predeterminat",
    "temas.ocean": "Oceà",
    "temas.forest": "Bosc",
    "temas.amethyst": "Ametista",
    "temas.sunrise": "Albada (clar)",
    "temas.frost": "Gebre (clar)",
    "temas.sand": "Sorra (clar)",
    "temas.graphite": "Grafit (alt contrast)",
    "temas.nota":
      "El tema es desa en aquest dispositiu.",

    "idioma.titulo": "Idioma",
    "idioma.nota":
      "En aplicar, tota la interfície canviarà a l’idioma seleccionat.",

    "plantillas.titulo": "Plantilles",
    "patrones.titulo": "Patrons",
    "patrones.placeholder": "Nom del patró (opcional)",
    "patrones.guardar": "Desar ara",
    "patrones.csv": "Exportar CSV",
    "patrones.json": "Exportar JSON",
    "patterns.empty": "No hi ha patrons desats.",

    "inv.titulo": "Inversió: x^{1/5} vs r puro",
    "inv.p1":
      "<strong>Què fa <code>x^{1/5}</code>?</strong>…",
    "inv.p2":
      "<strong>OFF (“r puro”):</strong>…",

    "errors.16digits":
      "Completa els tres camps amb exactament 16 xifres (sense signe ni punt).",
    "errors.invalid": "Entrades no vàlides.",
    "errors.maxgtmin": "El màxim ha de ser més gran que el mínim.",
    "warn.swapMin":
      "L’observat és inferior al mínim…",
    "warn.swapMax":
      "L’observat supera el màxim…"
  },
  de: {
    "meta.title": "CU‑Konverter · PWA",
    brand: "CU‑Konverter",
    "nav.escala": "CU‑Skala",
    "nav.calc": "Rechner (Schritt für Schritt)",
    "nav.si": "Sᵢ‑Funktionen",
    "nav.temas": "Themen",
    "nav.idioma": "Sprache",
    "aux.titulo": "Hilfspanel",
    "aux.newton.titulo": "Klassische Gravitation (Newton)",
    "aux.newton.cuerpo": "Körper",
    "aux.newton.masa": "Masse (kg, Mantisse ×10^exp)",
    "aux.newton.radio": "Radius (m)",
    "aux.newton.calc": "g berechnen",
    "aux.gr.titulo": "Allgemeine Relativität (Korrektur)",
    "aux.gr.cuerpo": "Körper",
    "aux.gr.masa": "Masse (kg, Mantisse ×10^exp)",
    "aux.gr.radio": "Radius (m)",
    "aux.gr.calc": "g berechnen",
    "aux.gr.factor": "Relativistischer Faktor:",
    "aux.math.titulo": "Matematik (ln)",
    "aux.math.valores": "Bekannte Werte",
    "aux.math.ln": "ln(x)",
    "aux.transmutar": "In CU übertragen",
    "aux.aplicar.actual": "→ Beobachtet",
    "aux.aplicar.min": "→ Minimum",
    "aux.aplicar.max": "→ Maximum",

    "modo.titulo": "Modus",
    "modo.ep": " Reine Struktur ",
    "modo.nr": " Referenz‑normalisiert ",
    "modo.descripcion":
      "<strong>Reine Struktur (EP):</strong> automatisches Vorzeichen (±), kein Clipping.  <br><strong>Referenz‑normalisiert (NR):</strong> klemmt auf [0,1] und wendet ±0.999…990 an.",

    "entradas.titulo": "Eingaben",
    "entradas.obs": "Beobachteter Wert",
    "entradas.min": "Minimaler beobachteter Wert",
    "entradas.max": "Maximaler beobachteter Wert",
    "entradas.cifras": "/16 Ziffern",
    "entradas.valores": "Bekannte Werte",
    "entradas.limpiar": "Leeren",

    "resultados.titulo": "Ergebnisse",
    "resultados.cu": "CU‑Wert",
    "resultados.cuExt": "Erweiterter CU‑Wert",
    "resultados.copiar": "Kopieren",
    "resultados.nota":
      "Auf der CU‑Skala ist <strong>0</strong> eine <em>unerreichbare asymptotische Grenze</em>…",

    "si.titulo": "Sᵢ‑Funktionen (16)",
    "si.limpiar": "Sᵢ leeren",
    "si.plantillas": "Vorlagen",
    "si.patrones": "Muster",
    "si.manual": " Manueller Modus ",
    "si.algoritmico": " Algorithmischer Modus ",
    "si.proyeccion": " Projektion (Diagramm) ",
    "si.autoderive": " Auto‑Ableitungen (S₁ & S₁₆) bei Ansicht ",
    "si.info": "i",
    "si.csv": "Sᵢ kopieren (CSV)",
    "si.json": "Sᵢ kopieren (JSON)",
    "si.modal.titulo": "Sᵢ‑Funktionen",
    "si.modal.p1":
      "Die 16 Sᵢ wirken gleichzeitig; S₁ und S₁₆ schließen den Zyklus ab.",

    "viz.titulo": "Struktur‑Viewer",
    "viz.inversion": " Inversion <code>x^{1/5}</code> (klassisch)",
    "viz.formulas": " Formel‑Ellipsen zeichnen (Sᵢ‑Werte ignorieren)",

    "viz.info": "i",
    "viz.nota":
      "OFF ⇒ „reines r“ (ohne x). Mit ↑ ↓ ← → den 3D‑Viewer drehen.",
    "viz.fondo": "Viewer‑Hintergrund:",
    "viz.masFondos": "Weitere Hintergründe:",
    "viz.barras": "Balken",
    "viz.elipses": "Ellipsen",
    "viz.centrar": "Zentrieren",
    "viz.como": "Wie funktioniert’s?",
    "viz.filtroElipses": "Zu zeichnende Ellipsen:",
    "viz.filtro.all": "Alle",
    "viz.filtro.pos": "Nur positive",
    "viz.filtro.neg": "Nur negative",

    "rt.titulo": "Echtzeit‑Anpassung",
    "rt.sel": "Sᵢ wählen",
    "rt.valor": "Wert (16 Ziffern)",
    "rt.rapido": "Schnell‑Anpassung",
    "rt.solo": " Ausgewählte Sᵢ anzeigen ",
    "rt.elegir": "Sᵢ wählen…",
    "rt.seleccion": "Aktuelle Auswahl:",
    "rt.todos": "Alle",
    "rt.ninguno": "Keine",
    "rt.aplicar": "Anwenden",
    "rt.revertir": "Rückgängig",
    "rt.nota":
      "Wirkt auf Sᵢ und beide Viewer. Rückgängig möglich.",

    "chain.titulo": "Ketten (Erkundung)",
    "chain.comenzar": "Start bei",
    "chain.criterio": "Kriterium",
    "chain.allpos": "Alle positiv",
    "chain.allneg": "Alle negativ",
    "chain.posexcept": "Positiv außer ≤k",
    "chain.negexcept": "Negativ außer ≤k",
    "chain.excepciones": "Ausnahmen (k)",
    "chain.resolucion": "Suchauflösung",
    "chain.paso": "Schritt: ",
    "chain.buscar": "Suchen",
    "chain.hallazgo": "Fund",
    "chain.transmutar": "In Sᵢ übertragen",
    "chain.nota":
      "Shift‑Klick im Viewer für Mehrfachauswahl.",
    "chain.nohits":
      "Keine Funde mit aktuellem Kriterium/Auflösung.",

    "cu.titulo": "CU‑Skala (didaktische Zusammenfassung)",
    "cu.p1": "<strong>Strukturelles Zentrum (Cₛ)…</strong>",
    "cu.p2": "<strong>CU‑Umrechnung:</strong> …",
    "cu.p3": "<strong>Modi:</strong> EP; NR.",
    "cu.p4": "<strong>Fraktale Lesart:</strong> …",

    "calc.titulo": "Rechner (Schritt für Schritt)",
    "calc.s1": "Gib Beob./Min/Max mit genau <strong>16 Ziffern</strong> ein…",
    "calc.s2": "Wähle <em>EP</em> oder <em>NR</em>. Faktor automatisch.",
    "calc.s3": "Lies <strong>CU‑Wert</strong> und <strong>CU‑erweitert</strong>…",

    "const.titulo": "Bekannte Werte",
    "comunes.cerrar": "Schließen",
    "comunes.aplicar": "Anwenden",
    "comunes.cargar": "Laden",
    "comunes.eliminar": "Löschen",
    "comunes.aplicarNombres": "Namen anwenden",
    "footer.instalar": "PWA installieren",
    version: "v4.0",

    "temas.titulo": "Themen",
    "temas.default": "Standard",
    "temas.ocean": "Ozean",
    "temas.forest": "Wald",
    "temas.amethyst": "Amethyst",
    "temas.sunrise": "Sonnenaufgang (hell)",
    "temas.frost": "Frost (hell)",
    "temas.sand": "Sand (hell)",
    "temas.graphite": "Graphit (hoher Kontrast)",
    "temas.nota": "Thema wird lokal gespeichert.",

    "idioma.titulo": "Sprache",
    "idioma.nota":
      "Beim Anwenden wird die gesamte Oberfläche übersetzt.",

    "plantillas.titulo": "Vorlagen",
    "patrones.titulo": "Muster",
    "patrones.placeholder": "Mustername (optional)",
    "patrones.guardar": "Jetzt speichern",
    "patrones.csv": "CSV exportieren",
    "patrones.json": "JSON exportieren",
    "patterns.empty": "Keine gespeicherten Muster.",

    "inv.titulo": "Inversion: x^{1/5} vs reines r",
    "inv.p1": "<strong>Was macht <code>x^{1/5}</code>?</strong> …",
    "inv.p2": "<strong>OFF („reines r“):</strong> …",

    "errors.16digits":
      "Fülle alle drei Felder mit genau 16 Ziffern aus.",
    "errors.invalid": "Ungültige Eingaben.",
    "errors.maxgtmin": "Max muss größer als Min sein.",
    "warn.swapMin":
      "Beobachtet ist kleiner als Min…",
    "warn.swapMax":
      "Beobachtet überschreitet Max…"
  }
};
function getLang(){ return localStorage.getItem(LANG_KEY) || "es"; }
function t(key){
  try{
    const lang=getLang();
    return (I18N && I18N[lang] && I18N[lang][key]) || (I18N && I18N.es && I18N.es[key]) || key;
  }catch(_){ return key; }
}
function translatePage(){
  $$("[data-i18n]").forEach(el=>{
    const key=el.getAttribute("data-i18n"); if(!key) return;
    el.innerHTML = t(key);
  });
  $$("[data-i18n-placeholder]").forEach(el=>{
    const key=el.getAttribute("data-i18n-placeholder");
    if(key && "placeholder" in el) el.placeholder = t(key);
  });
  document.title = t("meta.title");
  syncMetaThemeColor();
}
function applyLang(lang){
  localStorage.setItem(LANG_KEY, lang||"es");
  document.documentElement.setAttribute("lang", lang||"es");
  translatePage();
}
function initLang(){
  applyLang(getLang());
  $("#langBtn")?.addEventListener("click", ()=>{
    const lang=getLang();
    $$("#langDialog input[name='lang']").forEach(r=>{ r.checked=(r.value===lang); });
  });
  $("#applyLang")?.addEventListener("click", ()=>{
    const r=$("#langDialog input[name='lang']:checked");
    if (r){ applyLang(r.value); }
    $("#langDialog")?.close();
  });
}

