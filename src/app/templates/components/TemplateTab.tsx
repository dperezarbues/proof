'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import type { Layout, Template } from '../types'
import { AccentTag } from './GalleryAtoms'

export function TemplateTab({
  templates,
  activeTemplate,
  activeLayout,
  onSelectTemplate,
  onSelectLayout,
}: {
  templates: Template[]
  activeTemplate: Template
  activeLayout: Layout
  onSelectTemplate: (t: Template) => void
  onSelectLayout: (l: Layout) => void
}) {
  const t = useTranslations('editor')
  const tCatalog = useTranslations('templateCatalog')
  return (
    <div className="p-4">
      <div
        className="font-bold text-[15px] uppercase tracking-[0.01em] mb-1"
        style={{ color: 'var(--c-ink)' }}
      >
        {t('chooseTemplate')}
      </div>
      <p className="text-[12px] mb-4" style={{ color: 'var(--c-sub)' }}>
        {templates.length} {t('templatesMoreOnWay')}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {templates.map((tpl) => {
          const on = activeTemplate.id === tpl.id
          const tplName = tCatalog(`${tpl.id}.name`)
          return (
            <button
              key={tpl.id}
              type="button"
              data-testid={`template-btn-${tpl.id}`}
              onClick={() => onSelectTemplate(tpl)}
              aria-pressed={on}
              className="relative rounded-[3px] p-2 text-left transition-shadow"
              style={{
                background: '#fff',
                boxShadow: on ? `0 0 0 2px var(--c-accent)` : 'inset 0 0 0 1px var(--c-line)',
              }}
            >
              {/* Template thumbnail */}
              <div
                className="h-24 mb-2 overflow-hidden relative"
                style={{ background: '#f5f5f5', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)' }}
              >
                <Image
                  src={`/thumbnails/${tpl.id}.png`}
                  alt={tCatalog('previewAlt', { name: tplName })}
                  fill
                  className="object-cover object-top"
                  sizes="152px"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-[12px]" style={{ color: 'var(--c-ink)' }}>
                  {tplName}
                </span>
                {on && (
                  <span className="text-[18px]" style={{ color: 'var(--c-accent)' }}>
                    ✓
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {activeTemplate.layouts.length > 1 && (
        <div className="mt-5">
          <AccentTag>{t('layoutVariant')}</AccentTag>
          <div className="flex gap-2 mt-2.5">
            {activeTemplate.layouts.map((l) => (
              <button
                key={l.id}
                type="button"
                data-testid={`layout-btn-${l.id}`}
                onClick={() => onSelectLayout(l)}
                aria-pressed={activeLayout.id === l.id}
                className="flex-1 py-2 rounded-[3px] font-bold text-[12px] uppercase tracking-[0.02em] transition-opacity"
                style={{
                  background: activeLayout.id === l.id ? 'var(--c-ink)' : 'transparent',
                  color: activeLayout.id === l.id ? 'var(--c-paper)' : 'var(--c-ink2)',
                  boxShadow: activeLayout.id === l.id ? 'none' : 'inset 0 0 0 1.3px var(--c-line)',
                }}
              >
                {tCatalog(`${activeTemplate.id}.layouts.${l.id}`)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
