'use client'

import { useTranslations } from 'next-intl'
import { useContext, useState } from 'react'
import { LabelCtx } from '../contexts'
import type { EditorSection } from '../types'
import ColumnSlot from './ColumnSlot'
import SectionCard from './SectionCard'

export default function SortableCard({
  item,
  available,
  onToggleBreakable,
  onRemove,
  onUpdateColumn,
  onSpacingChange,
}: {
  item: EditorSection
  available: string[]
  onToggleBreakable: () => void
  onRemove: () => void
  onUpdateColumn: (ci: number, secs: string[]) => void
  onSpacingChange: (pre: number | undefined, post: number | undefined) => void
}) {
  const getLabel = useContext(LabelCtx)
  const t = useTranslations('editor')
  const [expanded, setExpanded] = useState(false)

  if (item.kind === 'full') {
    return (
      <SectionCard
        sortableId={item.key}
        label={
          <span className="flex-1 text-sm text-gray-800" data-testid="section-label">
            {getLabel(item.id)}
          </span>
        }
        breakable={item.breakable}
        preSpacing={item.pre_spacing}
        postSpacing={item.post_spacing}
        onToggleBreakable={onToggleBreakable}
        onRemove={onRemove}
        onSpacingChange={onSpacingChange}
      />
    )
  }

  return (
    <SectionCard
      sortableId={item.key}
      label={
        <button
          type="button"
          onClick={() => setExpanded((x) => !x)}
          className="flex-1 flex items-center gap-1.5 text-sm text-gray-700 text-left"
        >
          <span className="text-gray-400 text-xs">{expanded ? '▾' : '▸'}</span>
          <span>{t('columnsGroupLabel', { n: item.columns })}</span>
          <span className="text-xs text-gray-400 ml-1">
            ({item.content.map((c) => c.length).join('+')})
          </span>
        </button>
      }
      breakable={item.breakable}
      preSpacing={item.pre_spacing}
      postSpacing={item.post_spacing}
      onToggleBreakable={onToggleBreakable}
      onRemove={onRemove}
      onSpacingChange={onSpacingChange}
    >
      {expanded && (
        <div
          className="grid gap-2 px-2 pb-2 border-t border-gray-100 pt-2"
          style={{ gridTemplateColumns: `repeat(${item.columns}, 1fr)` }}
        >
          {item.content.map((col, ci) => (
            <ColumnSlot
              // biome-ignore lint/suspicious/noArrayIndexKey: column order is stable; no identity beyond position
              key={ci}
              label={t('columnLabel', { n: ci + 1 })}
              sections={col}
              available={available}
              onRemove={(si) =>
                onUpdateColumn(
                  ci,
                  col.filter((_, j) => j !== si),
                )
              }
              onAdd={(id) => onUpdateColumn(ci, [...col, id])}
            />
          ))}
        </div>
      )}
    </SectionCard>
  )
}
