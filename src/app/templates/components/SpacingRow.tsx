'use client'

import { useTranslations } from 'next-intl'

export default function SpacingRow({
  pre,
  post,
  onChange,
  onClear,
}: {
  pre: number
  post: number
  onChange: (pre: number, post: number) => void
  onClear: () => void
}) {
  const t = useTranslations('editor')
  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 text-xs border-t"
      style={{
        background: 'var(--c-paper-deep)',
        borderColor: 'var(--c-line)',
        color: 'var(--c-sub)',
      }}
    >
      <span className="shrink-0">↕</span>
      <label className="flex items-center gap-1 shrink-0">
        <span>before</span>
        <input
          type="number"
          min={0.05}
          max={2}
          step={0.05}
          value={pre.toFixed(2)}
          onChange={(e) => onChange(parseFloat(e.target.value) || pre, post)}
          className="w-14 rounded px-1 py-0.5 text-xs"
          style={{
            border: '1px solid var(--c-line)',
            color: 'var(--c-ink)',
            background: 'var(--c-card)',
          }}
        />
        <span>em</span>
      </label>
      <label className="flex items-center gap-1 shrink-0">
        <span>after</span>
        <input
          type="number"
          min={0.05}
          max={2}
          step={0.05}
          value={post.toFixed(2)}
          onChange={(e) => onChange(pre, parseFloat(e.target.value) || post)}
          className="w-14 rounded px-1 py-0.5 text-xs"
          style={{
            border: '1px solid var(--c-line)',
            color: 'var(--c-ink)',
            background: 'var(--c-card)',
          }}
        />
        <span>em</span>
      </label>
      <button
        type="button"
        onClick={onClear}
        className="ml-auto leading-none transition-colors"
        style={{ color: 'var(--c-faint)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--c-accent)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--c-faint)'
        }}
        title={t('resetToDefault')}
        aria-label={t('resetToDefault')}
      >
        ×
      </button>
    </div>
  )
}
