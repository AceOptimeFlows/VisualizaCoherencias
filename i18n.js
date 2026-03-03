/* i18n.js — OptimeFlow(s) / Conversor CU
   - Carga diccionarios JSON desde /i18n/<lang>.json
   - Traduce:
     * [data-i18n]           -> innerHTML
     * [data-i18n-placeholder] -> placeholder
     * [data-i18n-title]     -> title
     * [data-i18n-aria]      -> aria-label
     * [data-i18n-alt]       -> alt
   - Interpolación: {{year}}, {{author}}, {{app}}, {{updated}} y params custom.
   - Dispara evento: window.dispatchEvent(new CustomEvent("i18n:change",{detail:{lang}}))
*/

(() => {
  "use strict";

  const STORAGE_KEY = "cu_lang";
  const DEFAULT_LANG = "es";
  const BASE_PATH = "i18n";

  const SUPPORTED = [
    "es","en","fr","it","de","pt-BR","ca","ru","hi","zh","ja","ko"
  ];

  const ALIASES = {
    "pt-br": "pt-BR",
    "pt_br": "pt-BR",
    "cat": "ca",
    "ca-es": "ca",
    "zh-cn": "zh",
    "zh-hans": "zh",
    "zh-hant": "zh"
  };

  const _cache = new Map();
  let _lang = DEFAULT_LANG;
  let _fallback = {};
  let _dict = {};

  function normalizeLang(input) {
    let lang = String(input || "").trim();
    if (!lang) return DEFAULT_LANG;

    lang = lang.replace("_", "-");
    const lower = lang.toLowerCase();

    if (ALIASES[lower]) return ALIASES[lower];

    // match exact
    if (SUPPORTED.includes(lang)) return lang;

    // base
    const base = lower.split("-")[0];

    if (base === "pt" && lower.includes("br")) return "pt-BR";
    if (base === "ca" || base === "cat") return "ca";
    if (base === "zh") return "zh";

    if (SUPPORTED.includes(base)) return base;
    return DEFAULT_LANG;
  }

  function getStoredLang() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (_) { return null; }
  }

  function detectBrowserLang() {
    const langs = (navigator.languages && navigator.languages.length)
      ? navigator.languages
      : [navigator.language || DEFAULT_LANG];

    for (const l of langs) {
      const n = normalizeLang(l);
      if (SUPPORTED.includes(n)) return n;
    }
    return DEFAULT_LANG;
  }

  function loadJsonSync(lang) {
    const code = normalizeLang(lang);
    if (_cache.has(code)) return _cache.get(code);

    const url = `${BASE_PATH}/${code}.json`;
    let obj = null;

    try {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", url, false); // sync (asegura que t() funcione antes de otros scripts)
      xhr.send(null);

      if (xhr.status >= 200 && xhr.status < 300) {
        obj = JSON.parse(xhr.responseText);
      }
    } catch (_) {
      obj = null;
    }

    if (!obj || typeof obj !== "object") obj = {};
    _cache.set(code, obj);
    return obj;
  }

  function template(str, params = {}) {
    const ctx = {
      year: String(new Date().getFullYear()),
      author: "Andrés Calvo Espinosa",
      app: "OptimeFlow(s)",
      updated: "2025",
      ...params
    };

    return String(str).replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, k) => {
      const v = ctx[k];
      return (v === undefined || v === null) ? "" : String(v);
    });
  }

  function t(key, params) {
    const k = String(key || "");
    const raw = (_dict && _dict[k]) || (_fallback && _fallback[k]) || k;
    return template(raw, params);
  }

  function translatePage(root = document) {
    const qsa = (sel) => root.querySelectorAll ? root.querySelectorAll(sel) : [];

    qsa("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (!key) return;
      el.innerHTML = t(key);
    });

    qsa("[data-i18n-placeholder]").forEach(el => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (!key) return;
      if ("placeholder" in el) el.placeholder = t(key);
    });

    qsa("[data-i18n-title]").forEach(el => {
      const key = el.getAttribute("data-i18n-title");
      if (!key) return;
      el.setAttribute("title", t(key));
    });

    qsa("[data-i18n-aria]").forEach(el => {
      const key = el.getAttribute("data-i18n-aria");
      if (!key) return;
      el.setAttribute("aria-label", t(key));
    });

    qsa("[data-i18n-alt]").forEach(el => {
      const key = el.getAttribute("data-i18n-alt");
      if (!key) return;
      el.setAttribute("alt", t(key));
    });

    document.title = t("meta.title");

    if (typeof window.syncMetaThemeColor === "function") {
      try { window.syncMetaThemeColor(); } catch (_) {}
    }
  }

  function applyLang(lang) {
    const normalized = normalizeLang(lang);

    _fallback = loadJsonSync("es");
    _dict = (normalized === "es") ? _fallback : loadJsonSync(normalized);
    _lang = normalized;

    try { localStorage.setItem(STORAGE_KEY, normalized); } catch (_) {}
    try { document.documentElement.setAttribute("lang", normalized); } catch (_) {}

    translatePage();

    try {
      window.dispatchEvent(new CustomEvent("i18n:change", { detail: { lang: normalized } }));
    } catch (_) {}
  }

  function getLang() {
    return normalizeLang(getStoredLang() || _lang || DEFAULT_LANG);
  }

  function initLang() {
    if (window.__i18nBooted) return;
    window.__i18nBooted = true;

    const initial = normalizeLang(getStoredLang() || detectBrowserLang() || DEFAULT_LANG);
    applyLang(initial);

    const langBtn = document.getElementById("langBtn");
    const dialog  = document.getElementById("langDialog");
    const applyBtn = document.getElementById("applyLang");

    if (langBtn && dialog) {
      langBtn.addEventListener("click", () => {
        const current = getLang();
        dialog.querySelectorAll("input[name='lang']").forEach(r => {
          r.checked = (normalizeLang(r.value) === current);
        });
      });
    }

    if (applyBtn && dialog) {
      applyBtn.addEventListener("click", () => {
        const r = dialog.querySelector("input[name='lang']:checked");
        if (r) applyLang(r.value);
        dialog.close?.();
      });
    }
  }

  // Exponer API global (y sobreescribir la antigua si existía)
  window.t = t;
  window.getLang = getLang;
  window.translatePage = translatePage;
  window.applyLang = applyLang;
  window.initLang = initLang;

  // Boot
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLang, { once: true });
  } else {
    initLang();
  }
})();