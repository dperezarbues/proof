import { describe, expect, it } from 'vitest'
import { CV_LANGUAGES, getCvLanguage, setCvLanguage } from '../cv-language'

describe('getCvLanguage', () => {
  it('defaults to English when _cv_language is absent', () => {
    expect(getCvLanguage('{"identity":{"name":"A"}}')).toBe('en')
  })

  it('reads a valid _cv_language value', () => {
    expect(getCvLanguage('{"_cv_language":"de"}')).toBe('de')
  })

  it('falls back to English for an unrecognised language code', () => {
    expect(getCvLanguage('{"_cv_language":"xx"}')).toBe('en')
  })

  it('falls back to English for invalid JSON', () => {
    expect(getCvLanguage('not json')).toBe('en')
  })

  it('accepts every code in CV_LANGUAGES', () => {
    for (const { code } of CV_LANGUAGES) {
      expect(getCvLanguage(`{"_cv_language":"${code}"}`)).toBe(code)
    }
  })
})

describe('setCvLanguage', () => {
  it('sets _cv_language without disturbing other fields', () => {
    const result = setCvLanguage('{"identity":{"name":"A"},"summary":"S"}', 'fr')
    expect(JSON.parse(result)).toEqual({
      identity: { name: 'A' },
      summary: 'S',
      _cv_language: 'fr',
    })
  })

  it('overwrites an existing _cv_language', () => {
    const result = setCvLanguage('{"_cv_language":"en"}', 'es')
    expect(JSON.parse(result)._cv_language).toBe('es')
  })

  it('returns the content unchanged for invalid JSON', () => {
    expect(setCvLanguage('not json', 'de')).toBe('not json')
  })

  it('round-trips through getCvLanguage', () => {
    const updated = setCvLanguage('{"identity":{"name":"A"}}', 'de')
    expect(getCvLanguage(updated)).toBe('de')
  })
})
