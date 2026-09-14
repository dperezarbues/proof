'use client'

import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import MarkProof from '@/components/proof/MarkProof'
import { Link } from '@/i18n/navigation'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('error')

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div
      style={{
        minHeight: '100svh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(16px, 5vw, 32px)',
        background: 'var(--c-paper)',
        color: 'var(--c-ink)',
        fontFamily: 'var(--f-display)',
      }}
    >
      <div style={{ maxWidth: 460, width: '100%', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <MarkProof size={32} />
        </div>

        <div
          style={{
            fontSize: 20,
            fontWeight: 900,
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
          }}
        >
          {t('headline')}
        </div>

        <p style={{ fontSize: 15, color: 'var(--c-sub)', lineHeight: 1.5, marginBottom: 32 }}>
          {t('body')}
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={reset}
            style={{
              fontFamily: 'var(--f-display)',
              fontWeight: 700,
              fontSize: 14,
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              padding: '14px 24px',
              borderRadius: 3,
              border: 'none',
              cursor: 'pointer',
              background: 'var(--c-accent)',
              color: '#fff',
            }}
          >
            {t('retry')}
          </button>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              fontFamily: 'var(--f-display)',
              fontWeight: 700,
              fontSize: 14,
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              padding: '14px 24px',
              borderRadius: 3,
              textDecoration: 'none',
              background: 'transparent',
              color: 'var(--c-ink)',
              boxShadow: 'inset 0 0 0 1.5px var(--c-ink)',
            }}
          >
            {t('backHome')}
          </Link>
        </div>

        <div
          style={{
            marginTop: 32,
            fontFamily: 'var(--f-mono)',
            fontSize: 11,
            letterSpacing: '0.06em',
            color: 'var(--c-faint)',
            textTransform: 'uppercase',
          }}
        >
          <a
            href="https://github.com/dperezarbues/cvault/issues"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--c-accent)', textDecoration: 'none' }}
          >
            {t('reportIssue')}
          </a>
        </div>
      </div>
    </div>
  )
}
