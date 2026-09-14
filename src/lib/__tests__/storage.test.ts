import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearAllData,
  disablePrivateMode,
  enablePrivateMode,
  getItem,
  isPrivateMode,
  KEYS,
  removeItem,
  setItem,
} from '../storage'

function createMockStorage() {
  const data: Record<string, string> = {}
  return {
    getItem: vi.fn((k: string) => data[k] ?? null),
    setItem: vi.fn((k: string, v: string) => {
      data[k] = v
    }),
    removeItem: vi.fn((k: string) => {
      delete data[k]
    }),
    clear: vi.fn(() => {
      for (const k in data) delete data[k]
    }),
    key: vi.fn((i: number) => Object.keys(data)[i] ?? null),
    get length() {
      return Object.keys(data).length
    },
    _data: data,
  }
}

let mockLS: ReturnType<typeof createMockStorage>
let mockSS: ReturnType<typeof createMockStorage>

beforeEach(() => {
  mockLS = createMockStorage()
  mockSS = createMockStorage()
  vi.stubGlobal('window', {})
  vi.stubGlobal('localStorage', mockLS)
  vi.stubGlobal('sessionStorage', mockSS)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// ── Normal mode ───────────────────────────────────────────────────────────────

describe('normal mode', () => {
  it('setItem and getItem round-trip via localStorage', () => {
    setItem('k', 'v')
    expect(getItem('k')).toBe('v')
    expect(mockSS._data.k).toBeUndefined()
  })

  it('getItem returns null for missing key', () => {
    expect(getItem('nope')).toBeNull()
  })

  it('writes to localStorage, not sessionStorage', () => {
    setItem(KEYS.cvs, '[]')
    expect(mockLS._data[KEYS.cvs]).toBe('[]')
    expect(mockSS._data[KEYS.cvs]).toBeUndefined()
  })
})

// ── Private mode ──────────────────────────────────────────────────────────────

describe('private mode', () => {
  beforeEach(() => {
    mockSS._data['proof-private'] = '1'
  })

  it('routes writes to sessionStorage', () => {
    setItem(KEYS.cvs, '["cv"]')
    expect(mockSS._data[KEYS.cvs]).toBe('["cv"]')
    expect(mockLS._data[KEYS.cvs]).toBeUndefined()
  })

  it('routes reads to sessionStorage', () => {
    mockSS._data[KEYS.cvs] = '["cv"]'
    expect(getItem(KEYS.cvs)).toBe('["cv"]')
  })
})

// ── isPrivateMode / enable / disable ─────────────────────────────────────────

describe('isPrivateMode', () => {
  it('returns false by default', () => {
    expect(isPrivateMode()).toBe(false)
  })

  it('returns true after enablePrivateMode', () => {
    enablePrivateMode()
    expect(isPrivateMode()).toBe(true)
  })

  it('returns false after disablePrivateMode', () => {
    mockSS._data['proof-private'] = '1'
    disablePrivateMode()
    expect(isPrivateMode()).toBe(false)
  })
})

// ── Private mode migration (enable/disable) ──────────────────────────────────
// Regression coverage: enablePrivateMode() used to only flip the flag, leaving
// whatever was already in localStorage on disk — defeating private mode for
// any CV saved before it was turned on. See storage.ts migrate().

describe('private mode migration', () => {
  it('enablePrivateMode moves existing data into sessionStorage and purges localStorage', () => {
    mockLS._data[KEYS.cvs] = '["cv"]'
    mockLS._data[KEYS.currentCv] = 'id-1'

    enablePrivateMode()

    expect(mockSS._data[KEYS.cvs]).toBe('["cv"]')
    expect(mockSS._data[KEYS.currentCv]).toBe('id-1')
    expect(mockLS._data[KEYS.cvs]).toBeUndefined()
    expect(mockLS._data[KEYS.currentCv]).toBeUndefined()
  })

  it('disablePrivateMode moves session data back into localStorage and purges sessionStorage', () => {
    mockSS._data['proof-private'] = '1'
    mockSS._data[KEYS.cvs] = '["cv"]'

    disablePrivateMode()

    expect(mockLS._data[KEYS.cvs]).toBe('["cv"]')
    expect(mockSS._data[KEYS.cvs]).toBeUndefined()
  })

  it('does not write a destination key when the source has none', () => {
    enablePrivateMode()
    expect(KEYS.cvs in mockSS._data).toBe(false)
  })
})

// ── removeItem ────────────────────────────────────────────────────────────────

describe('removeItem', () => {
  it('removes from both storages', () => {
    mockLS._data.k = 'a'
    mockSS._data.k = 'b'
    removeItem('k')
    expect(mockLS._data.k).toBeUndefined()
    expect(mockSS._data.k).toBeUndefined()
  })
})

// ── clearAllData ──────────────────────────────────────────────────────────────

describe('clearAllData', () => {
  it('clears every KEYS entry from both storages', () => {
    for (const k of Object.values(KEYS)) {
      mockLS._data[k] = 'x'
      mockSS._data[k] = 'x'
    }
    clearAllData()
    for (const k of Object.values(KEYS)) {
      expect(mockLS._data[k]).toBeUndefined()
      expect(mockSS._data[k]).toBeUndefined()
    }
  })
})

// ── Error resilience (catch paths) ───────────────────────────────────────────

describe('error resilience', () => {
  it('getItem returns null when storage throws', () => {
    mockLS.getItem.mockImplementation(() => {
      throw new Error('storage unavailable')
    })
    expect(getItem('k')).toBeNull()
  })

  it('setItem does not propagate when storage throws', () => {
    mockLS.setItem.mockImplementation(() => {
      throw new Error('quota exceeded')
    })
    expect(() => setItem('k', 'v')).not.toThrow()
  })

  it('removeItem does not propagate when localStorage throws', () => {
    mockLS.removeItem.mockImplementation(() => {
      throw new Error('failed')
    })
    expect(() => removeItem('k')).not.toThrow()
  })

  it('clearAllData does not propagate when localStorage throws', () => {
    mockLS.removeItem.mockImplementation(() => {
      throw new Error('failed')
    })
    expect(() => clearAllData()).not.toThrow()
  })

  it('clearAllData does not propagate when sessionStorage throws', () => {
    mockSS.removeItem.mockImplementation(() => {
      throw new Error('failed')
    })
    expect(() => clearAllData()).not.toThrow()
  })

  it('removeItem does not propagate when sessionStorage throws', () => {
    mockSS.removeItem.mockImplementation(() => {
      throw new Error('failed')
    })
    expect(() => removeItem('k')).not.toThrow()
  })

  it('isPrivateMode returns false when sessionStorage throws', () => {
    mockSS.getItem.mockImplementation(() => {
      throw new Error('failed')
    })
    expect(isPrivateMode()).toBe(false)
  })

  it('store() falls back to localStorage when sessionStorage.getItem throws', () => {
    mockSS.getItem.mockImplementation(() => {
      throw new Error('failed')
    })
    setItem('k', 'v')
    expect(mockLS._data.k).toBe('v')
  })

  it('enablePrivateMode does not propagate when sessionStorage throws', () => {
    mockSS.setItem.mockImplementation(() => {
      throw new Error('failed')
    })
    expect(() => enablePrivateMode()).not.toThrow()
  })

  it('disablePrivateMode does not propagate when sessionStorage throws', () => {
    mockSS.removeItem.mockImplementation(() => {
      throw new Error('failed')
    })
    expect(() => disablePrivateMode()).not.toThrow()
  })
})

// ── SSR / no-window environment ───────────────────────────────────────────────

describe('no-window environment (SSR)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('getItem returns null', () => {
    expect(getItem('key')).toBeNull()
  })

  it('setItem does not throw', () => {
    expect(() => setItem('k', 'v')).not.toThrow()
  })
})
