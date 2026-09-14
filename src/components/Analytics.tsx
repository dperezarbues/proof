'use client'

import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    goatcounter?: { count: (opts: { path: string }) => void }
  }
}

const GOATCOUNTER_URL = process.env.NEXT_PUBLIC_GOATCOUNTER_URL

// count.js only auto-counts the page it's loaded on. This app navigates via
// client-side routing (locale switches, editor <-> templates <-> terms), so
// every route change after the first needs an explicit count() call or those
// pageviews are simply never recorded.
export default function Analytics() {
  const pathname = usePathname()
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    window.goatcounter?.count({ path: pathname })
  }, [pathname])

  if (!GOATCOUNTER_URL) return null

  return (
    <>
      <Script id="goatcounter-config" strategy="afterInteractive">
        {
          "window.goatcounter = { no_onload: 'doNotTrack' in navigator && navigator.doNotTrack === '1' }"
        }
      </Script>
      <Script
        data-goatcounter={GOATCOUNTER_URL}
        src="https://gc.zgo.at/count.js"
        strategy="afterInteractive"
      />
    </>
  )
}
