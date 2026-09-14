'use client'

import { useEffect } from 'react'

// Root-level fallback for errors thrown above the [locale] segment (e.g. in
// LocaleLayout itself), where no NextIntlClientProvider is available — plain
// English only, and must render its own <html>/<body> since it replaces the
// root layout entirely.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          minHeight: '100svh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Something went wrong.</h1>
          <p style={{ color: '#666', marginBottom: 24 }}>
            Proof hit an unexpected error. Your saved CVs are untouched — try reloading.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              fontWeight: 700,
              padding: '12px 20px',
              borderRadius: 4,
              border: 'none',
              cursor: 'pointer',
              background: '#111',
              color: '#fff',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
