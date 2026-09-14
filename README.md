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
cv.json  ──►  LayoutEditor  ──►  Typst WASM Worker  ──►  PDF (blob URL)
              (React/Next.js)      (browser thread)
```

## CV schema

The expected JSON structure is documented at `/reference` on the live site. Fields cover identity, contact, experience, education, skills, projects, and certifications. A minimal starter template is available in the editor's "New CV" dialog.

## Getting started

```bash
npm install
bash scripts/setup-wasm.sh   # copies WASM binary from node_modules → public/wasm/
npm run dev
```

Open [localhost:3000](http://localhost:3000).

**Requirements:** Node 20+

## Templates

Templates are Typst source files under `src/typst/`. Each template reads `cv.json` and a `layout.json` injected at compile time, and defines its own `styleParams` (colours, font size, spacing) surfaced in the editor UI.

## Project structure

```
src/
  app/
    page.tsx                  ← landing page
    templates/
      LayoutEditor.tsx        ← editor shell
      components/             ← AccordionSection, SortableCard, StyleParamField, …
      hooks/                  ← useEditorState, useStyleState, useCompiler,
      │                          useSavedConfigs, useLayoutEditor
      types.ts                ← shared TypeScript types
      editor-utils.ts         ← serialization, parsing, QR URL resolution
  lib/
    typst-compile.ts          ← WASM compiler singleton + worker bridge
    storage.ts                ← localStorage / sessionStorage abstraction
  typst/                      ← Typst template source files
public/
  wasm/                       ← typst-compiler.wasm (populated by setup-wasm.sh)
  samples/                    ← static preview PDFs committed to repo
scripts/
  setup-wasm.sh               ← copies WASM from node_modules to public/wasm/
```

## License

[PolyForm Noncommercial License 1.0.0](LICENSE) — free for personal and non-commercial use.
