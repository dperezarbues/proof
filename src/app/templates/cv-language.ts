// Per-CV output language for the compiled PDF (section headings only — see
// src/typst/i18n.typ). Deliberately independent of the editor's own UI
// locale: someone using the app in Spanish may still want an English CV.

export const CV_LANGUAGES = [
  { code: 'en', nativeName: 'English' },
  { code: 'es', nativeName: 'Español' },
  { code: 'de', nativeName: 'Deutsch' },
  { code: 'fr', nativeName: 'Français' },
] as const

export type CvLanguage = (typeof CV_LANGUAGES)[number]['code']

const DEFAULT_CV_LANGUAGE: CvLanguage = 'en'

function isCvLanguage(value: unknown): value is CvLanguage {
  return CV_LANGUAGES.some((l) => l.code === value)
}

/** Reads `_cv_language` from a CV's raw JSON content. Falls back to English on
 * absence or any parse/shape error. */
export function getCvLanguage(content: string): CvLanguage {
  try {
    const parsed = JSON.parse(content) as { _cv_language?: unknown }
    return isCvLanguage(parsed._cv_language) ? parsed._cv_language : DEFAULT_CV_LANGUAGE
  } catch {
    return DEFAULT_CV_LANGUAGE
  }
}

/** Returns updated CV JSON content with `_cv_language` set. Leaves content
 * unchanged (same reference) if it isn't valid JSON. */
export function setCvLanguage(content: string, lang: CvLanguage): string {
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>
    parsed._cv_language = lang
    return JSON.stringify(parsed)
  } catch {
    return content
  }
}
