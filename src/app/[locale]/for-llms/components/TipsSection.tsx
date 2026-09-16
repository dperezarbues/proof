import { type ForLlmsT, Section } from './shared'

const TIP_KEYS = ['contactTypes', 'summaryParagraphs', 'tags', 'links', 'omit', 'subtitle'] as const

export function TipsSection({ t }: { t: ForLlmsT }) {
  return (
    <Section id="tips" title={t('tips.heading')}>
      <div className="space-y-4">
        {TIP_KEYS.map((key) => (
          <div key={key} style={{ display: 'flex', gap: 16 }}>
            <div
              style={{
                flexShrink: 0,
                width: 3,
                background: 'var(--c-accent-soft)',
                borderRadius: 99,
                marginTop: 4,
                border: '1px solid var(--c-accent)',
              }}
            />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-ink)', marginBottom: 4 }}>
                {t(`tips.tips.${key}.title`)}
              </p>
              <p style={{ fontSize: 13, color: 'var(--c-sub)', lineHeight: 1.65 }}>
                {t(`tips.tips.${key}.body`)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}
