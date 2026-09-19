/**
 * Static audit: every key the editor exposes must be consumed somewhere in the
 * corresponding Typst source, and every template-specific Typst key must be
 * declared in the editor.
 *
 * Three access patterns in Typst are recognised:
 *   "key" in style       → if-guard check
 *   style.at("key", …)   → explicit at-lookup
 *   style.key_name       → field-access shorthand (sidebar uses this)
 *
 * "Shared" keys (font_family, name_size, …) are consumed in styles.typ via the
 * `_s` block and therefore reach every template automatically.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// ── File helpers ──────────────────────────────────────────────────────────────

const ROOT = join(__dirname, '../../../../')
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf-8')

interface StyleParam {
  key: string
  channel?: string
}
interface Template {
  id: string
  styleParams?: StyleParam[]
}
interface TemplatesJson {
  sharedStyleParams: StyleParam[]
  templates: Template[]
}

const templatesJson = JSON.parse(read('src/data/templates.json')) as TemplatesJson

// ── Key extractors ────────────────────────────────────────────────────────────

function extractKeys(src: string, pattern: RegExp): Set<string> {
  const keys = new Set<string>()
  for (const m of src.matchAll(new RegExp(pattern.source, 'g'))) keys.add(m[1])
  return keys
}

function consumedViaStyle(src: string): Set<string> {
  return new Set([
    // "key" in style
    ...extractKeys(src, /"([a-z_]+)"\s+in\s+style/),
    // style.at("key", …)
    ...extractKeys(src, /style\.at\("([a-z_]+)"/),
    // style.key_name  (field access, but not style.at)
    ...extractKeys(src, /style\.([a-z][a-z_]+)(?!\s*\()/),
  ])
}

// ── Shared keys ───────────────────────────────────────────────────────────────
// Two channels:
//   _s channel   — typography / color / spacing tokens consumed in styles.typ
//   style channel — feature flags consumed per-template via style.at(...)

const stylesSource = read('src/typst/styles.typ')
const sharedTypstKeys = extractKeys(stylesSource, /"([a-z_]+)"\s+in\s+_s/)
const sharedDeclaredKeys = new Set(templatesJson.sharedStyleParams.map((p) => p.key))

// Keys consumed via style.at() / if...in style in at least one template file
const anyTemplateConsumedKeys = new Set(
  templatesJson.templates.flatMap((t) => [
    ...consumedViaStyle(read(`src/typst/templates/${t.id}.typ`)),
  ]),
)

// A shared param is covered if it reaches the Typst layer through either channel
const sharedCoveredKeys = new Set([...sharedTypstKeys, ...anyTemplateConsumedKeys])

// ── Coverage matrix (informational) ──────────────────────────────────────────
// Symbols per cell:
//   ✓  declared in editor UI AND consumed by Typst        → wired correctly
//   D  declared but NOT consumed by any Typst file        → dead UI control
//   C  consumed by Typst but NOT declared in editor UI    → hidden knob
//   S  shared param consumed client-side (e.g. qr_url)   → intentionally exempt
//   blank — neither declared nor consumed for this template

// Universe: every key referenced anywhere in the Typst source
function allTypstKeys(): Set<string> {
  const keys = new Set<string>()
  const addFrom = (src: string) => {
    for (const m of src.matchAll(/"([a-z_]+)"\s+in\s+_s/g)) keys.add(m[1])
    for (const m of src.matchAll(/"([a-z_]+)"\s+in\s+style/g)) keys.add(m[1])
    for (const m of src.matchAll(/style\.at\("([a-z_]+)"/g)) keys.add(m[1])
    for (const m of src.matchAll(/style\.([a-z][a-z_]+)(?!\s*\()/g)) {
      if (m[1] !== 'at') keys.add(m[1])
    }
    for (const m of src.matchAll(/sys\.inputs\.at\("([a-z_]+)"/g)) keys.add(m[1])
  }
  addFrom(read('src/typst/styles.typ'))
  for (const t of templatesJson.templates) addFrom(read(`src/typst/templates/${t.id}.typ`))
  keys.delete('layout') // sys.inputs only, not a style param
  return keys
}

const universeKeys = allTypstKeys()
// Also include any declared keys not yet in the Typst universe
for (const p of templatesJson.sharedStyleParams) universeKeys.add(p.key)
for (const t of templatesJson.templates)
  for (const p of t.styleParams ?? []) universeKeys.add(p.key)

// Per-template consumed keys (pre-computed)
const perTemplateConsumed = new Map(
  templatesJson.templates.map((t) => [
    t.id,
    new Set([...sharedTypstKeys, ...consumedViaStyle(read(`src/typst/templates/${t.id}.typ`))]),
  ]),
)

// Client-side params: consumed outside Typst, exempt from coverage checks
const clientSideKeys = new Set(
  templatesJson.sharedStyleParams.filter((p) => p.channel === 'client').map((p) => p.key),
)

const matrix: Record<string, Record<string, string>> = {}
for (const key of [...universeKeys].sort()) {
  const isShared = sharedDeclaredKeys.has(key)
  const isClient = clientSideKeys.has(key)
  matrix[key] = { '(UI shared)': isShared ? (isClient ? 'S' : '✓') : '' }
  for (const t of templatesJson.templates) {
    const declaredHere = (t.styleParams ?? []).some((p) => p.key === key)
    const declaredAny = isShared || declaredHere
    // biome-ignore lint/style/noNonNullAssertion: perTemplateConsumed is built from this exact templates list (line 111), so the entry is always present.
    const consumed = perTemplateConsumed.get(t.id)!.has(key)
    if (isClient) matrix[key][t.id] = isShared ? 'S' : ''
    else if (declaredAny && consumed)
      matrix[key][t.id] = declaredHere ? '✓' : '(S)' // shared param, consumed
    else if (declaredAny && !consumed)
      matrix[key][t.id] = 'D' // dead
    else if (!declaredAny && consumed)
      matrix[key][t.id] = 'C' // hidden knob
    else matrix[key][t.id] = ''
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Typst param coverage', () => {
  // ── Shared params → Typst ────────────────────────────────────────────────────
  // Typography/color/spacing tokens: consumed in styles.typ via the _s block.
  // Feature flags (show_footer, show_qr, …): consumed per-template via style.at().
  // Params with channel:"client" are consumed by the TypeScript layer before
  // Typst runs (e.g. qr_url → SVG generation) and are exempt from this check.
  describe('sharedStyleParams → Typst', () => {
    for (const { key, channel } of templatesJson.sharedStyleParams) {
      if (channel === 'client') continue
      it(`"${key}" is consumed in styles.typ (_s) or at least one template file`, () => {
        expect(
          sharedCoveredKeys,
          `"${key}" is in sharedStyleParams but is never read by any Typst file`,
        ).toContain(key)
      })
    }
  })

  // ── Per-template ─────────────────────────────────────────────────────────────
  for (const template of templatesJson.templates) {
    const src = read(`src/typst/templates/${template.id}.typ`)
    const templateConsumedKeys = consumedViaStyle(src)
    const allConsumedKeys = new Set([...sharedTypstKeys, ...templateConsumedKeys])
    const declaredKeys = (template.styleParams ?? []).map((p) => p.key)

    describe(`template "${template.id}"`, () => {
      it('every declared styleParam reaches the Typst file', () => {
        for (const key of declaredKeys) {
          expect(
            allConsumedKeys,
            `"${key}" is declared in templates.json for "${template.id}" but is never read in ${template.id}.typ or styles.typ`,
          ).toContain(key)
        }
      })

      it('every template-specific consumed key is declared in styleParams or sharedStyleParams', () => {
        for (const key of templateConsumedKeys) {
          if (sharedDeclaredKeys.has(key)) continue // covered by the shared test
          expect(
            declaredKeys,
            `"${key}" is consumed in ${template.id}.typ but not declared in its styleParams (and not in sharedStyleParams)`,
          ).toContain(key)
        }
      })
    })
  }
})
