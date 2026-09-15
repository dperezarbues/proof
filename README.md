# Proof

Privacy-first CV editor that generates polished PDFs from a structured JSON file. Runs entirely in your browser — your data never leaves your device.

## What it does

- Edit your CV as structured JSON following a documented schema
- Choose a template and customise layout, sections, and style
- Compile to PDF in-browser using [Typst](https://typst.app) compiled to WASM
- Save and switch between multiple layout presets (stored in `localStorage`)
- Export / import configurations as JSON for backup or sharing

## How it works

Compilation happens inside a Web Worker via [`@myriaddreamin/typst-ts-web-compiler`](https://github.com/Myriad-Dreamin/typst.ts). The WASM binary (~6 MB) is downloaded once per browser session and cached. No server is involved at any point after the initial page load.

```
cv.json  ──►  TemplatesGallery / EditorShell  ──►  Typst WASM Worker  ──►  PDF (blob URL)
              (React/Next.js)                       (browser thread)
```

## Deployment & security headers

This is a plain static export (`output: 'export'` in `next.config.ts`) — there's no server at runtime, anywhere. Security headers (CSP, HSTS, `X-Frame-Options`, …) are defined in `vercel.json`, which is a **Vercel platform feature**, not something Next.js or the static export itself enforces. Deploying the `out/` directory to a different static host (S3, Netlify, GitHub Pages, …) ships with **none of those headers** unless you configure equivalent ones on that host yourself — the app still works, but without that hardening.

`script-src` carries both `'wasm-unsafe-eval'` and `'unsafe-eval'`. Root-caused by enforcing the real CSP locally (Playwright response-header injection against a production build) with `'unsafe-eval'` removed: pdf.js's own preview rendering worked fine throughout — it never needs it — but the Typst compile step failed every time with a caught `EvalError`, surfaced through the app's own error banner. `'unsafe-eval'` is required by [`@myriaddreamin/typst-ts-web-compiler`](https://github.com/Myriad-Dreamin/typst.ts)'s wasm-bindgen JS glue, not pdfjs-dist — it's third-party generated code, not something this repo can remove independently.

## CV schema

The full CV JSON schema, layout structure, and style-parameter reference is documented at [`/for-llms`](http://localhost:3000/for-llms) on the running app (also served as plain text at `/llms.txt` and `/llms-full.txt` for LLM/agent consumption). A shorter human-readable version lives in `src/data/SCHEMA.md`. A minimal starter template is available in the editor's "New CV" dialog.

## Localization

Proof has two independent language axes:

- **Interface language** — en/de/es/fr, via [next-intl](https://next-intl.dev), covers all app chrome (`messages/*.json`).
- **CV output language** — a per-CV setting (Data tab) that controls only the *generated PDF's* section headings (`src/typst/i18n.typ`), independent of the interface language — you can edit in Spanish and still produce an English CV.

## Getting started

```bash
npm install
bash scripts/setup-wasm.sh   # copies WASM binary from node_modules → public/wasm/
npm run dev
```

Open [localhost:3000](http://localhost:3000).

**Requirements:** Node 24+ (matches `.github/workflows/ci.yml`)

## Templates

Templates are Typst source files under `src/typst/templates/`. Each template reads `cv.json` and a `layout.json` injected at compile time, and defines its own `styleParams` (colours, font size, spacing) surfaced in the editor UI. `scripts/check-templates.mjs` guards that the template allowlist in `src/lib/typst-worker.ts` and section-id handling in `src/typst/sections.typ` stay in sync with what's actually on disk.

## Project structure

```
src/
  app/
    [locale]/                 ← localized routes: landing page, terms, error/not-found
    editor/, terms/           ← locale-detecting redirect shims to /[locale]/...
    for-llms/                 ← human + machine-readable schema reference
    templates/
      TemplatesGallery.tsx    ← top-level editor orchestrator (CV list, template/layout
      │                          picker, PDF preview, modals)
      EditorShell.tsx         ← layout/style editing panel
      cv-editor/               ← structured CV-content form (identity, skills, sections)
      components/              ← layout/style editor UI (AccordionSection, SortableCard, …)
      hooks/                   ← useEditorState, useStyleState, useCompiler,
      │                          useSavedConfigs, useLayoutEditor, useCvRepository
      cv-language.ts           ← per-CV output-language field (see Localization)
      types.ts                 ← shared TypeScript types
  lib/
    typst-compile.ts          ← WASM compiler singleton + worker bridge
    typst-worker.ts           ← the actual Web Worker (WASM init, font/template loading)
    storage.ts                ← localStorage / sessionStorage abstraction (incl. private mode)
  typst/                      ← Typst template source files, i18n.typ (section-heading translations)
public/
  wasm/                       ← typst-compiler.wasm (populated by setup-wasm.sh)
  samples/                    ← static preview PDFs committed to repo
scripts/
  setup-wasm.sh               ← copies WASM/Typst/font assets to public/, patches the
  │                              pdf.js worker for a known upstream pdfjs-dist bug
  check-templates.mjs         ← CI guard: template allowlist matches the filesystem
```

## License

[PolyForm Noncommercial License 1.0.0](LICENSE) — free for personal and non-commercial use.
