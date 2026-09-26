'use client'

import { useTranslations } from 'next-intl'
import type { StyleParam } from '../types'

export default function StyleParamField({
  p,
  value,
  onChange,
}: {
  p: StyleParam
  value: string | number | undefined
  onChange: (key: string, value: string | number) => void
}) {
  const t = useTranslations()
  if (p.type === 'color') {
    const v = (value as string) ?? p.default
    return (
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={p.key} className="text-xs flex-1" style={{ color: 'var(--c-ink2)' }}>
          {t(p.labelKey)}
        </label>
        <div className="flex items-center gap-1.5">
          <input
            id={p.key}
            type="color"
            value={v}
            onChange={(e) => onChange(p.key, e.target.value)}
            className="w-7 h-7 rounded cursor-pointer p-0.5"
            style={{ border: '1px solid var(--c-line)', background: 'var(--c-card)' }}
          />
          <span className="text-xs font-mono w-16 text-right" style={{ color: 'var(--c-faint)' }}>
            {v}
          </span>
        </div>
      </div>
    )
  }
  if (p.type === 'select') {
    return (
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={p.key} className="text-xs flex-1" style={{ color: 'var(--c-ink2)' }}>
          {t(p.labelKey)}
        </label>
        <select
          id={p.key}
          value={(value as string) ?? p.default}
          onChange={(e) => onChange(p.key, e.target.value)}
          className="text-xs rounded px-2 py-1 max-w-36"
          style={{
            border: '1px solid var(--c-line)',
            background: 'var(--c-card)',
            color: 'var(--c-ink)',
          }}
        >
          {p.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    )
  }
  if (p.type === 'toggle') {
    const checked = ((value as string) ?? p.default) === 'true'
    return (
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs flex-1" style={{ color: 'var(--c-ink2)' }}>
          {t(p.labelKey)}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={t(p.labelKey)}
          onClick={() => onChange(p.key, checked ? 'false' : 'true')}
          className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
          style={{ background: checked ? 'var(--c-accent)' : 'var(--c-line)' }}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-1'}`}
          />
        </button>
      </div>
    )
  }
  if (p.type === 'text') {
    // qr_url is the only text-type param that exists — its placeholder is worth
    // translating (it's real guidance text, not just a font name like the select
    // options below), so it gets its own key rather than a generic `placeholderKey`
    // threaded through every param for a single use.
    const placeholder = p.key === 'qr_url' ? t('styleParams.shared.qr_url_placeholder') : ''
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={p.key} className="text-xs" style={{ color: 'var(--c-ink2)' }}>
          {t(p.labelKey)}
        </label>
        <input
          id={p.key}
          type="text"
          value={(value as string) ?? p.default}
          placeholder={placeholder}
          onChange={(e) => onChange(p.key, e.target.value)}
          className="text-xs rounded px-2 py-1 w-full"
          style={{
            border: '1px solid var(--c-line)',
            background: 'var(--c-card)',
            color: 'var(--c-ink)',
          }}
        />
      </div>
    )
  }
  // range
  const v = (value as number) ?? p.default
  const decimals = p.step >= 1 ? 0 : p.step >= 0.1 ? 1 : 2
  const pct = ((v - p.min) / (p.max - p.min)) * 100
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={p.key} className="text-xs" style={{ color: 'var(--c-ink2)' }}>
          {t(p.labelKey)}
        </label>
        <span className="text-xs font-mono" style={{ color: 'var(--c-faint)' }}>
          {v.toFixed(decimals)}
          {p.unit}
        </span>
      </div>
      <input
        id={p.key}
        type="range"
        min={p.min}
        max={p.max}
        step={p.step}
        value={v}
        onChange={(e) => onChange(p.key, parseFloat(e.target.value))}
        className="w-full h-1.5"
        style={{
          accentColor: 'var(--c-accent)',
          background: `linear-gradient(to right, var(--c-accent) ${pct}%, var(--c-line) ${pct}%)`,
        }}
      />
      <div className="flex justify-between text-xs mt-0.5" style={{ color: 'var(--c-faint)' }}>
        <span>
          {p.min}
          {p.unit}
        </span>
        <span>
          {p.max}
          {p.unit}
        </span>
      </div>
    </div>
  )
}
