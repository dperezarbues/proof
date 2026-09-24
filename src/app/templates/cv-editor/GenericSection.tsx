'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import type { GenericItem } from './types'
import { emptyGenericItem } from './types'

const INPUT =
  'mt-0.5 w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white'
const TEXTAREA = `${INPUT} resize-none`

export type ItemFields = {
  title?: string
  subtitle?: string
  period?: string
  description?: string
  highlights?: string
  tags?: string
}

type ItemEditorProps = {
  item: GenericItem
  fields: ItemFields
  onChange: (item: GenericItem) => void
}

function ItemEditor({ item, fields, onChange }: ItemEditorProps) {
  const t = useTranslations('cvEditor')
  const set =
    (k: keyof GenericItem) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange({ ...item, [k]: e.target.value })

  return (
    <div className="space-y-2 pt-2">
      {fields.title !== undefined && (
        <label className="block text-xs text-gray-500">
          {fields.title}
          <input value={item.title} onChange={set('title')} className={INPUT} />
        </label>
      )}
      {fields.subtitle !== undefined && (
        <label className="block text-xs text-gray-500">
          {fields.subtitle}
          <input value={item.subtitle} onChange={set('subtitle')} className={INPUT} />
        </label>
      )}
      {fields.period !== undefined && (
        <label className="block text-xs text-gray-500">
          {fields.period}
          <input value={item.period} onChange={set('period')} className={INPUT} />
        </label>
      )}
      {fields.description !== undefined && (
        <label className="block text-xs text-gray-500">
          {fields.description}
          <textarea
            value={item.description}
            onChange={set('description')}
            rows={3}
            className={TEXTAREA}
          />
        </label>
      )}
      {fields.highlights !== undefined && (
        <label className="block text-xs text-gray-500">
          {fields.highlights}
          <span className="text-gray-400 font-normal"> · {t('onePerLine')}</span>
          <textarea
            value={item.highlights}
            onChange={set('highlights')}
            rows={4}
            className={TEXTAREA}
          />
        </label>
      )}
      {fields.tags !== undefined && (
        <label className="block text-xs text-gray-500">
          {fields.tags}
          <span className="text-gray-400 font-normal"> · {t('commaSeparated')}</span>
          <input value={item.tags} onChange={set('tags')} className={INPUT} />
        </label>
      )}
    </div>
  )
}

type Props = {
  items: GenericItem[]
  fields: ItemFields
  addLabel: string
  getTitle: (item: GenericItem) => string
  onChange: (items: GenericItem[]) => void
}

export function GenericSection({ items, fields, addLabel, getTitle, onChange }: Props) {
  const t = useTranslations('cvEditor')
  const [open, setOpen] = useState<Set<number>>(new Set(items.length > 0 ? [0] : []))

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })

  const add = () => {
    onChange([...items, emptyGenericItem()])
    setOpen((prev) => new Set([...prev, items.length]))
  }

  const remove = (i: number) => {
    onChange(items.filter((_, j) => j !== i))
    setOpen((prev) => {
      const next = new Set<number>()
      for (const idx of prev) {
        if (idx !== i) next.add(idx > i ? idx - 1 : idx)
      }
      return next
    })
  }

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= items.length) return
    const next = [...items]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
    setOpen((prev) => {
      const next = new Set<number>()
      for (const idx of prev) {
        if (idx === i) next.add(j)
        else if (idx === j) next.add(i)
        else next.add(idx)
      }
      return next
    })
  }

  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: items are identified by position; stable keys not needed here
        <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center gap-1 bg-gray-50 pl-2 pr-1">
            <button
              type="button"
              onClick={() => toggle(i)}
              aria-expanded={open.has(i)}
              className="flex-1 flex items-center gap-1 py-1.5 text-left min-w-0"
            >
              <span className="flex-1 text-xs font-medium text-gray-700 truncate min-w-0">
                {getTitle(item) || (
                  <span className="text-gray-400 font-normal italic">{t('newEntry')}</span>
                )}
              </span>
              <span className="text-gray-400 text-[10px] shrink-0">{open.has(i) ? '▲' : '▼'}</span>
            </button>
            <button
              type="button"
              aria-label={t('moveUp')}
              onClick={() => move(i, -1)}
              disabled={i === 0}
              className="min-w-6 min-h-6 flex items-center justify-center text-gray-300 hover:text-gray-500 disabled:opacity-30 text-xs"
            >
              ↑
            </button>
            <button
              type="button"
              aria-label={t('moveDown')}
              onClick={() => move(i, 1)}
              disabled={i === items.length - 1}
              className="min-w-6 min-h-6 flex items-center justify-center text-gray-300 hover:text-gray-500 disabled:opacity-30 text-xs"
            >
              ↓
            </button>
            <button
              type="button"
              aria-label={t('remove')}
              onClick={() => remove(i)}
              className="min-w-6 min-h-6 flex items-center justify-center text-gray-300 hover:text-red-400 text-sm"
            >
              ×
            </button>
          </div>
          {open.has(i) && (
            <div className="px-3 pb-3">
              <ItemEditor
                item={item}
                fields={fields}
                onChange={(upd) => {
                  const next = [...items]
                  next[i] = upd
                  onChange(next)
                }}
              />
            </div>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="w-full text-xs border border-dashed border-gray-300 rounded px-2 py-1.5 text-gray-500 hover:bg-gray-50 transition-colors"
      >
        + {addLabel}
      </button>
    </div>
  )
}
