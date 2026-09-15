'use client'

import { NextIntlClientProvider, useLocale, useMessages } from 'next-intl'
import { createContext, useCallback, useContext, useState } from 'react'
import type { Locale } from '@/i18n/routing'
import { routing } from '@/i18n/routing'

type Messages = Record<string, unknown>

type LocaleOverrideCtx = {
  locale: Locale
  setLocale: (next: Locale) => Promise<void>
}

const LocaleOverrideContext = createContext<LocaleOverrideCtx | null>(null)

/** Returns the client-side locale override controls if this component is
 *  rendered inside a ClientLocaleProvider, or null otherwise. Callers (e.g.
 *  LanguageSwitcher) use this to switch locale in place, without navigating,
 *  when available — falling back to normal route-based switching elsewhere. */
export function useLocaleOverride() {
  return useContext(LocaleOverrideContext)
}

const messageLoaders: Record<Locale, () => Promise<{ default: Messages }>> = {
  en: () => import('../../messages/en.json'),
  fr: () => import('../../messages/fr.json'),
  de: () => import('../../messages/de.json'),
  es: () => import('../../messages/es.json'),
}

/**
 * Lets its subtree switch UI locale without a route navigation — used
 * specifically around the editor, where a full navigation (the normal
 * next-intl pattern of routing to /[otherLocale]/editor) remounts the whole
 * client tree and silently discards in-progress state that has nothing to do
 * with the UI language: the selected template/layout, the compiled PDF
 * preview, the active tab. Switching locale should only ever change chrome
 * text, so this loads the target locale's messages client-side, swaps them
 * into a nested NextIntlClientProvider (shadowing the server-rendered outer
 * one for this subtree only), and syncs the address bar and <html lang> via
 * plain browser APIs that don't touch Next's router or trigger a re-render
 * of anything above this provider.
 */
export function ClientLocaleProvider({ children }: { children: React.ReactNode }) {
  const initialLocale = useLocale() as Locale
  const initialMessages = useMessages() as Messages
  const [locale, setLocaleState] = useState(initialLocale)
  const [messages, setMessages] = useState(initialMessages)

  const setLocale = useCallback(async (next: Locale) => {
    const mod = await messageLoaders[next]()
    setMessages(mod.default)
    setLocaleState(next)
    document.documentElement.lang = next

    const { pathname, search, hash } = window.location
    const localePattern = new RegExp(`^/(${routing.locales.join('|')})(?=/|$)`)
    const nextPath = localePattern.test(pathname)
      ? pathname.replace(localePattern, `/${next}`)
      : `/${next}${pathname}`
    window.history.replaceState(null, '', `${nextPath}${search}${hash}`)
  }, [])

  return (
    <LocaleOverrideContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </LocaleOverrideContext.Provider>
  )
}
