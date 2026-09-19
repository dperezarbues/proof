/** Shared titled-body section used by /terms and /help — a simple accent-label
 *  heading over a block of paragraphs, separated by a top rule. */
export default function PageSection({
  title,
  children,
  testId,
}: {
  title: string
  children: React.ReactNode
  testId?: string
}) {
  return (
    <div
      style={{
        borderTop: '1px solid var(--c-line)',
        paddingTop: '1.5rem',
        paddingBottom: '1.5rem',
      }}
    >
      <p
        data-testid={testId}
        style={{
          fontFamily: 'var(--f-mono)',
          fontSize: 10,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--c-accent)',
          marginBottom: '0.5rem',
        }}
      >
        {title}
      </p>
      <div style={{ fontSize: 14, color: 'var(--c-sub)', lineHeight: 1.65 }} className="space-y-2">
        {children}
      </div>
    </div>
  )
}
