'use client'

export default function AccordionSection({
  title,
  badge,
  isOpen,
  onToggle,
  children,
}: {
  title: string
  badge?: number
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            {title}
          </span>
          {badge !== undefined && badge > 0 && (
            <span className="bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded-full leading-none">
              {badge}
            </span>
          )}
        </div>
        <span className="text-gray-400 text-xs">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && <div className="pb-3">{children}</div>}
    </div>
  )
}
