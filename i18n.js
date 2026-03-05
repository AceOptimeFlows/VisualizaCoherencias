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

  // ✅ Compatibilidad con nombres de archivo (por si en algún momento
  // el JSON no coincide exactamente con el código de idioma)
  // - pt-BR.json / pt-br.json
  // - ca.json / cat.json
  const JSON_FILE_CANDIDATES = {
    "pt-BR": ["pt-BR", "pt-br"],
    "ca": ["ca", "cat"]
  };

  const _cache = new Map();
  let _lang = DEFAULT_LANG;
  let _fallback = {};
  let _dict = {};

  /* ===========================
     PWA Install (botón Instalar)
     - Chromium: beforeinstallprompt -> prompt()
     - iOS Safari: instrucciones (no hay prompt)
     - Oculta el botón si ya está instalada (standalone)
     =========================== */

  let _deferredInstallPrompt = null;

  function isStandalone() {
    try {
      if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) return true;
    } catch (_) {}
    // iOS Safari
    try {
      if ("standalone" in navigator && navigator.standalone) return true;
    } catch (_) {}
    return false;
  }

  function isIOS() {
    const ua = String(navigator.userAgent || "");
    const platform = String(navigator.platform || "");
    const maxTP = Number(navigator.maxTouchPoints || 0);

    // iPadOS 13+ se hace pasar por MacIntel pero tiene touch points
    const iDevice = /iPad|iPhone|iPod/i.test(ua);
    const iPadOS13Plus = platform === "MacIntel" && maxTP > 1;
    return iDevice || iPadOS13Plus;
  }

  function getInstallBtn() {
    return document.getElementById("installBtn");
  }

  function setInstallBtnHidden(hidden) {
    const btn = getInstallBtn();
    if (!btn) return;
    btn.hidden = !!hidden;
  }

  function setInstallBtnDisabled(disabled) {
    const btn = getInstallBtn();
    if (!btn) return;
    btn.disabled = !!disabled;
    try { btn.setAttribute("aria-disabled", String(!!disabled)); } catch (_) {}
  }

  function getMsg(key, fallback) {
    // Si existe la clave en los JSON, úsala; si no, usa fallback.
    const v = t(key);
    return (v === key) ? String(fallback || "") : String(v);
  }

  function updateInstallUI() {
    const btn = getInstallBtn();
    if (!btn) return;

    // Si ya está instalada, ocultamos.
    if (isStandalone()) {
      setInstallBtnHidden(true);
      return;
    }

    // Si NO está instalada, mostramos el botón siempre.
    // - En Chromium, si hay beforeinstallprompt guardado, al click saldrá el prompt.
    // - En iOS, al click mostramos instrucciones.
    // - En otros, mostramos ayuda indicando el menú del navegador.
    setInstallBtnHidden(false);
    setInstallBtnDisabled(false);
  }

  async function handleInstallClick() {
    // Si ya está instalada, no hacemos nada.
    if (isStandalone()) {
      updateInstallUI();
      return;
    }

    // iOS: no existe beforeinstallprompt → instrucciones.
    if (!_deferredInstallPrompt) {
      if (isIOS()) {
        const msg = getMsg(
          "pwa.ios.help",
          "En iPhone/iPad: abre esta web en Safari → botón Compartir → \"Añadir a pantalla de inicio\"."
        );
        alert(msg);
        return;
      }

      // Otros navegadores sin prompt (o aún no disponible)
      const msg = getMsg(
        "pwa.install.notReady",
        "La instalación aún no está disponible aquí.\n\n- Asegúrate de abrir la web en HTTPS (o localhost).\n- Si es tu primera visita, recarga la página y vuelve a intentarlo.\n- En Chrome/Edge suele aparecer \"Instalar app\" en el menú del navegador."
      );
      alert(msg);
      return;
    }

    setInstallBtnDisabled(true);

    try {
      // Debe ejecutarse directamente por gesto del usuario.
      _deferredInstallPrompt.prompt();

      // Algunos navegadores exponen userChoice.
      if (_deferredInstallPrompt.userChoice) {
        try {
          await _deferredInstallPrompt.userChoice;
        } catch (_) {}
      }
    } catch (_) {
      // Ignorar
    } finally {
      // El evento solo sirve una vez.
      _deferredInstallPrompt = null;
      setInstallBtnDisabled(false);
      updateInstallUI();
    }
  }

  function initInstallUI() {
    if (window.__pwaInstallBooted) return;
    window.__pwaInstallBooted = true;

    const btn = getInstallBtn();
    if (btn) {
      btn.addEventListener("click", handleInstallClick);
    }

    updateInstallUI();

    // Reaccionar si cambia el modo de pantalla (p.ej. instalación / abrir standalone)
    try {
      if (window.matchMedia) {
        const mm = window.matchMedia("(display-mode: standalone)");
        const onChange = () => updateInstallUI();
        if (mm.addEventListener) mm.addEventListener("change", onChange);
        else if (mm.addListener) mm.addListener(onChange);
      }
    } catch (_) {}
  }

  // Captura temprana del evento (Chromium)
  window.addEventListener("beforeinstallprompt", (e) => {
    try { e.preventDefault(); } catch (_) {}
    _deferredInstallPrompt = e;
    updateInstallUI();
  });

  // Cuando se instala
  window.addEventListener("appinstalled", () => {
    _deferredInstallPrompt = null;
    updateInstallUI();
  });

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

    function fetchJson(url) {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url, false); // sync (asegura que t() funcione antes de otros scripts)
        xhr.send(null);

        if (xhr.status >= 200 && xhr.status < 300) {
          const parsed = JSON.parse(xhr.responseText);
          return (parsed && typeof parsed === "object") ? parsed : null;
        }
      } catch (_) {}
      return null;
    }

    const candidates = (JSON_FILE_CANDIDATES[code] ? [...JSON_FILE_CANDIDATES[code]] : [code]);
    // también probamos en minúsculas por si el server es case-insensitive en local,
    // pero case-sensitive en producción.
    const lower = code.toLowerCase();
    if (!candidates.includes(lower)) candidates.push(lower);

    let obj = null;
    for (const file of candidates) {
      const url = `${BASE_PATH}/${file}.json`;
      obj = fetchJson(url);
      if (obj) break;
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

    // PWA install
    initInstallUI();
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