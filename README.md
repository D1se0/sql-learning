# SQL Learning — Cheatsheet + Playground

![Version](https://img.shields.io/badge/version-2.0-ff4b5c) ![React](https://img.shields.io/badge/React-18-149eca) ![SQLite](https://img.shields.io/badge/SQLite-WASM-003b57) ![License](https://img.shields.io/badge/license-MIT-green)

Guía interactiva para **aprender y practicar SQL** en el navegador: cheatsheet de 60 temas, buscador global (`Ctrl+K`), **playground con SQLite real (WASM)**, retos validados automáticamente y explorador del esquema de la base de datos.

> 🌐 **Web:** https://d1se0.github.io/sql-learning/

---

## ✨ Qué incluye

| Sección | Descripción |
|---|---|
| **Cheatsheet** | 60 temas organizados en Básicas · Filtrado · Funciones · Tablas, con resaltado de sintaxis propio y botón "▶ ejecutar en playground" en cada ejemplo |
| **Playground SQL** | Editor con `Ctrl+Enter` para ejecutar sobre una **DB SQLite real en tu navegador** (sql.js/WASM, sin backend): 5 tablas relacionadas con datos ficticios de un hospital |
| **Retos** | 10 desafíos (fácil → difícil) con **validación por result-set**: tu query se compara contra la solución ejecutando ambas en SQLite, no comparando texto. Progreso guardado en localStorage |
| **Esquema DB** | Explorador de tablas: columnas, PK/NN, conteo de filas, muestras y atajos para consultar cada tabla |
| **Búsqueda global** | `Ctrl+K` sobre temas, comandos SQL (`GROUP BY`, `COUNT()`…) y keywords, con navegación por teclado |

## 🗄️ Base de datos de práctica (`hospital_lab.db`)

Datos ficticios coherentes con los ejemplos del cheatsheet (pacientes, admisiones…):

```
doctors (8) ──┐
departments (5) ──┼── admissions (25) ──> patients (20) <── lab_results (30)
```

Puedes hacer `SELECT`, `JOIN`, `GROUP BY`, window functions… e incluso `CREATE/INSERT/UPDATE/DELETE` (el botón **reset db** restaura el estado inicial).

## 🚀 Uso

### Web directa
Entra en https://d1se0.github.io/sql-learning/ — no requiere instalación.

### Desarrollo local

```bash
git clone https://github.com/D1se0/sql-learning.git
cd sql-learning/website
npm install
npm run dev        # http://localhost:5173
```

### Build de producción

```bash
npm run build      # tsc --noEmit + vite build → dist/
npm run preview
```

## 📁 Estructura del repo

```
sql-learning/
├── website/              # app React (Vite + TS + Tailwind + framer-motion)
│   ├── public/img/       # imágenes del cheatsheet
│   └── src/
│       ├── components/   # Home, TopicView, Playground, Challenges, SchemaView, SearchPalette, ui
│       ├── lib/          # sqlEngine (sql.js), dbSeed, challenges, store (rutas + progreso)
│       └── data/         # topics.json + search.json (generados)
├── tools/
│   ├── extract.mjs       # regenera topics.json/search.json desde legacy/*.html
│   └── test-db.mjs       # smoke test: valida seed + soluciones de retos con sql.js real
└── legacy/               # cheatsheet original en HTML puro (conservado como fuente de datos)
```

### Regenerar el contenido desde `legacy/`

```bash
cd tools && node extract.mjs && node test-db.mjs
```

## 🛠️ Stack

- **React 18 + Vite 5 + TypeScript** (strict)
- **Tailwind CSS 3** — tema dark + rojo heredado de la v1
- **framer-motion** — animaciones (reveal-on-scroll, paleta, acordeones)
- **sql.js** — SQLite compilado a WASM corriendo 100% en el navegador
- **lucide-react** + fuentes self-hosted (Inter + JetBrains Mono)

## 📄 Licencia

MIT — ver historial del repo.

## 🧭 Taxonomía y despliegue

- El sidebar replica **exactamente** la estructura del cheatsheet original: **Query Basics (6) · Query Filtering (16) · Functions (25, con Aggregate / Window / String / Numeric › Math / Date) · Tables (13)**.
- Despliegue de la v2: **Actions → "Deploy website a GitHub Pages" → Run workflow** con branch `v2`. El workflow de esta rama es solo `workflow_dispatch` para no pisar el sitio de producción (main).
