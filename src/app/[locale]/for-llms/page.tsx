import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import SiteFooter from '@/components/proof/SiteFooter'
import SiteNav from '@/components/proof/SiteNav'
import { type Locale, routing } from '@/i18n/routing'
import { CvJsonSection } from './components/CvJsonSection'
import { LayoutSection } from './components/LayoutSection'
import { SectionIdsSection } from './components/SectionIdsSection'
import { StyleSection } from './components/StyleSection'
import { TipsSection } from './components/TipsSection'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'forLlms' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

export default async function ForLlmsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations('forLlms')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-paper)' }}>
      <SiteNav />

      <div style={{ maxWidth: 896, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Header */}
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
          <p style={{ color: 'var(--c-sub)', fontSize: 13, lineHeight: 1.65, maxWidth: 520 }}>
            {t('intro')}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginTop: '1rem' }}>
            {[
              ['#cv-json', t('toc.cvJson')],
              ['#sections', t('toc.sections')],
              ['#layout', t('toc.layout')],
              ['#style', t('toc.style')],
              ['#tips', t('toc.tips')],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                style={{
                  fontFamily: 'var(--f-mono)',
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  background: 'var(--c-paper-deep)',
                  color: 'var(--c-ink)',
                  padding: '4px 10px',
                  borderRadius: 3,
                  textDecoration: 'none',
                  border: '1px solid var(--c-line)',
                }}
              >
                {label}
              </a>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--c-faint)', marginTop: '0.875rem' }}>
            {t('plainTextNote')}{' '}
            <a
              href="/llms.txt"
              className="mono-link"
              style={{ fontFamily: 'var(--f-mono)', color: 'var(--c-sub)' }}
            >
              llms.txt
            </a>{' '}
            ·{' '}
            <a
              href="/llms-full.txt"
              className="mono-link"
              style={{ fontFamily: 'var(--f-mono)', color: 'var(--c-sub)' }}
            >
              llms-full.txt
            </a>
          </p>
        </div>

        <CvJsonSection t={t} />
        <SectionIdsSection t={t} />
        <LayoutSection t={t} />
        <StyleSection t={t} />
        <TipsSection t={t} />
      </div>

      <SiteFooter />
    </div>
  )
}
