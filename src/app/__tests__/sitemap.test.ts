import { describe, expect, it } from 'vitest'
import { routing } from '@/i18n/routing'
import sitemap from '../sitemap'

describe('sitemap', () => {
  const entries = sitemap()

  it('emits one entry per real page per locale, and nothing for the /templates redirect', () => {
    // 5 real content pages (/, /editor, /for-llms, /help, /terms) x 4 locales
    expect(entries).toHaveLength(5 * routing.locales.length)
    expect(entries.some((e) => e.url.includes('/templates'))).toBe(false)
  })

  it('includes /help — a real, indexable content page with no locale-redirect shim', () => {
    expect(entries.some((e) => e.url.includes('/help'))).toBe(true)
  })

  it('every URL is locale-prefixed and trailing-slashed', () => {
    for (const entry of entries) {
      expect(entry.url).toMatch(new RegExp(`/(${routing.locales.join('|')})/[^/]*/?$`))
      expect(entry.url.endsWith('/')).toBe(true)
    }
  })

  it('every entry declares hreflang alternates for all locales, including itself', () => {
    for (const entry of entries) {
      const languages = entry.alternates?.languages as Record<string, string> | undefined
      expect(languages).toBeDefined()
      expect(Object.keys(languages ?? {}).sort()).toEqual([...routing.locales].sort())
    }
  })

  it("an entry's own locale alternate points back at itself", () => {
    for (const entry of entries) {
      const languages = entry.alternates?.languages as Record<string, string>
      const ownLocale = routing.locales.find((l) => entry.url.includes(`/${l}/`))
      expect(ownLocale).toBeDefined()
      expect(languages[ownLocale as string]).toBe(entry.url)
    }
  })
})
