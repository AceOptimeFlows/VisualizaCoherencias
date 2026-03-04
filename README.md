# Visualiza Coherente

A local‑first, installable **PWA** that helps you **compute and explore CU values** (16 digits + extended precision) and **visualize structural profiles** through **Sᵢ functions** (two parallel chains A/B) using **bars and 2D/3D ellipses**.

**Live demo:** *(add your link here once published — GitHub Pages / Vercel / any HTTPS host)*

---

## About

**Visualiza Coherente** is part of *OptimeFlow(s)*. It runs fully in the browser and is designed to be:

- **Local & privacy‑respecting** (no trackers; values stay on your device)
- **Offline‑capable** (Service Worker caches the app shell)
- **Installable** (PWA on mobile/desktop)
- **Educational & exploratory** (tools to inspect CU and structural signatures)

---

## Features

- **CU calculator (EP / NR)** with:
  - fixed **16‑digit CU** output and **extended precision**
  - range validation and user guidance (Min/Max/Observed)
- **Sᵢ editor (16) with 2 chains (A/B)**:
  - manual / algorithmic modes
  - templates & patterns (save/load)
  - export **CSV** / **JSON**
- **Structural visualizer**:
  - **bars** and **ellipses** view
  - 2D/3D controls and selection tools
  - real‑time adjustment panel
- **Auxiliary tools**:
  - Newton gravity (classic) + GR correction helpers
  - ln(x) helper + known values
  - “transmute” helpers to move values into CU inputs quickly
- **Internationalization (i18n)** via JSON dictionaries.

---

## How CU is computed (conceptually)

A CU value is computed from a reference range:

- **q = (Obs − Min) / (Max − Min)**
- projected to the operational range with the factor **±0.999999999999990** (16 digits)

This app offers two modes:

- **EP (Estructural Puro):** does not clip magnitude (q may exceed 1 if Obs is outside the range).
- **NR (Normalizado por Referencia):** clips q to **[0, 1]** before projection.

> Note: CU uses **exactly 16 digits** (excluding sign and dot). Example:
> `0.000000000000010` … `0.999999999999990`

---

## Run locally

Because this is a PWA (Service Worker), you must serve it over **http://localhost** or **https://** (opening `index.html` as a file will not enable SW).

### Option A — Python

```bash
python -m http.server 8000
```

Open:

- `http://localhost:8000`

### Option B — any static server

Any simple static server will work (Node `serve`, nginx, etc.).

---

## Install as PWA

- Open the app in your browser.
- Use **Install** (browser menu) or the install prompt if available.
- Once installed, it can run **offline** (cached app shell).

---

## Offline behavior

The Service Worker caches the “app shell” (HTML/CSS/JS + icons + i18n packs).  
When you publish a new version, bump the cache name in `sw.js` so clients get the update.

---

## Internationalization (i18n)

Translations live in:

- `i18n/es.json` (and other languages in the same folder)

The runtime loader is `i18n.js`.

---

## Project structure

```text
/
├─ index.html
├─ styles.css
├─ app.js
├─ escala.js
├─ 16si.js
├─ i18n.js
├─ sw.js
├─ manifest.webmanifest
├─ i18n/
│  ├─ es.json
│  └─ ... other languages
└─ assets/
   └─ img/
      ├─ logo.png
      ├─ visualizacoherencias180.png
      ├─ visualizacoherencias192.png
      └─ visualizacoherencias512.png
```

---

## Citation / Reference

- Software citation metadata: `CITATION.cff`
- Zenodo metadata: `zenodo.json`

Reference DOIs used in the UI (Zenodo):

- `10.5281/zenodo.18714577`
- `10.5281/zenodo.18751249`

---

## License

MIT — see `LICENSE`.

---

## Español

### ¿Qué es?

**Visualiza Coherente** es una **PWA** local (sin servidor) para **calcular y explorar CU** (16 cifras + precisión extendida) y **visualizar perfiles estructurales** mediante **funciones Sᵢ** (dos cadenas A/B) con **barras y elipses 2D/3D**.

**Demo online:** *(añade aquí tu enlace cuando la publiques — GitHub Pages / Vercel / etc.)*

---

### Funcionalidades

- **Calculadora CU (EP / NR)**:
  - salida en **CU 16 cifras** y **CU extendido**
  - validación del rango y ayudas (Mín/Máx/Obs)
- **Editor Sᵢ (16) con 2 cadenas (A/B)**:
  - modo manual / algorítmico
  - plantillas y patrones (guardar/cargar)
  - exportación **CSV** / **JSON**
- **Visualizador estructural**:
  - vistas de **barras** y **elipses**
  - controles 2D/3D y herramientas de selección
  - panel de ajuste en tiempo real
- **Herramientas auxiliares**:
  - gravedad Newtoniana + corrección de relatividad general
  - ln(x) + valores conocidos
  - “transmutar” valores a campos CU
- **Multi‑idioma (i18n)** mediante ficheros JSON.

---

### Cómo se calcula CU (idea)

A partir de un marco de referencia:

- **q = (Obs − Mín) / (Máx − Mín)**
- proyección al rango operativo con **±0.999999999999990** (16 cifras)

Modos:

- **EP (Estructural Puro):** no recorta magnitud.
- **NR (Normalizado por Referencia):** recorta q a **[0,1]** antes de proyectar.

> Nota: CU se escribe con **exactamente 16 cifras** (sin contar signo ni punto). Ejemplo:
> `0.000000000000010` … `0.999999999999990`

---

### Ejecutar en local

Al ser PWA, debes servirla por **localhost** o **https** (abrir `index.html` como archivo no activa el Service Worker).

```bash
python -m http.server 8000
```

Abre `http://localhost:8000`.

---

### Instalar como PWA

- Abre la app en el navegador.
- Pulsa **Instalar** (menú del navegador) o usa el prompt.
- Una vez instalada, puede abrirse **offline**.

---

### Comportamiento offline

El Service Worker cachea el “app shell” (HTML/CSS/JS + iconos + i18n).  
Cuando publiques una versión nueva, cambia el nombre de caché en `sw.js`.

---

### Internacionalización (i18n)

- Diccionarios: `i18n/*.json`
- Loader: `i18n.js`

---

### Estructura del proyecto


```text
/
├─ index.html
├─ styles.css
├─ app.js
├─ escala.js
├─ 16si.js
├─ i18n.js
├─ sw.js
├─ manifest.webmanifest
├─ i18n/
│  ├─ es.json
│  └─ ... other languages
└─ assets/
   └─ img/
      ├─ logo.png
      ├─ visualizacoherencias180.png
      ├─ visualizacoherencias192.png
      └─ visualizacoherencias512.png
```

---

---

### Cita / Referencia

- Metadatos de citación: `CITATION.cff`
- Metadatos Zenodo: `zenodo.json`

DOIs de referencia usados en la interfaz:

- `10.5281/zenodo.18714577`
- `10.5281/zenodo.18751249`

---

### Licencia

MIT — ver `LICENSE`.
