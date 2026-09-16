import { type ForLlmsT, Section } from './shared'

const SECTION_IDS = [
  ['summary', 'summary'],
  ['experience', 'experience'],
  ['education', 'education'],
  ['skills', 'skills'],
  ['languages', 'languages'],
  ['certifications', 'certifications'],
  ['awards', 'awards'],
  ['side_projects', 'side_projects'],
  ['contact', 'identity.contact'],
  ['core_strengths', 'core_strengths'],
  ['leadership_profile', 'leadership_profile'],
] as const

export function SectionIdsSection({ t }: { t: ForLlmsT }) {
  return (
    <Section id="sections" title={t('section2.heading')}>
      <p style={{ fontSize: 13, color: 'var(--c-sub)', marginBottom: '1rem' }}>
        {t('section2.intro')}
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr
              style={{
                fontFamily: 'var(--f-mono)',
                fontSize: 10,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--c-faint)',
                textAlign: 'left',
              }}
            >
              <th style={{ paddingBottom: 8, paddingRight: 24, fontWeight: 600 }}>
                {t('section2.tableId')}
              </th>
              <th style={{ paddingBottom: 8, paddingRight: 24, fontWeight: 600 }}>
                {t('section2.tableKey')}
              </th>
              <th style={{ paddingBottom: 8, fontWeight: 600 }}>{t('section2.tableNotes')}</th>
            </tr>
          </thead>
          <tbody>
            {SECTION_IDS.map(([id, key]) => (
              <tr
                key={id}
                style={{ borderTop: '1px solid var(--c-line2)', color: 'var(--c-ink2)' }}
              >
                <td style={{ padding: '8px 24px 8px 0' }}>
                  <code
                    style={{
                      fontFamily: 'var(--f-mono)',
                      fontSize: 11,
                      color: 'var(--c-accent-deep)',
                    }}
                  >
                    {id}
                  </code>
                </td>
                <td style={{ padding: '8px 24px 8px 0' }}>
                  <code
                    style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--c-sub)' }}
                  >
                    {key}
                  </code>
                </td>
                <td style={{ padding: '8px 0', fontSize: 12, color: 'var(--c-sub)' }}>
                  {t(`section2.notes.${id}`)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 12, color: 'var(--c-faint)', marginTop: '1rem' }}>
        {t('section2.customNote')}
      </p>
    </Section>
  )
}
