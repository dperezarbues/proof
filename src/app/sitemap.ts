import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'

export const dynamic = 'force-static'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://proofcv-dusky.vercel.app'

type PageDef = {
  path: string
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
  priority: number
}

// Real, indexable content lives at /[locale]/... — the bare /editor, /for-llms,
// /terms routes are client-side locale-detection redirect shims (see
// src/components/LocaleRedirect.tsx), not distinct pages search engines
// should index directly. /help has no such shim (it's only ever reached via
// /[locale]/help) but is real, indexable content just like /terms and
// /for-llms, so it belongs here too.
const PAGES: PageDef[] = [
  { path: '', changeFrequency: 'monthly', priority: 1.0 },
  { path: '/editor', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/for-llms', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/help', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
]

function localizedUrl(locale: string, path: string): string {
  return `${BASE_URL}/${locale}${path}/`
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return PAGES.flatMap(({ path, changeFrequency, priority }) =>
    routing.locales.map((locale) => ({
      url: localizedUrl(locale, path),
      lastModified,
      changeFrequency,
      priority,
      alternates: {
        languages: Object.fromEntries(routing.locales.map((l) => [l, localizedUrl(l, path)])),
      },
    })),
  )
}
