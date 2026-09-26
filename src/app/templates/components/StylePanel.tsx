'use client'

import { useTranslations } from 'next-intl'
import type { StyleParam, StyleValues } from '../types'
import StyleGroup from './StyleGroup'
import StyleParamField from './StyleParamField'

type Props = {
  styleParams: StyleParam[]
  style: StyleValues
  setStyleValue: (key: string, value: string | number) => void
  resetStyle: () => void
}

export default function StylePanel({ styleParams, style, setStyleValue, resetStyle }: Props) {
  const t = useTranslations('editor')
  const tGroups = useTranslations('styleParams')
  const groupOrder: string[] = []
  const groupMap = new Map<string, StyleParam[]>()
  const ungrouped: StyleParam[] = []

  for (const p of styleParams) {
    if (!p.group) {
      ungrouped.push(p)
      continue
    }
    if (!groupMap.has(p.group)) {
      groupOrder.push(p.group)
      groupMap.set(p.group, [])
    }
    groupMap.get(p.group)?.push(p)
  }

  return (
    <div className="px-4">
      {ungrouped.length > 0 && (
        <div className="space-y-3 pb-3">
          {ungrouped.map((p) => (
            <StyleParamField key={p.key} p={p} value={style[p.key]} onChange={setStyleValue} />
          ))}
        </div>
      )}
      {groupOrder.map((g, i) => (
        <StyleGroup key={g} title={tGroups(`groups.${g}`)} defaultOpen={i === 0}>
          {(groupMap.get(g) ?? []).map((p) => (
            <StyleParamField key={p.key} p={p} value={style[p.key]} onChange={setStyleValue} />
          ))}
        </StyleGroup>
      ))}
      <div className="pt-2 mt-1" style={{ borderTop: '1px solid var(--c-line)' }}>
        <button
          type="button"
          onClick={resetStyle}
          className="text-xs px-3 py-1.5 rounded-[3px] transition-colors"
          style={{
            boxShadow: 'inset 0 0 0 1.3px var(--c-line)',
            color: 'var(--c-ink2)',
          }}
        >
          {t('resetStyleDefaults')}
        </button>
      </div>
    </div>
  )
}
