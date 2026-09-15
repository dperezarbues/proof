'use client'

import { useEffect } from 'react'
import { routing } from '@/i18n/routing'

/**
 * Static-export locale-detection redirect shim, shared by the three routes
 * that live outside the [locale] segment (/, /editor, /terms) and therefore
 * have no server to do this properly. Each is its own standalone HTML
 * document — the root layout is a bare passthrough with no <html>/<body> of
 * its own (see src/app/layout.tsx) — so this renders that shell itself,
 * including a <meta refresh> fallback for when JS is unavailable.
 */
export default function LocaleRedirect({ path }: { path: '' | '/editor' | '/terms' }) {
  useEffect(() => {
    const lang = navigator.language.slice(0, 2).toLowerCase()
    const locale = routing.locales.includes(lang as (typeof routing.locales)[number])
      ? lang
      : routing.defaultLocale
    window.location.replace(`/${locale}${path}/`)
  }, [path])

  return (
    <html lang={routing.defaultLocale}>
      {/* biome-ignore lint/style/noHeadElement: this renders a full standalone <html> document (see comment above) — the same pattern Next.js's own page.tsx/layout.tsx convention uses, just relocated to a shared component. */}
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="refresh" content={`0; url=/${routing.defaultLocale}${path}/`} />
      </head>
      <body />
    </html>
  )
}
