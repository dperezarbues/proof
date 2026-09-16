'use client'

import { useTranslations } from 'next-intl'
import { TAB_CONFIG } from '../tab-config'
import type { Tab } from '../types'

export function StepNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const t = useTranslations('editor')
  return (
    <div
      className="flex"
      style={{ borderBottom: '1px solid var(--c-line)', padding: '0 8px' }}
      role="tablist"
      aria-label="Editor steps"
    >
      {TAB_CONFIG.map(({ id, labelKey }, i) => {
        const on = id === active
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(id)}
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
