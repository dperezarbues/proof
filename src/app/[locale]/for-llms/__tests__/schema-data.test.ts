import { describe, expect, it } from 'vitest'
import { commonStyleRows, SECTION_SPACING_IS_UNIFORM, sidebarSectionSpacing } from '../schema-data'

// Regression: the for-llms page's translated prose (commonNote/sidebarNote)
// hardcodes the section_pre/section_post ranges as text, since deriving
// full sentences from data wasn't worth the complexity. This test makes sure
// that if templates.json ever changes those numbers, or a template besides
// sidebar starts diverging, CI catches it instead of the page silently
// going stale again.
describe('for-llms schema-data section spacing assumptions', () => {
  it('every template except sidebar shares an identical section_pre/section_post range', () => {
    expect(SECTION_SPACING_IS_UNIFORM).toBe(true)
  })

  it('the common table section_pre/section_post rows match what commonNote/style prose says', () => {
    const pre = commonStyleRows.find((r) => r.key === 'section_pre')
    const post = commonStyleRows.find((r) => r.key === 'section_post')
    expect(pre).toMatchObject({ range: '0.2 – 0.9 em', default: '0.5' })
    expect(post).toMatchObject({ range: '0.05 – 0.4 em', default: '0.2' })
  })

  it("sidebar's widened section_pre/section_post ranges match what sidebarNote says", () => {
    expect(sidebarSectionSpacing.pre).toMatchObject({ min: 0.2, max: 1.5, default: 0.5 })
    expect(sidebarSectionSpacing.post).toMatchObject({ min: 0.05, max: 0.8, default: 0.2 })
  })
})
