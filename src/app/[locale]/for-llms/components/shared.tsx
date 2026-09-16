import type { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

export type ForLlmsT = Awaited<ReturnType<typeof getTranslations>>

export function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      style={{
        borderTop: '1px solid var(--c-line)',
        paddingTop: '2rem',
        paddingBottom: '2rem',
        scrollMarginTop: '5rem',
      }}
    >
      <h2
        style={{
          fontSize: 15,
          fontWeight: 800,
          color: 'var(--c-ink)',
          marginBottom: '1.25rem',
          fontFamily: 'var(--f-display)',
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code
      style={{
        fontFamily: 'var(--f-mono)',
        fontSize: 11,
        background: 'var(--c-card)',
        padding: '2px 6px',
        borderRadius: 3,
        color: 'var(--c-ink)',
      }}
    >
      {children}
    </code>
  )
}

export function Field({
  name,
  type,
  req,
  desc,
  children,
}: {
  name: string
  type: string
  req?: boolean
  desc: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div
      style={{ padding: '0.625rem 0', borderBottom: '1px solid var(--c-line2)' }}
      className="last:border-0"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
          flexWrap: 'wrap' as const,
          marginBottom: 2,
        }}
      >
        <code
          style={{
            fontFamily: 'var(--f-mono)',
            fontSize: 11,
            fontWeight: 600,
            background: 'var(--c-accent-soft)',
            color: 'var(--c-accent-deep)',
            padding: '2px 6px',
            borderRadius: 3,
          }}
        >
          {name}
        </code>
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--c-faint)' }}>
          {type}
        </span>
        {req && (
          <span
            style={{
              fontFamily: 'var(--f-mono)',
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--c-accent)',
              fontWeight: 600,
            }}
          >
            required
          </span>
        )}
      </div>
      <p style={{ fontSize: 13, color: 'var(--c-sub)', lineHeight: 1.6 }}>{desc}</p>
      {children}
    </div>
  )
}

export function Code({ children }: { children: string }) {
  return (
    <pre
      style={{
        background: '#0E0B08',
        color: 'rgba(255,255,255,0.7)',
        borderRadius: 4,
        padding: '1rem',
        fontSize: 11,
        fontFamily: 'var(--f-mono)',
        overflowX: 'auto',
        lineHeight: 1.65,
        whiteSpace: 'pre',
      }}
    >
      {children}
    </pre>
  )
}

export function Tag({
  children,
  color = 'gray',
}: {
  children: React.ReactNode
  color?: 'gray' | 'blue' | 'green'
}) {
  const styles: Record<string, React.CSSProperties> = {
    gray: { background: 'var(--c-paper-deep)', color: 'var(--c-sub)' },
    blue: { background: 'var(--c-accent-soft)', color: 'var(--c-accent-deep)' },
    green: { background: '#e6f4ec', color: '#2a7a4a' },
  }
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 500,
        padding: '2px 6px',
        borderRadius: 3,
        fontFamily: 'var(--f-mono)',
        ...styles[color],
      }}
    >
      {children}
    </span>
  )
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: 'var(--f-mono)',
        fontSize: 10,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'var(--c-faint)',
        marginBottom: '0.75rem',
      }}
    >
      {children}
    </p>
  )
}

type BtnVariant = 'primary' | 'dark' | 'ghost'
const BTN_STYLES: Record<BtnVariant, React.CSSProperties> = {
  primary: { background: 'var(--c-accent)', color: '#fff' },
  dark: { background: 'var(--c-ink)', color: 'var(--c-paper)' },
  ghost: {
    background: 'transparent',
    color: 'var(--c-ink)',
    boxShadow: 'inset 0 0 0 1.5px var(--c-ink)',
  },
}

// Locale-aware equivalent of ProofButton — that component uses plain
// next/link, which would drop the current locale (falling back to
// browser-language detection) when navigating from a real [locale] page.
export function EditorButton({
  variant = 'primary',
  children,
}: {
  variant?: BtnVariant
  children: React.ReactNode
}) {
  return (
    <Link
      href="/editor"
      className="inline-flex items-center gap-2 font-bold rounded-[3px] uppercase tracking-wider whitespace-nowrap transition-opacity hover:opacity-90 px-3.5 py-2 text-[13.5px]"
      style={BTN_STYLES[variant]}
    >
      {children}
    </Link>
  )
}
