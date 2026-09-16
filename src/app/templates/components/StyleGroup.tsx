'use client'

import { useState } from 'react'

export default function StyleGroup({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="first:border-t-0" style={{ borderTop: '1px solid var(--c-line)' }}>
      <button
        type="button"
        onClick={() => setOpen((x) => !x)}
        aria-expanded={open}
        className="flex items-center justify-between w-full py-2 text-left transition-colors"
        style={{ borderBottom: open ? '1px solid var(--c-line)' : undefined }}
      >
        <span
          className="text-xs font-mono uppercase tracking-widest"
          style={{ color: 'var(--c-faint)' }}
        >
          {title}
        </span>
        <span className="text-xs" style={{ color: 'var(--c-faint)' }}>
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open && <div className="space-y-3 pb-3 pt-2">{children}</div>}
    </div>
  )
}
