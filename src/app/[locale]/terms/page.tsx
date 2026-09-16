import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import MarkProof from '@/components/proof/MarkProof'
import { Link } from '@/i18n/navigation'
import { type Locale, routing } from '@/i18n/routing'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'terms' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

// Order in which sections render — the only place ordering is decided;
// each key looks up terms.sections.<key>.{title,p1,p2?,date?} in messages.
const SECTION_ORDER = [
  'cvData',
  'pdfGeneration',
  'analytics',
  'cookies',
  'openSource',
  'changes',
  'noWarranty',
] as const

// How many body paragraphs (p1, p2, ...) each section has, for sections
// whose paragraphs are plain translated text. Sections with an inline link
// (pdfGeneration, analytics) or extra content (changes' date line) render
// their own JSX below instead of using this table.
const PARAGRAPH_COUNT: Partial<Record<(typeof SECTION_ORDER)[number], number>> = {
  cvData: 2,
  cookies: 1,
  openSource: 1,
  noWarranty: 2,
}

function LinkTag(href: string) {
  return (chunks: React.ReactNode) => (
    <a href={href} style={{ color: 'var(--c-accent)' }} target="_blank" rel="noopener noreferrer">
      {chunks}
    </a>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        borderTop: '1px solid var(--c-line)',
        paddingTop: '1.5rem',
        paddingBottom: '1.5rem',
      }}
    >
      <p
        data-testid="terms-section-title"
        style={{
          fontFamily: 'var(--f-mono)',
          fontSize: 10,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--c-accent)',
          marginBottom: '0.5rem',
        }}
      >
        {title}
      </p>
      <div style={{ fontSize: 14, color: 'var(--c-sub)', lineHeight: 1.65 }} className="space-y-2">
        {children}
      </div>
    </div>
  )
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations('terms')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-paper)' }}>
      <nav
        style={{
          maxWidth: 672,
          margin: '0 auto',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link
          href="/"
          style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
        >
          <MarkProof size={26} />
          <span
            style={{
              fontWeight: 900,
              fontSize: 15,
              letterSpacing: '-0.02em',
              color: 'var(--c-ink)',
              fontFamily: 'var(--f-display)',
            }}
          >
            Proof
          </span>
        </Link>
        <Link
          href="/editor"
          className="inline-flex items-center gap-2 font-bold rounded-[3px] uppercase tracking-wider whitespace-nowrap transition-opacity hover:opacity-90 px-3.5 py-2 text-[13.5px]"
          style={{ background: 'var(--c-accent)', color: '#fff' }}
        >
          {t('openEditor')}
        </Link>
      </nav>

      <div style={{ maxWidth: 672, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: 'var(--c-ink)',
              marginBottom: '0.5rem',
              fontFamily: 'var(--f-display)',
            }}
          >
            {t('title')}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--c-faint)' }}>{t('subtitle')}</p>
        </div>

        {SECTION_ORDER.map((key) => {
          let body: React.ReactNode
          if (key === 'pdfGeneration') {
            body = (
              <>
                <p>
                  {t.rich('sections.pdfGeneration.p1', { typst: LinkTag('https://typst.app') })}
                </p>
                <p>{t('sections.pdfGeneration.p2')}</p>
              </>
            )
          } else if (key === 'analytics') {
            body = (
              <>
                <p>
                  {t.rich('sections.analytics.p1', {
                    goatcounter: LinkTag('https://www.goatcounter.com'),
                  })}
                </p>
                <p>
                  {t.rich('sections.analytics.p2', {
                    privacy: LinkTag('https://www.goatcounter.com/help/privacy'),
                  })}
                </p>
              </>
            )
          } else if (key === 'changes') {
            body = (
              <>
                <p>{t('sections.changes.p1')}</p>
                <p style={{ fontSize: 12, color: 'var(--c-faint)', paddingTop: '0.25rem' }}>
                  {t('sections.changes.date')}
                </p>
              </>
            )
          } else {
            const count = PARAGRAPH_COUNT[key] ?? 1
            body = Array.from({ length: count }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length static paragraph list per section, never reordered
              <p key={i}>{t(`sections.${key}.p${i + 1}`)}</p>
            ))
          }
          return (
            <Section key={key} title={t(`sections.${key}.title`)}>
              {body}
            </Section>
          )
        })}

        <div
          style={{
            borderTop: '1px solid var(--c-line)',
            paddingTop: '1.5rem',
            paddingBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link href="/" style={{ fontSize: 13, color: 'var(--c-faint)', textDecoration: 'none' }}>
            {t('backHome')}
          </Link>
          <Link
            href="/editor"
            style={{
              fontSize: 13,
              fontWeight: 600,
              padding: '0.375rem 0.875rem',
              background: 'var(--c-accent)',
              color: 'white',
              borderRadius: 4,
              textDecoration: 'none',
            }}
          >
            {t('openEditor')}
          </Link>
        </div>
      </div>
    </div>
  )
}
