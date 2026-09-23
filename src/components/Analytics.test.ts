import { afterEach, describe, expect, it, vi } from 'vitest'
import { isDoNotTrackEnabled } from './Analytics'

// Regression: the first pageview correctly honoured navigator.doNotTrack via
// count.js's own `no_onload` option, but every subsequent SPA navigation
// (locale switch, editor <-> templates <-> terms) went through a separate
// window.goatcounter.count() call that wasn't gated on anything — a visitor
// who'd explicitly opted out was tracked on nearly the entire session after
// the first page.
describe('isDoNotTrackEnabled', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('is true when navigator.doNotTrack is "1"', () => {
    vi.stubGlobal('navigator', { doNotTrack: '1' })
    expect(isDoNotTrackEnabled()).toBe(true)
  })

  it('is false when navigator.doNotTrack is unset', () => {
    vi.stubGlobal('navigator', { doNotTrack: undefined })
    expect(isDoNotTrackEnabled()).toBe(false)
  })

  it('is false when navigator.doNotTrack is "0"', () => {
    vi.stubGlobal('navigator', { doNotTrack: '0' })
    expect(isDoNotTrackEnabled()).toBe(false)
  })

  it('is false when navigator has no doNotTrack property at all', () => {
    vi.stubGlobal('navigator', {})
    expect(isDoNotTrackEnabled()).toBe(false)
  })
})
