'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

type RenderState = 'idle' | 'loading' | 'ready' | 'error'

const ZOOM_STEP = 0.15
const ZOOM_MIN = 0.5
const ZOOM_MAX = 2.0

export default function PdfJsViewer({
  src,
  reserveBottom = false,
}: {
  src: string
  /** True while a bottom banner (e.g. the sample-CTA bar) is covering the
   * viewer's own bottom-right corner, so zoom controls need to sit higher. */
  reserveBottom?: boolean
}) {
  const t = useTranslations('pdfPreview')
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [renderState, setRenderState] = useState<RenderState>('idle')
  const [renderError, setRenderError] = useState<string>('')
  const [renderedSrc, setRenderedSrc] = useState('')
  const renderGenRef = useRef(0)
  const lastSrcRef = useRef('')
  const [zoom, setZoom] = useState(1.0)

  useEffect(() => {
    const container = containerRef.current
    const scrollArea = scrollAreaRef.current
    if (!container || !src) return
    const gen = ++renderGenRef.current

    // Only show the loading spinner when the PDF source itself changes, not on zoom
    if (src !== lastSrcRef.current) {
      setRenderState('loading')
      lastSrcRef.current = src
    }

    const abort = new AbortController()

    ;(async () => {
      try {
        const resp = await fetch(src, { signal: abort.signal })
        if (!resp.ok) throw new Error(`fetch ${resp.status}`)
        const data = await resp.arrayBuffer()

        if (renderGenRef.current !== gen) return

        // pdfjs v6 uses Map.prototype.getOrInsertComputed (ES2025, Chrome 136+)
        // biome-ignore lint/suspicious/noExplicitAny: polyfilling a non-standard prototype method
        const proto = Map.prototype as any
        if (typeof proto.getOrInsertComputed !== 'function') {
          proto.getOrInsertComputed = function <K, V>(key: K, callbackFn: (k: K) => V): V {
            if (!this.has(key)) this.set(key, callbackFn(key))
            return this.get(key)
          }
        }
        const pdfjs = await import('pdfjs-dist')
        if (renderGenRef.current !== gen) return

        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

        const pdf = await pdfjs.getDocument({ data }).promise
        if (renderGenRef.current !== gen) return

        const containerWidth = scrollArea?.clientWidth || container.clientWidth || 600
        const dpr = window.devicePixelRatio || 1
        const pages: HTMLDivElement[] = []

        for (let i = 1; i <= pdf.numPages; i++) {
          if (renderGenRef.current !== gen) return
          const page = await pdf.getPage(i)
          const baseViewport = page.getViewport({ scale: 1 })
          const cssScale = (containerWidth / baseViewport.width) * zoom
          const cssViewport = page.getViewport({ scale: cssScale })
          const renderViewport = page.getViewport({ scale: cssScale * dpr })

          const wrapper = document.createElement('div')
          wrapper.style.cssText = `position:relative;width:${Math.floor(cssViewport.width)}px;height:${Math.floor(cssViewport.height)}px;margin:${i > 1 ? '8' : '0'}px auto 0;--total-scale-factor:${((cssScale * 96) / 72).toFixed(6)};--scale-round-x:1px;--scale-round-y:1px`

          const canvas = document.createElement('canvas')
          canvas.width = Math.floor(renderViewport.width)
          canvas.height = Math.floor(renderViewport.height)
          canvas.style.cssText = 'width:100%;display:block;'
          wrapper.appendChild(canvas)

          const textLayerDiv = document.createElement('div')
          textLayerDiv.className = 'textLayer'
          wrapper.appendChild(textLayerDiv)

          await page.render({ canvas, viewport: renderViewport }).promise
          if (renderGenRef.current !== gen) return

          const textContent = await page.getTextContent()
          if (renderGenRef.current !== gen) return

          const textLayer = new pdfjs.TextLayer({
            textContentSource: textContent,
            container: textLayerDiv,
            viewport: cssViewport,
          })
          await textLayer.render()
          if (renderGenRef.current !== gen) return

          pages.push(wrapper)
        }

        if (renderGenRef.current !== gen) return
        container.replaceChildren(...pages)
        setRenderedSrc(src)
        setRenderState('ready')
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        if (renderGenRef.current === gen) {
          const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
          setRenderError(msg)
          setRenderState('error')
        }
      }
    })()

    return () => {
      abort.abort()
    }
  }, [src, zoom])

  return (
    <div
      className="w-full h-full relative"
      data-testid="pdfjs-viewer"
      data-pdf-src={src}
      data-render-state={renderState}
      data-rendered-src={renderedSrc}
    >
      <div
        ref={scrollAreaRef}
        className="w-full h-full overflow-y-auto overflow-x-auto"
        style={{ background: 'var(--c-paper-deep)' }}
      >
        <div ref={containerRef} />
      </div>

      {/* Covers stale content the instant `src` changes, not just once the effect below
          gets around to setting renderState — React commits/paints the new `src` prop
          before that effect runs, and without this the old canvas (bound to a template
          that no longer matches currentPdf) is briefly visible underneath whatever chrome
          (e.g. the sample banner) also reacted to the same prop change. */}
      {(renderState === 'loading' || renderedSrc !== src) && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'var(--c-paper-deep)' }}
          data-testid="pdfjs-loading-cover"
        >
          <div
            className="w-8 h-8 border-[3px] border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--c-accent)', borderTopColor: 'transparent' }}
          />
        </div>
      )}
      {renderState === 'error' && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'var(--c-paper-deep)' }}
        >
          <p className="text-sm" style={{ color: 'var(--c-sub)' }}>
            {renderError || 'Failed to render PDF'}
          </p>
        </div>
      )}

      {/* Zoom controls — outside scroll area so they stay fixed in place.
          Shifted up when a bottom banner would otherwise sit underneath them. */}
      <div
        className={`absolute ${reserveBottom ? 'bottom-16' : 'bottom-4'} right-4 z-10 flex items-center rounded overflow-hidden shadow-lg transition-[bottom]`}
        style={{ background: 'var(--c-ink)' }}
      >
        <button
          type="button"
          disabled={zoom <= ZOOM_MIN}
          onClick={() => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)))}
          className="px-3 py-1.5 text-sm font-bold disabled:opacity-30 hover:opacity-75 transition-opacity"
          style={{ color: 'var(--c-paper)' }}
          aria-label={t('zoomOut')}
        >
          −
        </button>
        <span
          className="text-xs font-mono w-10 text-center select-none"
          style={{ color: 'var(--c-paper)' }}
        >
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          disabled={zoom >= ZOOM_MAX}
          onClick={() => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)))}
          className="px-3 py-1.5 text-sm font-bold disabled:opacity-30 hover:opacity-75 transition-opacity"
          style={{ color: 'var(--c-paper)' }}
          aria-label={t('zoomIn')}
        >
          +
        </button>
      </div>
    </div>
  )
}
