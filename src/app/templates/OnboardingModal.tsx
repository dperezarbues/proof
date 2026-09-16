'use client'

import { useTranslations } from 'next-intl'
import MarkProof from '@/components/proof/MarkProof'
import { useModalDialogA11y } from './hooks/useModalDialogA11y'

type Props = {
  privateMode: boolean
  onPrivateToggle: (enabled: boolean) => void
  onDismiss: () => void
  /** How many CVs are currently saved — toggling private mode moves storage, so with
   *  existing CVs on the line we confirm first rather than letting a stray click move
   *  or expose someone's data without warning. */
  cvCount: number
}

export default function OnboardingModal({
  privateMode,
  onPrivateToggle,
  onDismiss,
  cvCount,
}: Props) {
  const t = useTranslations('onboarding')
  const dialogRef = useModalDialogA11y(onDismiss)

  function handlePrivateToggle(enabled: boolean) {
    if (cvCount > 0) {
      const message = enabled ? t('confirmEnablePrivate') : t('confirmDisablePrivate')
      if (!confirm(message)) return
    }
    onPrivateToggle(enabled)
  }

  const steps = [
    { step: '1', title: t('step1Title'), body: t('step1Body') },
    { step: '2', title: t('step2Title'), body: t('step2Body') },
    { step: '3', title: t('step3Title'), body: t('step3Body') },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        tabIndex={-1}
        className="w-full sm:max-w-[448px] sm:mx-4 sm:rounded-[6px] rounded-t-[12px] max-h-[90dvh] overflow-y-auto"
        style={{
          background: 'var(--c-paper)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '2rem 2rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
            <MarkProof size={26} />
            <span
              id="onboarding-title"
              style={{
                fontFamily: 'var(--f-display)',
                fontWeight: 900,
                fontSize: 13,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--c-ink)',
              }}
            >
              {t('title')}
            </span>
          </div>
          <p
            style={{ fontSize: 13, color: 'var(--c-sub)', lineHeight: 1.6, marginBottom: '1.5rem' }}
          >
            {t('subtitle')}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {steps.map((s) => (
              <div key={s.step} style={{ display: 'flex', gap: 14 }}>
                <div
                  style={{
                    flexShrink: 0,
                    width: 24,
                    height: 24,
                    borderRadius: 3,
                    background: 'var(--c-accent-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 1,
                    fontFamily: 'var(--f-mono)',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--c-accent)',
                    letterSpacing: '0',
                  }}
                >
                  {s.step}
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--c-ink)',
                      marginBottom: 2,
                      fontFamily: 'var(--f-display)',
                    }}
                  >
                    {s.title}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--c-sub)', lineHeight: 1.6 }}>{s.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: '1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              background: 'var(--c-card)',
              borderRadius: 4,
              padding: '12px 14px',
              border: '1px solid var(--c-line)',
            }}
          >
            <input
              type="checkbox"
              id="private-mode-toggle"
              checked={privateMode}
              onChange={(e) => handlePrivateToggle(e.target.checked)}
              style={{ marginTop: 2, flexShrink: 0 }}
            />
            <label
              htmlFor="private-mode-toggle"
              style={{ fontSize: 12, color: 'var(--c-sub)', lineHeight: 1.6, cursor: 'pointer' }}
            >
              <span style={{ fontWeight: 700, color: 'var(--c-ink)' }}>{t('sharedComputer')}</span>
              <br />
              {t('sharedComputerNote')}
            </label>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.875rem 2rem',
            background: 'var(--c-paper-deep)',
            borderTop: '1px solid var(--c-line)',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--f-mono)',
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--c-faint)',
            }}
          >
            {t('reopenHint')}
          </p>
          <button
            type="button"
            onClick={onDismiss}
            style={{
              background: 'var(--c-accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 3,
              padding: '8px 20px',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'var(--f-display)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {t('getStarted')}
          </button>
        </div>
      </div>
    </div>
  )
}
