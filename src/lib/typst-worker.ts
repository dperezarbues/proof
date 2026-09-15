/// <reference lib="webworker" />

import initWasm, {
  type TypstCompiler,
  TypstCompilerBuilder,
} from '@myriaddreamin/typst-ts-web-compiler'

export type CompileRequest = {
  id: number
  templateId: string
  cvContent: string
  layoutJson: string
  qrSvg?: string
}

export type CompileResponse =
  | { id: number; ok: true; pdf: ArrayBuffer }
  | { id: number; ok: false; error: string }

export type WorkerInitMessage = { type: 'init'; templateIds: string[] }

export type WorkerMessage = CompileResponse | { type: 'ready' }

// ── State ─────────────────────────────────────────────────────────────────────

let compiler: TypstCompiler | null = null
let initPromise: Promise<void> | null = null
let pendingTemplateIds: string[] | null = null
const enc = new TextEncoder()

const FONT_FILES = [
  // New Computer Modern — traditional academic serif
  'NewCM10-Regular.otf',
  'NewCM10-Bold.otf',
  'NewCM10-Italic.otf',
  'NewCM10-BoldItalic.otf',
  // EB Garamond — classical serif (variable font)
  'EBGaramond.ttf',
  'EBGaramond-Italic.ttf',
  // Lato — modern sans-serif
  'Lato-Regular.ttf',
  'Lato-Bold.ttf',
  'Lato-Italic.ttf',
  'Lato-BoldItalic.ttf',
  // Crimson Pro — elegant readable serif (variable font)
  'CrimsonPro.ttf',
  'CrimsonPro-Italic.ttf',
  // Source Sans 3 — clean professional sans-serif (variable font)
  'SourceSans3.ttf',
  'SourceSans3-Italic.ttf',
]

const SHARED_TYP_FILES: Array<{ vPath: string; publicPath: string }> = [
  { vPath: '/src/typst/tokens.typ', publicPath: '/typst/tokens.typ' },
  { vPath: '/src/typst/styles.typ', publicPath: '/typst/styles.typ' },
  { vPath: '/src/typst/components.typ', publicPath: '/typst/components.typ' },
  { vPath: '/src/typst/i18n.typ', publicPath: '/typst/i18n.typ' },
  { vPath: '/src/typst/sections.typ', publicPath: '/typst/sections.typ' },
]

const ICON_NAMES = ['email', 'phone', 'github', 'linkedin', 'location', 'web', 'medium', 'facebook']

const ALLOWED_TEMPLATES = new Set([
  'default',
  'modern',
  'minimal',
  'sidebar',
  'compact',
  'banner',
  'timeline',
  'academic',
  'tech',
  'editorial',
])

// ── Init ──────────────────────────────────────────────────────────────────────

async function initCompiler(): Promise<void> {
  const origin = self.location.origin

  // Load WASM from public/wasm/ (explicit URL — avoids import.meta.url tricks)
  await initWasm({ module_or_path: new URL('/wasm/typst-compiler.wasm', origin) })

  const builder = new TypstCompilerBuilder()
  builder.set_dummy_access_model()

  // Load fonts
  for (const name of FONT_FILES) {
    const resp = await fetch(`${origin}/fonts/${name}`)
    if (!resp.ok) throw new Error(`Failed to load font ${name}: ${resp.status}`)
    await builder.add_raw_font(new Uint8Array(await resp.arrayBuffer()))
  }

  compiler = await builder.build()

  // Register shared Typst source files
  for (const { vPath, publicPath } of SHARED_TYP_FILES) {
    const resp = await fetch(`${origin}${publicPath}`)
    if (!resp.ok) throw new Error(`Failed to load ${publicPath}: ${resp.status}`)
    compiler.add_source(vPath, await resp.text())
  }

  // Register template files (caller-specified or all allowed as fallback)
  const templateIds = pendingTemplateIds ?? [...ALLOWED_TEMPLATES]
  for (const id of templateIds) {
    const publicPath = `/typst/templates/${id}.typ`
    const resp = await fetch(`${origin}${publicPath}`)
    if (!resp.ok) throw new Error(`Failed to load ${publicPath}: ${resp.status}`)
    compiler.add_source(`/src/typst/templates/${id}.typ`, await resp.text())
  }

  // Shadow all icon SVGs (needed by contact-icon() in components.typ)
  for (const name of ICON_NAMES) {
    const resp = await fetch(`${origin}/typst/icons/${name}.svg`)
    if (resp.ok) {
      compiler.map_shadow(`/src/typst/icons/${name}.svg`, enc.encode(await resp.text()))
    }
  }

  // Ensure QR placeholder exists so templates that optionally render it don't error
  const emptySvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"/>'
  compiler.map_shadow('/public/qr-temp.svg', enc.encode(emptySvg))
}

function ensureInit(): Promise<void> {
  if (!initPromise) {
    initPromise = initCompiler()
      .then(() => {
        self.postMessage({ type: 'ready' } satisfies WorkerMessage)
      })
      .catch((err) => {
        initPromise = null
        throw err
      })
  }
  return initPromise
}

// ── Message handler ───────────────────────────────────────────────────────────

self.onmessage = async (e: MessageEvent<CompileRequest | WorkerInitMessage>) => {
  const data = e.data

  if ('type' in data && data.type === 'init') {
    pendingTemplateIds = data.templateIds.filter((id) => ALLOWED_TEMPLATES.has(id))
    // Best-effort warmup — swallow failures here rather than leaving an
    // unhandled rejection. A real compile request retries ensureInit() itself
    // (see below) and reports any error through the normal CompileResponse path.
    ensureInit().catch(() => {})
    return
  }

  const { id, templateId, cvContent, layoutJson, qrSvg } = data as CompileRequest

  if (!ALLOWED_TEMPLATES.has(templateId)) {
    self.postMessage({
      id,
      ok: false,
      error: `Unknown template: ${templateId}`,
    } satisfies CompileResponse)
    return
  }

  try {
    await ensureInit()
    if (!compiler) throw new Error('Compiler failed to initialise')
    const c = compiler

    // Shadow per-compile dynamic files (overwrites previous values)
    c.map_shadow('/runtime/cv.json', enc.encode(cvContent))
    c.map_shadow('/src/layouts/editor.json', enc.encode(layoutJson))
    if (qrSvg) {
      c.map_shadow('/public/qr-temp.svg', enc.encode(qrSvg))
    }

    const inputs: [string, string][] = [
      ['cv_file', '/runtime/cv.json'],
      ['layout', 'editor'],
    ]

    const result = c.compile(`/src/typst/templates/${templateId}.typ`, inputs, 'pdf', 0)

    // result is either a Uint8Array directly or an object with a .result field
    let pdfBytes: Uint8Array
    if (result instanceof Uint8Array) {
      pdfBytes = result
    } else if (result && result.result instanceof Uint8Array) {
      pdfBytes = result.result
    } else {
      throw new Error('Unexpected compiler output — no PDF bytes returned')
    }

    // Transfer the buffer to avoid copying
    const buf = pdfBytes.buffer as ArrayBuffer
    const response: CompileResponse = { id, ok: true, pdf: buf }
    self.postMessage(response, [buf])
  } catch (err) {
    const response: CompileResponse = { id, ok: false, error: String(err) }
    self.postMessage(response)
  }
}
