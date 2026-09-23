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
      <h2
        data-testid={testId}
        style={{
          fontFamily: 'var(--f-mono)',
          fontSize: 10,
          fontWeight: 400,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--c-accent-text)',
          marginBottom: '0.5rem',
        }}
      >
        {title}
      </h2>
      <div style={{ fontSize: 14, color: 'var(--c-sub)', lineHeight: 1.65 }} className="space-y-2">
        {children}
      </div>
    </div>
  )
}
