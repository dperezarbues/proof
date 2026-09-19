// Guards vercel.json's CSP string directly, without a browser. This is the
// fast, always-run counterpart to e2e/csp-violations.spec.ts: a normal e2e
// run against `next dev` can never catch a CSP regression (see that file's
// header comment for why), so this test exists to catch a bad edit to the
// header value itself — e.g. accidentally dropping 'unsafe-eval' again,
// which broke PDF generation/download outright without any local signal.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const vercelConfig = JSON.parse(readFileSync(join(__dirname, '../../../vercel.json'), 'utf-8'))

function findHeader(key: string): string {
  const rootRule = vercelConfig.headers.find((h: { source: string }) => h.source === '/(.*)')
  const header = rootRule.headers.find((h: { key: string }) => h.key === key)
  if (!header) throw new Error(`Header "${key}" not found on the root ("/(.*)") rule`)
  return header.value as string
}

describe('vercel.json Content-Security-Policy', () => {
  const csp = findHeader('Content-Security-Policy')

  it("allows 'unsafe-eval' — dropping this breaks PDF generation/download outright, not just a defense-in-depth nicety", () => {
    expect(csp).toContain("'unsafe-eval'")
  })

  it("allows 'wasm-unsafe-eval' for the Typst WASM compiler", () => {
    expect(csp).toContain("'wasm-unsafe-eval'")
  })

  it('allows the GoatCounter script host in script-src', () => {
    const scriptSrc = csp.match(/script-src ([^;]+);/)?.[1] ?? ''
    expect(scriptSrc).toContain('https://gc.zgo.at')
  })

  it('allows the GoatCounter beacon target in connect-src', () => {
    const connectSrc = csp.match(/connect-src ([^;]+);/)?.[1] ?? ''
    expect(connectSrc).toContain('https://*.goatcounter.com')
  })

  it('allows worker-src blob: for the Typst compile worker', () => {
    const workerSrc = csp.match(/worker-src ([^;]+);/)?.[1] ?? ''
    expect(workerSrc).toContain('blob:')
  })
})

describe('vercel.json other security headers', () => {
  it('sets HSTS', () => {
    expect(findHeader('Strict-Transport-Security')).toContain('max-age=')
  })

  it('sets X-Content-Type-Options: nosniff', () => {
    expect(findHeader('X-Content-Type-Options')).toBe('nosniff')
  })
})
