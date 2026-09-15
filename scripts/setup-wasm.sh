#!/usr/bin/env bash
# Prepares browser-side WASM compilation assets.
# Run once after npm install, or whenever typst source files change.
# Output directories are gitignored — re-run in CI before build.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# ── 1. WASM binary ────────────────────────────────────────────────────────────
WASM_SRC="node_modules/@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm"
WASM_DST="public/wasm/typst-compiler.wasm"
mkdir -p public/wasm
if [ ! -f "$WASM_DST" ] || [ "$WASM_SRC" -nt "$WASM_DST" ]; then
  echo "→ Copying WASM binary…"
  cp "$WASM_SRC" "$WASM_DST"
  echo "  $(du -sh "$WASM_DST" | cut -f1)  $WASM_DST"
fi

# ── 2. Typst source files ─────────────────────────────────────────────────────
echo "→ Copying Typst source assets…"
mkdir -p public/typst/templates public/typst/icons
cp src/typst/*.typ        public/typst/
cp src/typst/templates/*.typ public/typst/templates/
cp src/typst/icons/*.svg  public/typst/icons/

# Fonts (New Computer Modern) are committed in public/fonts/ — no download needed.

# ── 3. PDF.js worker ─────────────────────────────────────────────────────────
# pdfjs-dist's whole 6.x line calls Math.sumPrecise() in its font-substitution
# path with no feature check, and no browser engine implements that method yet
# (it's an unshipped TC39 proposal) — the call throws, substitution aborts, and
# specific glyphs silently fail to draw. The generated PDF itself is always
# correct (confirmed via extracted text and opening the download elsewhere);
# only pdf.js's own in-browser canvas preview is affected. Prepend a tiny,
# feature-detected polyfill ahead of the vendored worker code as a stopgap —
# safe because every call site here just sums an array of plain integers
# (byte-aligned glyph-table sizes), so a plain running-sum is exactly correct;
# it only activates when the real method is genuinely absent, so it becomes an
# inert no-op once pdf.js or the platform actually fixes this upstream.
PDF_WORKER_SRC="node_modules/pdfjs-dist/build/pdf.worker.min.mjs"
PDF_WORKER_DST="public/pdf.worker.min.mjs"
if [ ! -f "$PDF_WORKER_DST" ] || [ "$PDF_WORKER_SRC" -nt "$PDF_WORKER_DST" ]; then
  echo "→ Copying PDF.js worker…"
  {
    echo 'if (typeof Math.sumPrecise !== "function") { Math.sumPrecise = function (values) { let s = 0; for (const v of values) s += v; return s } }'
    cat "$PDF_WORKER_SRC"
  } > "$PDF_WORKER_DST"
fi

echo "✓ WASM setup complete."
