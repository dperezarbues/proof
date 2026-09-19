import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import PageSection from '@/components/proof/PageSection'
import SiteFooter from '@/components/proof/SiteFooter'
import SiteNav from '@/components/proof/SiteNav'
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
  const t = await getTranslations({ locale, namespace: 'help' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

// Order in which sections render — the only place ordering is decided; each
// key looks up help.sections.<key>.{title,p1,p2?,...} in messages.
const SECTION_ORDER = [
  'gettingStarted',
  'templates',
  'layout',
  'style',
  'cvLanguage',
  'generatingPdf',
  'savingAndBackup',
  'privacy',
] as const

// How many plain-text body paragraphs (p1, p2, ...) each section has.
// `privacy` renders its own JSX below instead, for the inline /terms link.
const PARAGRAPH_COUNT: Partial<Record<(typeof SECTION_ORDER)[number], number>> = {
  gettingStarted: 2,
  templates: 2,
  layout: 2,
  style: 2,
  cvLanguage: 1,
  generatingPdf: 2,
  savingAndBackup: 3,
}

function TermsLink(chunks: React.ReactNode) {
  return (
    <Link href="/terms" style={{ color: 'var(--c-accent)' }}>
      {chunks}
    </Link>
  )
}

export default async function HelpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations('help')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-paper)' }}>
      <SiteNav />

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
          if (key === 'privacy') {
            body = <p>{t.rich('sections.privacy.p1', { terms: TermsLink })}</p>
          } else {
            const count = PARAGRAPH_COUNT[key] ?? 1
            body = Array.from({ length: count }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length static paragraph list per section, never reordered
              <p key={i}>{t(`sections.${key}.p${i + 1}`)}</p>
            ))
          }
          return (
            <PageSection key={key} title={t(`sections.${key}.title`)} testId="help-section-title">
              {body}
            </PageSection>
          )
        })}
      </div>

      <SiteFooter />
    </div>
  )
}
