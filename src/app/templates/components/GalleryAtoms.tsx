'use client'

export function MonoTag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="font-mono text-[9.5px] tracking-[0.12em] uppercase"
      style={{ color: 'var(--c-faint)' }}
    >
      {children}
    </span>
  )
}

export function AccentTag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="font-mono text-[9.5px] tracking-[0.12em] uppercase"
      style={{ color: 'var(--c-accent)' }}
    >
      {children}
    </span>
  )
}

export function SbBtn({
  children,
  variant = 'ghost',
  full,
  onClick,
  disabled,
  title,
  type = 'button',
  role,
  'aria-checked': ariaChecked,
  ...rest
}: {
  children: React.ReactNode
  variant?: 'primary' | 'dark' | 'ghost'
  full?: boolean
  onClick?: () => void
  disabled?: boolean
  title?: string
  type?: 'button' | 'submit'
  role?: string
  'aria-checked'?: boolean
  [key: `data-${string}`]: string | undefined
}) {
  const base = `${full ? 'flex w-full' : 'inline-flex'} items-center justify-center gap-1.5 px-3.5 py-2.5 font-bold text-[12px] rounded-[3px] uppercase tracking-[0.03em] whitespace-nowrap transition-opacity disabled:opacity-40`
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--c-accent)', color: '#fff' },
    dark: { background: 'var(--c-ink)', color: 'var(--c-paper)' },
    ghost: { color: 'var(--c-ink2)', boxShadow: 'inset 0 0 0 1.3px var(--c-line)' },
  }
  return (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: role is caller-supplied (e.g. "radio" for the CV-language picker); aria-checked is only ever paired with a role that supports it.
    <button
      type={type}
      className={base}
      style={variants[variant]}
      onClick={onClick}
      disabled={disabled}
      title={title}
      role={role}
      aria-checked={ariaChecked}
      {...rest}
    >
      {children}
    </button>
  )
}
