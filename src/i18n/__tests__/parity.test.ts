import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { routing } from '../routing'

// Guards against exactly the kind of translation-key drift that's easy to
// introduce silently: adding a UI string in one locale's messages file and
// forgetting the other three (next-intl falls back quietly at runtime, so
// nothing breaks visibly — this is the only thing that would catch it).

function flatten(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return value && typeof value === 'object' && !Array.isArray(value)
      ? flatten(value as Record<string, unknown>, path)
      : [path]
  })
}

const messagesByLocale = new Map(
  routing.locales.map((locale) => [
    locale,
    JSON.parse(readFileSync(join(__dirname, `../../../messages/${locale}.json`), 'utf-8')),
  ]),
)

const keysByLocale = new Map(
  [...messagesByLocale.entries()].map(([locale, messages]) => [locale, new Set(flatten(messages))]),
)

describe('i18n message key parity', () => {
  it('has a messages/<locale>.json file for every routing.locales entry', () => {
    expect([...messagesByLocale.keys()].sort()).toEqual([...routing.locales].sort())
  })

  for (const locale of routing.locales) {
    it(`${locale}.json has no keys missing relative to the union of all locales`, () => {
      const ownKeys = keysByLocale.get(locale) ?? new Set()
      const allKeys = new Set([...keysByLocale.values()].flatMap((s) => [...s]))
      const missing = [...allKeys].filter((k) => !ownKeys.has(k)).sort()
      expect(missing, `${locale}.json is missing: ${missing.join(', ')}`).toEqual([])
    })

    it(`${locale}.json has no keys absent from every other locale (stray/typo'd key)`, () => {
      const ownKeys = keysByLocale.get(locale) ?? new Set()
      const otherLocales = routing.locales.filter((l) => l !== locale)
      const stray = [...ownKeys]
        .filter((k) => otherLocales.every((l) => !keysByLocale.get(l)?.has(k)))
        .sort()
      expect(stray, `${locale}.json has keys no other locale defines: ${stray.join(', ')}`).toEqual(
        [],
      )
    })
  }
})
