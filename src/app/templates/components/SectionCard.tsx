'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { DEFAULT_POST, DEFAULT_PRE } from '../layout-serializer'
import SpacingRow from './SpacingRow'

type Props = {
  sortableId: string
  label: React.ReactNode
  breakable: boolean
  preSpacing: number | undefined
  postSpacing: number | undefined
  onToggleBreakable: () => void
  onRemove: () => void
  onSpacingChange: (pre: number | undefined, post: number | undefined) => void
  children?: React.ReactNode
}

export default function SectionCard({
  sortableId,
  label,
  breakable,
  preSpacing,
  postSpacing,
  onToggleBreakable,
  onRemove,
  onSpacingChange,
  children,
}: Props) {
  const t = useTranslations('editor')
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sortableId,
  })
  const [spacingOpen, setSpacingOpen] = useState(preSpacing != null || postSpacing != null)

  const hasCustomSpacing = preSpacing != null || postSpacing != null
  const curPre = preSpacing ?? DEFAULT_PRE
  const curPost = postSpacing ?? DEFAULT_POST

  function toggleSpacing() {
    if (spacingOpen && hasCustomSpacing) onSpacingChange(undefined, undefined)
    setSpacingOpen((x) => !x)
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 10 : undefined,
        boxShadow: 'inset 0 0 0 1px var(--c-line)',
        background: 'var(--c-card)',
        borderRadius: 3,
      }}
      className="group"
    >
      <div className="flex items-center gap-2 px-2 py-2">
        <button
          type="button"
          data-testid="section-drag-handle"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing select-none text-base leading-none px-0.5"
          style={{ color: 'var(--c-faint)' }}
          aria-label={t('dragToReorder')}
        >
          ⠿
        </button>
        {label}
        <button
          type="button"
          onClick={toggleSpacing}
          className="text-xs px-1 leading-none transition-colors"
          style={{ color: hasCustomSpacing ? 'var(--c-accent)' : 'var(--c-faint)' }}
          title={t('perSectionSpacing')}
          aria-label={t('perSectionSpacing')}
          aria-expanded={spacingOpen}
        >
          ↕
        </button>
        <label
          className="flex items-center gap-1 text-xs select-none cursor-pointer"
          style={{ color: 'var(--c-sub)' }}
        >
          <input
            type="checkbox"
            checked={breakable}
            onChange={onToggleBreakable}
            className="w-3 h-3"
            style={{ accentColor: 'var(--c-accent)' }}
          />
          <span>{t('breakToggleLabel')}</span>
        </label>
        <button
          type="button"
          data-testid="remove-section"
          onClick={onRemove}
          className="opacity-0 pointer-coarse:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity leading-none"
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
          aria-label={t('removeSection')}
        >
          ×
        </button>
      </div>
      {spacingOpen && (
        <SpacingRow
          pre={curPre}
          post={curPost}
          onChange={(pre, post) => onSpacingChange(pre, post)}
          onClear={() => {
            onSpacingChange(undefined, undefined)
            setSpacingOpen(false)
          }}
        />
      )}
      {children}
    </div>
  )
}
