'use client'

import { closestCenter, DndContext } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useContext } from 'react'
import { LabelCtx } from '../contexts'
import type { LayoutEditorHandle } from '../types'
import SortableCard from './SortableCard'
import SortableSidebarChip from './SortableSidebarChip'

type Props = {
  editor: LayoutEditorHandle
}

export default function LayoutPanel({
  editor: {
    layout,
    hasSidebar,
    sensors,
    available,
    availableSb,
    setHeader,
    handleDragEnd,
    handleSidebarDragEnd,
    addFullSection,
    addColumnsGroup,
    removeSection,
    updateSection,
    updateColumn,
    updateSpacing,
    addSidebarSection,
    removeSidebarSection,
    toggleSidebarBreakable,
    updateSidebarSpacing,
  },
}: Props) {
  const getLabel = useContext(LabelCtx)
  return (
    <>
      {hasSidebar ? (
        <div className="px-4 pb-3">
          <p className="text-xs mb-2" style={{ color: 'var(--c-faint)' }}>
            Name &amp; headline always shown
          </p>
          <p
            className="text-xs font-mono uppercase tracking-wide mb-1.5"
            style={{ color: 'var(--c-faint)' }}
          >
            Sidebar
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleSidebarDragEnd}
          >
            <SortableContext
              items={(layout.sidebarSections ?? []).map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1.5">
                {(layout.sidebarSections ?? []).map((s) => (
                  <SortableSidebarChip
                    key={s.id}
                    item={s}
                    onRemove={() => removeSidebarSection(s.id)}
                    onToggleBreakable={() => toggleSidebarBreakable(s.id)}
                    onSpacingChange={(pre, post) => updateSidebarSpacing(s.id, pre, post)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          {availableSb.length > 0 && (
            <select
              className="mt-2 w-full text-xs rounded px-2 py-1.5"
              style={{
                border: '1px dashed var(--c-line)',
                background: 'var(--c-card)',
                color: 'var(--c-sub)',
              }}
              value=""
              onChange={(e) => {
                if (e.target.value) addSidebarSection(e.target.value)
              }}
            >
              <option value="">+ add to sidebar</option>
              {availableSb.map((id) => (
                <option key={id} value={id}>
                  {getLabel(id)}
                </option>
              ))}
            </select>
          )}
          <p
            className="text-xs font-mono uppercase tracking-wide mt-4 mb-1.5"
            style={{ color: 'var(--c-faint)' }}
          >
            Main column
          </p>
        </div>
      ) : (
        <div className="px-4 pb-3">
          <p
            className="text-xs font-mono uppercase tracking-wide mb-1.5"
            style={{ color: 'var(--c-faint)' }}
          >
            Header style
          </p>
          <div className="flex gap-1 mb-3">
            {(['split', 'stacked'] as const).map((v) => (
              <button
                type="button"
                key={v}
                onClick={() => setHeader(v)}
                aria-pressed={layout.header.style === v}
                className="flex-1 text-xs py-1 rounded-[3px] transition-colors"
                style={
                  layout.header.style === v
                    ? { background: 'var(--c-ink)', color: 'var(--c-paper)', border: 'none' }
                    : {
                        color: 'var(--c-sub)',
                        background: 'transparent',
                        boxShadow: 'inset 0 0 0 1px var(--c-line)',
                      }
                }
              >
                {v}
              </button>
            ))}
          </div>
          <p
            className="text-xs font-mono uppercase tracking-wide mb-1.5"
            style={{ color: 'var(--c-faint)' }}
          >
            Sections
          </p>
        </div>
      )}

      <div className="px-4">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={layout.sections.map((s) => s.key)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1.5" data-testid="section-list">
              {layout.sections.map((item) => (
                <SortableCard
                  key={item.key}
                  item={item}
                  available={available}
                  onToggleBreakable={() =>
                    updateSection(item.key, (s) => ({ ...s, breakable: !s.breakable }))
                  }
                  onRemove={() => removeSection(item.key)}
                  onUpdateColumn={(ci, secs) => updateColumn(item.key, ci, secs)}
                  onSpacingChange={(pre, post) => updateSpacing(item.key, pre, post)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <div className="flex gap-1.5 pt-2">
          {available.length > 0 && (
            <select
              className="flex-1 text-xs rounded px-2 py-1.5"
              style={{
                border: '1px dashed var(--c-line)',
                background: 'var(--c-card)',
                color: 'var(--c-sub)',
              }}
              value=""
              onChange={(e) => {
                if (e.target.value) addFullSection(e.target.value)
              }}
            >
              <option value="">+ add section</option>
              {available.map((id) => (
                <option key={id} value={id}>
                  {getLabel(id)}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={addColumnsGroup}
            className="text-xs rounded-[3px] px-2 py-1.5 whitespace-nowrap transition-colors"
            style={{
              boxShadow: 'inset 0 0 0 1.3px var(--c-line)',
              color: 'var(--c-sub)',
            }}
          >
            + columns
          </button>
        </div>
      </div>
    </>
  )
}
