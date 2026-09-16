import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import MarkProof from '@/components/proof/MarkProof'
import { Link } from '@/i18n/navigation'
import { type Locale, routing } from '@/i18n/routing'
import { CvJsonSection } from './components/CvJsonSection'
import { LayoutSection } from './components/LayoutSection'
import { SectionIdsSection } from './components/SectionIdsSection'
import { StyleSection } from './components/StyleSection'
import { EditorButton } from './components/shared'
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
  const tNav = await getTranslations('nav')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-paper)' }}>
      {/* Nav */}
      <nav
        style={{
          borderBottom: '1px solid var(--c-line)',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: 896,
          margin: '0 auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            href="/"
            style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
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
          <span style={{ color: 'var(--c-line)', fontSize: 16 }}>/</span>
          <span style={{ fontSize: 13, color: 'var(--c-sub)' }}>{t('breadcrumb')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a
            href="/llms-full.txt"
            className="mono-link"
            style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--c-faint)' }}
          >
            llms-full.txt
          </a>
          <a
            href="/llms.txt"
            className="mono-link"
            style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--c-faint)' }}
          >
            llms.txt
          </a>
          <LanguageSwitcher />
          <EditorButton variant="dark">{tNav('openEditor')}</EditorButton>
        </div>
      </nav>

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
        </div>

        <CvJsonSection t={t} />
        <SectionIdsSection t={t} />
        <LayoutSection t={t} />
        <StyleSection t={t} />
        <TipsSection t={t} />

        {/* Footer */}
        <div
          style={{
            borderTop: '1px solid var(--c-line)',
            padding: '2rem 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--f-mono)',
              fontSize: 11,
              color: 'var(--c-faint)',
              letterSpacing: '0.08em',
            }}
          >
            {t('footerTagline')}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <a
              href="/llms-full.txt"
              className="mono-link"
              style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--c-faint)' }}
            >
              llms-full.txt
            </a>
            <a
              href="/llms.txt"
              className="mono-link"
              style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--c-faint)' }}
            >
              llms.txt
            </a>
            <EditorButton variant="primary">{tNav('openEditor')}</EditorButton>
          </div>
        </div>
      </div>
    </div>
  )
}
