'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { routing } from '@/i18n/routing'
import { useLocaleOverride } from './ClientLocaleProvider'

const LOCALE_LABELS: Record<string, string> = {
  en: 'EN',
  fr: 'FR',
  de: 'DE',
  es: 'ES',
}

export default function LanguageSwitcher() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const override = useLocaleOverride()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as Locale
    // Inside the editor, switch in place (no navigation, no lost state) via
    // ClientLocaleProvider. Elsewhere (marketing pages), a real per-locale
    // page is the right thing to navigate to, so fall back to routing.
    if (override) override.setLocale(next)
    else router.replace(pathname, { locale: next })
  }

  return (
    <select
      value={locale}
      onChange={handleChange}
      aria-label={t('langSwitcher')}
      className="font-semibold text-[12px] lg:text-[13px] px-1.5 py-1 rounded-[3px] border-0 bg-transparent cursor-pointer appearance-none"
      style={{ color: 'var(--c-ink2)', boxShadow: 'inset 0 0 0 1px var(--c-line)' }}
    >
      {routing.locales.map((l) => (
        <option key={l} value={l}>
          {LOCALE_LABELS[l]}
        </option>
      ))}
    </select>
  )
}
