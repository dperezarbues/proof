'use client'

import { useState } from 'react'
import { Link } from '@/i18n/navigation'

export type NavLinkItem = { href: string; label: string }

/** Hamburger disclosure for SiteNav's links on narrow viewports — they used to
 *  just be hidden below `md` with no mobile equivalent at all, so anything
 *  not also duplicated in SiteFooter (like /help, originally) was completely
 *  unreachable on mobile. Renders the same links SiteNav shows inline on
 *  desktop; SiteNav passes them as plain data so this one component covers
 *  every page it's used on (landing, /for-llms, /terms, /help) at once. */
export default function MobileNav({
  links,
  menuLabel,
}: {
  links: NavLinkItem[]
  menuLabel: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={menuLabel}
        className="flex items-center justify-center w-9 h-9 rounded-[3px]"
        style={{ color: 'var(--c-ink)' }}
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path
              d="M1 1L17 17M17 1L1 17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
            <path
              d="M0 1H18M0 7H18M0 13H18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 flex flex-col min-w-[180px] py-2 rounded-[4px] z-50"
          style={{
            background: 'var(--c-paper)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
            border: '1px solid var(--c-line)',
          }}
        >
          {links.map((l) => (
            <Link
              key={l.href}
              // biome-ignore lint/suspicious/noExplicitAny: hrefs mix typed internal routes ("/help") and anchor fragments ("/#editor") — next-intl's Link type only covers the former
              href={l.href as any}
              onClick={() => setOpen(false)}
              role="menuitem"
              className="px-4 py-2.5 font-semibold text-[14px]"
              style={{ color: 'var(--c-ink2)', textDecoration: 'none' }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
