'use client'

import { useTranslations } from 'next-intl'
import { useRef } from 'react'
import { TAB_CONFIG } from '../tab-config'
import type { Tab } from '../types'

export function StepNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const t = useTranslations('editor')
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  function focusAndSelect(index: number) {
    const wrapped = (index + TAB_CONFIG.length) % TAB_CONFIG.length
    tabRefs.current[wrapped]?.focus()
    onChange(TAB_CONFIG[wrapped].id)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, i: number) {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      focusAndSelect(i + 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      focusAndSelect(i - 1)
    } else if (e.key === 'Home') {
      e.preventDefault()
      focusAndSelect(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      focusAndSelect(TAB_CONFIG.length - 1)
    }
  }

  return (
    <div
      className="flex"
      style={{ borderBottom: '1px solid var(--c-line)', padding: '0 8px' }}
      role="tablist"
      aria-label={t('stepsLabel')}
    >
      {TAB_CONFIG.map(({ id, labelKey }, i) => {
        const on = id === active
        return (
          <button
            key={id}
            ref={(el) => {
              tabRefs.current[i] = el
            }}
            type="button"
            role="tab"
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-3.5 cursor-pointer relative"
            style={{
              marginBottom: -1,
              background: 'none',
              border: 'none',
              borderBottom: on ? '2.5px solid var(--c-accent)' : '2.5px solid transparent',
            }}
          >
            <span
              className="font-mono text-[10.5px]"
              style={{ color: on ? 'var(--c-accent)' : 'var(--c-faint)' }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <span
              className="font-bold text-[12.5px] uppercase tracking-[0.02em]"
              style={{ color: on ? 'var(--c-ink)' : 'var(--c-sub)' }}
            >
              {t(labelKey)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
