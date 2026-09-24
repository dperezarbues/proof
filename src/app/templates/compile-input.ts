import { type CvLanguage, getCvLanguage } from './cv-language'
import type { CvJson } from './schemas'

/**
 * Everything the Typst compiler needs for one compile pass, as an explicit,
 * typed boundary. Avoid collapsing this back into an opaque pre-stringified
 * `cvContent` blob with the output language smuggled inside as a
 * `_cv_language` field — every caller would have to know to dig it back out
 * (or forget to, silently).
 */
export interface CompileInput {
  templateId: string
  cv: CvJson
  language: CvLanguage
  layoutData: Record<string, unknown>
  qrSvg?: string
}

/**
 * Splits a persisted CV JSON string (`CvEntry.content`) into `{ cv, language
 * }`. `_cv_language` is stripped out of `cv` so the language has exactly one
 * place to live from here on — `compileTypst` re-embeds it right before
 * serializing for the worker, since the Typst side still expects it merged
 * into the CV data (see `src/typst/sections.typ`).
 *
 * Not re-validated against `CvSchema` here: every path that can write CV
 * content (the JSON tab, file import) already runs it through
 * `CvSchema.safeParse` before saving — see CvDataModal.tsx. A malformed
 * `content` string still throws (from the JSON.parse below) rather than
 * silently compiling an empty CV — the caller's existing error handling
 * surfaces that as a compile error.
 */
export function parseCvContent(content: string): { cv: CvJson; language: CvLanguage } {
  const language = getCvLanguage(content)
  const parsed = JSON.parse(content) as Record<string, unknown> & { _cv_language?: unknown }
  delete parsed._cv_language
  return { cv: parsed as CvJson, language }
}
