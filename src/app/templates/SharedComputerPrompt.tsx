'use client'

import { useTranslations } from 'next-intl'
import { useModalDialogA11y } from './hooks/useModalDialogA11y'

type Props = {
  /** Called with true if the user says this is a shared computer (switches to
   *  session storage), false otherwise (keeps this device's normal storage). */
  onChoose: (shared: boolean) => void
}

export default function SharedComputerPrompt({ onChoose }: Props) {
  const t = useTranslations('sharedComputerPrompt')
  // Dismissing without an explicit choice (Escape/outside click isn't wired
  // here, but Escape is via useModalDialogA11y) keeps today's default —
  // normal, persistent storage — rather than silently switching to session.
  const dialogRef = useModalDialogA11y(() => onChoose(false))

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('ariaLabel')}
        tabIndex={-1}
        className="w-full sm:max-w-[420px] sm:mx-4 sm:rounded-[6px] rounded-t-[12px]"
        style={{ background: 'var(--c-paper)', boxShadow: '0 40px 100px rgba(0,0,0,0.4)' }}
      >
        <div style={{ padding: '1.75rem' }}>
          <p
            style={{
              fontFamily: 'var(--f-display)',
              fontWeight: 900,
              fontSize: 13,
              letterSpacing: '0.06em',
              color: 'var(--c-ink)',
              marginBottom: '0.75rem',
            }}
          >
            {t('title')}
          </p>
          <p style={{ fontSize: 13, color: 'var(--c-sub)', lineHeight: 1.6 }}>{t('body')}</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={() => onChoose(true)}
              style={{
                background: 'var(--c-accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 3,
                padding: '10px 16px',
                fontSize: 12,
                fontWeight: 700,
                fontFamily: 'var(--f-display)',
                letterSpacing: '0.04em',
                cursor: 'pointer',
              }}
            >
              {t('sharedButton')}
            </button>
            <button
              type="button"
              onClick={() => onChoose(false)}
              style={{
                background: 'none',
                boxShadow: 'inset 0 0 0 1px var(--c-line)',
                color: 'var(--c-ink2)',
                borderRadius: 3,
                padding: '10px 16px',
                fontSize: 12,
                fontWeight: 700,
                fontFamily: 'var(--f-display)',
                letterSpacing: '0.04em',
                cursor: 'pointer',
              }}
            >
              {t('notSharedButton')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
