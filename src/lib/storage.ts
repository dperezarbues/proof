// Storage abstraction for Proof.
// In normal mode  → localStorage  (persists across sessions)
// In private mode → sessionStorage (auto-clears when tab closes)
//
// Private mode flag is stored in sessionStorage itself — it lives only for the
// current tab and is never written to localStorage.

const PRIVATE_FLAG = 'proof-private'

export const KEYS = {
  cvs: 'proof-cvs',
  currentCv: 'proof-current-cv',
  styleOverrides: 'proof-style-overrides',
  layoutOverrides: 'proof-layout-overrides',
  saves: 'proof-saves',
  onboarded: 'proof-onboarded',
  supportPrompted: 'proof-support-prompted',
} as const

function store(): Storage {
  if (typeof window === 'undefined')
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    }
  try {
    return sessionStorage.getItem(PRIVATE_FLAG) ? sessionStorage : localStorage
  } catch {
    return localStorage
  }
}

const devWarn = (fn: string, err: unknown) => {
  if (process.env.NODE_ENV === 'development') console.warn(`[storage] ${fn}:`, err)
}

/** Reads a value from the active storage (localStorage or sessionStorage in private mode). */
export function getItem(key: string): string | null {
  try {
    return store().getItem(key)
  } catch (err) {
    devWarn('getItem', err)
    return null
  }
}

/** Writes a value to the active storage. Silently fails if storage is unavailable (e.g. quota exceeded). */
export function setItem(key: string, value: string): void {
  try {
    store().setItem(key, value)
  } catch (err) {
    devWarn('setItem', err)
  }
}

/** Removes a key from both localStorage and sessionStorage to ensure no stale data remains. */
export function removeItem(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (err) {
    devWarn('removeItem(localStorage)', err)
  }
  try {
    sessionStorage.removeItem(key)
  } catch (err) {
    devWarn('removeItem(sessionStorage)', err)
  }
}

/** Returns true if the current tab is in private mode (session-only storage). */
export function isPrivateMode(): boolean {
  try {
    return !!sessionStorage.getItem(PRIVATE_FLAG)
  } catch (err) {
    devWarn('isPrivateMode', err)
    return false
  }
}

/** Moves every known key from one backend to the other, then purges the source. */
function migrate(from: Storage, to: Storage): void {
  for (const key of Object.values(KEYS)) {
    try {
      const val = from.getItem(key)
      if (val !== null) to.setItem(key, val)
      from.removeItem(key)
    } catch (err) {
      devWarn('migrate', err)
    }
  }
}

/**
 * Activates private mode for the current tab: moves all data into sessionStorage
 * and purges it from localStorage first, so nothing already on disk survives.
 */
export function enablePrivateMode(): void {
  try {
    migrate(localStorage, sessionStorage)
    sessionStorage.setItem(PRIVATE_FLAG, '1')
  } catch (err) {
    devWarn('enablePrivateMode', err)
  }
}

/** Deactivates private mode for the current tab, moving data back to localStorage. */
export function disablePrivateMode(): void {
  try {
    migrate(sessionStorage, localStorage)
    sessionStorage.removeItem(PRIVATE_FLAG)
  } catch (err) {
    devWarn('disablePrivateMode', err)
  }
}

/** Removes all Proof data from both localStorage and sessionStorage. */
export function clearAllData(): void {
  const allKeys = Object.values(KEYS)
  allKeys.forEach((k) => {
    try {
      localStorage.removeItem(k)
    } catch (err) {
      devWarn('clearAllData(localStorage)', err)
    }
    try {
      sessionStorage.removeItem(k)
    } catch (err) {
      devWarn('clearAllData(sessionStorage)', err)
    }
  })
}
