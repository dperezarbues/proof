'use client'

import { useTranslations } from 'next-intl'
import { useContext } from 'react'
import { LabelCtx } from '../contexts'

export default function ColumnSlot({
  label,
  sections,
  available,
  onRemove,
  onAdd,
}: {
  label: string
  sections: string[]
  available: string[]
  onRemove: (i: number) => void
  onAdd: (id: string) => void
}) {
  const getLabel = useContext(LabelCtx)
  const t = useTranslations('editor')
  return (
    <div className="bg-gray-50 rounded p-2 min-h-16">
      <p className="text-xs font-medium text-gray-400 mb-1.5">{label}</p>
      <div className="space-y-1">
        {sections.map((id, i) => (
          <div
            key={id}
            className="flex items-center justify-between px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700"
          >
            <span>{getLabel(id)}</span>
            <button
              type="button"
              onClick={() => onRemove(i)}
              aria-label={t('removeSection')}
              className="ml-2 transition-colors"
              style={{ color: 'var(--c-sub)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--c-accent)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--c-sub)'
              }}
              onFocus={(e) => {
                e.currentTarget.style.color = 'var(--c-accent)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.color = 'var(--c-sub)'
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {available.length > 0 && (
        <select
          aria-label={t('addSection')}
          className="mt-1.5 w-full text-xs border border-dashed border-gray-300 rounded px-1.5 py-1 text-gray-400 bg-white"
          value=""
          onChange={(e) => {
            if (e.target.value) onAdd(e.target.value)
          }}
        >
          <option value="">{t('addSection')}</option>
          {available.map((id) => (
            <option key={id} value={id}>
              {getLabel(id)}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
