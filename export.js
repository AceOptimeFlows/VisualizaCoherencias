/* export.js — Exportación de video (20s) del visor de elipses en 3D
   - Cadena A, B o ambas (A+B)
   - 3 calidades (escala + bitrate)
   - Audio opcional desde archivo local (audio/*)
   - Captura lo que se ve en el visor de elipses (forzando vista "Elipses" y modo 3D durante la grabación)
*/

(function () {
  "use strict";

  const DURATION_SEC = 20;
  const FPS = 30;

  const QUALITY_PRESETS = {
    low:  { scale: 1.0, videoBps: 2_500_000,  audioBps: 96_000  },
    mid:  { scale: 1.5, videoBps: 5_000_000,  audioBps: 128_000 },
    high: { scale: 2.0, videoBps: 10_000_000, audioBps: 192_000 }
  };

  const $ = (sel, root = document) => root.querySelector(sel);

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
  function raf() { return new Promise((r) => requestAnimationFrame(() => r())); }

  // i18n helper: usa t() si existe; si no, fallback
  function tt(key, fallback) {
    try {
      if (typeof t === "function") {
        const v = t(key);
        if (v && v !== key) return v;
      }
    } catch (_) {}
    return fallback;
  }

  function isSupported() {
    const c = document.createElement("canvas");
    return !!(c.captureStream && window.MediaRecorder);
  }

  function pickMimeType() {
    if (!window.MediaRecorder || !MediaRecorder.isTypeSupported) return "";

    // Orden pensado para:
    // - Chrome/Firefox: webm
    // - Safari: mp4
    const candidates = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
      "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
      "video/mp4;codecs=avc1.42E01E",
      "video/mp4"
    ];

    for (const c of candidates) {
      try {
        if (MediaRecorder.isTypeSupported(c)) return c;
      } catch (_) {}
    }
    return "";
  }

  function extFromMime(mime) {
    const m = (mime || "").toLowerCase();
    return m.includes("mp4") ? "mp4" : "webm";
  }

  function nowStamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
  }

  function download(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function createAudioTrackFromFile(file, durationSec) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) throw new Error("no-audio-context");

    const audioCtx = new Ctx();

    const buf = await file.arrayBuffer();
    // Safari a veces necesita una copia "slice"
    const audioBuffer = await audioCtx.decodeAudioData(buf.slice(0));

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = (audioBuffer.duration + 0.05) < durationSec;

    const gain = audioCtx.createGain();
    gain.gain.value = 1;

    const dest = audioCtx.createMediaStreamDestination();

    source.connect(gain);
    gain.connect(dest);

    return { audioCtx, source, stream: dest.stream };
  }

  function captureUIState() {
    const bars = document.getElementById("vizBars");
    const ellWrap = document.querySelector(".viz-ellipses-grid");
    const isEll = ellWrap ? !ellWrap.hidden : (bars ? bars.hidden : true);

    // viewMode es global (definido en 16si.js); si no existiera, asumimos 3D
    const mode = (typeof viewMode !== "undefined") ? viewMode : "3D";

    const drawA = document.getElementById("vizDrawA")?.checked ?? true;
    const drawB = document.getElementById("vizDrawB")?.checked ?? false;

    return { isEll, mode, drawA, drawB };
  }

  async function applyExportView(chain) {
    // 1) Asegurar que estamos en el visor de elipses
    if (typeof showViz === "function") {
      showViz("ell");
    } else {
      document.getElementById("btnVizEllipses")?.click();
    }

    // 2) Asegurar modo 3D
    if (typeof viewMode !== "undefined") {
      if (viewMode !== "3D") {
        if (typeof enter3D === "function") enter3D();
        else document.getElementById("btnView3D")?.click();
      }
    } else {
      document.getElementById("btnView3D")?.click();
    }

    // 3) Forzar qué cadenas se muestran
    const cbA = document.getElementById("vizDrawA");
    const cbB = document.getElementById("vizDrawB");

    if (cbA && cbB) {
      if (chain === "A") {
        cbA.checked = true;
        cbB.checked = false;
      } else if (chain === "B") {
        cbA.checked = false;
        cbB.checked = true;
      } else {
        // AB
        cbA.checked = true;
        cbB.checked = true;
      }
    }

    if (typeof toggleEllCanvases === "function") toggleEllCanvases();
    if (typeof drawEllipses === "function") drawEllipses();

    // Dejar que layout + render se asienten
    await raf();
    await raf();
  }

  function restoreUIState(state) {
    const cbA = document.getElementById("vizDrawA");
    const cbB = document.getElementById("vizDrawB");

    if (cbA) cbA.checked = !!state.drawA;
    if (cbB) cbB.checked = !!state.drawB;

    if (typeof toggleEllCanvases === "function") toggleEllCanvases();

    // Restaurar modo 2D/3D
    if (typeof viewMode !== "undefined") {
      if (state.mode === "2D" && viewMode !== "2D" && typeof enter2D === "function") enter2D();
      if (state.mode === "3D" && viewMode !== "3D" && typeof enter3D === "function") enter3D();
    }

    // Restaurar vista barras/elipses
    if (typeof showViz === "function") {
      showViz(state.isEll ? "ell" : "bars");
    } else {
      if (state.isEll) document.getElementById("btnVizEllipses")?.click();
      else document.getElementById("btnVizBars")?.click();
    }
  }

  async function record20s({ chain, quality, audioFile, onProgress }) {
    const srcA = document.getElementById("vizEllipses");
    const srcB = document.getElementById("vizEllipsesB");
    if (!srcA || !srcB) throw new Error("canvas-missing");

    const rA = srcA.getBoundingClientRect();
    const rB = srcB.getBoundingClientRect();

    const preset = QUALITY_PRESETS[quality] || QUALITY_PRESETS.mid;
    const scale = clamp(preset.scale, 0.5, 2.5);

    let baseW = 0, baseH = 0;
    let ratioA = 1;

    if (chain === "A") {
      baseW = rA.width; baseH = rA.height;
    } else if (chain === "B") {
      baseW = rB.width; baseH = rB.height;
    } else {
      // AB
      baseW = rA.width + rB.width;
      baseH = Math.max(rA.height, rB.height);
      const sum = (rA.width + rB.width) || 1;
      ratioA = rA.width / sum;
    }

    if (!(baseW > 2 && baseH > 2)) throw new Error("canvas-size");

    const outW = Math.max(2, Math.round(baseW * scale));
    const outH = Math.max(2, Math.round(baseH * scale));

    // Canvas de composición (off-DOM)
    const outCanvas = document.createElement("canvas");
    outCanvas.width = outW;
    outCanvas.height = outH;

    const outCtx = outCanvas.getContext("2d", { alpha: false });
    outCtx.imageSmoothingEnabled = true;
    outCtx.imageSmoothingQuality = "high";

    let stopDrawing = false;

    const drawLoop = () => {
      if (stopDrawing) return;

      // base negra (evita artefactos de alpha)
      outCtx.fillStyle = "#000";
      outCtx.fillRect(0, 0, outW, outH);

      if (chain === "A") {
        outCtx.drawImage(srcA, 0, 0, outW, outH);
      } else if (chain === "B") {
        outCtx.drawImage(srcB, 0, 0, outW, outH);
      } else {
        const wA = Math.round(outW * ratioA);
        const wB = outW - wA;
        outCtx.drawImage(srcA, 0, 0, wA, outH);
        outCtx.drawImage(srcB, wA, 0, wB, outH);
      }

      requestAnimationFrame(drawLoop);
    };

    drawLoop();

    const stream = outCanvas.captureStream(FPS);

    // Audio opcional
    let audioCtx = null;
    let audioSource = null;

    if (audioFile) {
      try {
        const audioObj = await createAudioTrackFromFile(audioFile, DURATION_SEC);
        audioCtx = audioObj.audioCtx;
        audioSource = audioObj.source;
        audioObj.stream.getAudioTracks().forEach((tr) => stream.addTrack(tr));
      } catch (err) {
        console.warn("[export] audio:", err);
        // seguimos sin audio
      }
    }

    const mime = pickMimeType();
    const recOptions = {};
    if (mime) recOptions.mimeType = mime;
    if (preset.videoBps) recOptions.videoBitsPerSecond = preset.videoBps;
    if (preset.audioBps) recOptions.audioBitsPerSecond = preset.audioBps;

    const recorder = new MediaRecorder(stream, recOptions);
    const chunks = [];

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    const stopped = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = (e) => reject(e.error || e);
    });

    recorder.start(1000);

    // arrancar audio sincronizado
    if (audioSource && audioCtx) {
      try {
        await audioCtx.resume();
        audioSource.start(0);
        audioSource.stop(audioCtx.currentTime + DURATION_SEC);
      } catch (err) {
        console.warn("[export] audio start:", err);
      }
    }

    const t0 = performance.now();
    let progTimer = null;

    if (typeof onProgress === "function") {
      progTimer = setInterval(() => {
        const elapsed = (performance.now() - t0) / 1000;
        onProgress(Math.min(DURATION_SEC, elapsed));
      }, 200);
    }

    await sleep(DURATION_SEC * 1000);

    if (progTimer) clearInterval(progTimer);
    stopDrawing = true;

    if (recorder.state !== "inactive") recorder.stop();

    // parar tracks
    stream.getTracks().forEach((tr) => {
      try { tr.stop(); } catch (_) {}
    });

    await stopped;

    if (audioCtx) {
      try { await audioCtx.close(); } catch (_) {}
    }

    const finalMime = recorder.mimeType || (mime || "video/webm");
    const blob = new Blob(chunks, { type: finalMime });

    return { blob, mimeType: finalMime, width: outW, height: outH };
  }

  function getSelectedRadio(name, fallback) {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : fallback;
  }

  function setupUI() {
    const btnOpen = document.getElementById("btnExportVideo");
    const dlg = document.getElementById("exportDialog");
    const btnStart = document.getElementById("exportStartBtn");
    const audioInput = document.getElementById("exportAudio");
    const statusEl = document.getElementById("exportStatus");
    const progEl = document.getElementById("exportProgress");

    if (!btnOpen || !dlg || !btnStart) return;

    let busy = false;

    const setStatus = (msg) => {
      if (statusEl) statusEl.textContent = msg || "";
    };

    const setProgress = (sec) => {
      if (!progEl) return;
      progEl.hidden = false;
      progEl.value = clamp(sec, 0, DURATION_SEC);
    };

    const resetProgress = () => {
      if (!progEl) return;
      progEl.value = 0;
      progEl.hidden = true;
    };

    // Bloquear ESC durante exportación
    dlg.addEventListener("cancel", (e) => {
      if (busy) e.preventDefault();
    });

    btnOpen.addEventListener("click", () => {
      if (busy) return;
      resetProgress();
      setStatus(tt("export.status.ready", "Listo para exportar (20s)."));
      try { dlg.showModal(); } catch (_) {}
    });

    // Asegurar que los botones data-close cierran aunque no exista un handler global
    dlg.querySelectorAll("[data-close]").forEach((b) => {
      b.addEventListener("click", () => {
        if (busy) return;
        try { dlg.close(); } catch (_) {}
      });
    });

    btnStart.addEventListener("click", async () => {
      if (busy) return;

      if (!isSupported()) {
        setStatus(tt("export.error.notSupported", "Tu navegador no soporta exportación de video (MediaRecorder/captureStream)."));
        return;
      }

      const chain = getSelectedRadio("exportChain", "A"); // A | B | AB
      const quality = getSelectedRadio("exportQuality", "mid"); // low | mid | high
      const audioFile = audioInput?.files?.[0] || null;

      busy = true;
      btnStart.disabled = true;
      dlg.querySelectorAll("[data-close]").forEach((b) => (b.disabled = true));

      const prevState = captureUIState();

      try {
        setStatus(tt("export.status.preparing", "Preparando exportación…"));
        await applyExportView(chain);

        setProgress(0);

        const { blob, mimeType } = await record20s({
          chain,
          quality,
          audioFile,
          onProgress: (sec) => {
            setProgress(sec);
            const left = Math.max(0, Math.ceil(DURATION_SEC - sec));
            setStatus(`${tt("export.status.recording", "Grabando…")} ${left}s`);
          }
        });

        setStatus(tt("export.status.encoding", "Generando archivo…"));
        await sleep(100);

        const ext = extFromMime(mimeType);
        const fileName = `visualiza-coherencias_${chain}_${quality}_${nowStamp()}.${ext}`;

        setStatus(tt("export.status.done", "¡Listo! Descargando…"));
        download(blob, fileName);

        await sleep(400);
        try { dlg.close(); } catch (_) {}
      } catch (err) {
        console.error("[export] Error:", err);
        const msg =
          (err && err.message === "canvas-missing") ? tt("export.error.canvasMissing", "No se encontraron los canvases de elipses.") :
          tt("export.error.generic", "No se pudo iniciar la exportación.");
        setStatus(msg);
      } finally {
        restoreUIState(prevState);
        busy = false;
        btnStart.disabled = false;
        dlg.querySelectorAll("[data-close]").forEach((b) => (b.disabled = false));
      }
    });
  }

  document.addEventListener("DOMContentLoaded", setupUI);
})();