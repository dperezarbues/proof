import { Link } from '@/i18n/navigation'

type BtnVariant = 'primary' | 'dark' | 'ghost'
type BtnSize = 'sm' | 'md' | 'lg'

const BTN_STYLES: Record<BtnVariant, React.CSSProperties> = {
  primary: { background: 'var(--c-accent)', color: '#fff' },
  dark: { background: 'var(--c-ink)', color: 'var(--c-paper)' },
  ghost: {
    background: 'transparent',
    color: 'var(--c-ink)',
    boxShadow: 'inset 0 0 0 1.5px var(--c-ink)',
  },
}

type BtnCommonProps = {
  children: React.ReactNode
  variant?: BtnVariant
  size?: BtnSize
}

// Locale-aware button — uses next-intl's Link so it preserves the current
// locale when navigating, unlike a plain next/link. Shared across the
// landing page, SiteNav, and SiteFooter to avoid re-declaring this same
// component in each.
//
// Pass `download` to render a plain <a download> instead — for links to
// static files (e.g. /llms-full.txt) rather than app routes, where
// next-intl's typed Link/locale-prefixing doesn't apply and isn't wanted.
type BtnProps =
  | (BtnCommonProps & { href: Parameters<typeof Link>[0]['href']; download?: false })
  | (BtnCommonProps & { href: string; download: true })

export default function Btn({
  href,
  children,
  variant = 'primary',
  size = 'md',
  download,
}: BtnProps) {
  const pad = size === 'lg' ? 'px-7 py-4' : size === 'sm' ? 'px-3.5 py-2' : 'px-5 py-3'
  const text = size === 'lg' ? 'text-[15px]' : 'text-[13.5px]'
  const className = `inline-flex items-center gap-2 font-bold rounded-[3px] uppercase tracking-wider whitespace-nowrap transition-opacity hover:opacity-90 ${pad} ${text}`

  if (download) {
    return (
      <a href={href} download className={className} style={BTN_STYLES[variant]}>
        {children}
      </a>
    )
  }
  return (
    <Link href={href} className={className} style={BTN_STYLES[variant]}>
      {children}
    </Link>
  )
}
