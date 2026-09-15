'use client'

import QRCode from 'qrcode'
import { useCallback, useEffect, useRef, useState } from 'react'
import { compileTypst, isCompilerReady, onCompilerReady } from '@/lib/typst-compile'
import { resolveQrUrl as defaultResolveQrUrl } from '../cv-editor/cv-utils'
import type { CompileState } from '../types'

const AUTO_GENERATE_DELAY_MS = 600

export function useCompiler({
  templateId,
  cvContent,
  getLayoutData,
  generateTrigger = 0,
  onPdfChange,
  onGenerating,
  resolveQrUrl = defaultResolveQrUrl,
}: {
  templateId: string
  cvContent: string
  getLayoutData: () => object
  generateTrigger?: number
  onPdfChange: (url: string) => void
  onGenerating: (v: boolean) => void
  resolveQrUrl?: (cv: string, style: Record<string, unknown>) => string
}) {
  const [compileState, setCompileState] = useState<CompileState>('idle')
  const [compilerReady, setCompilerReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refs to always-current values so generate() is stable (no stale closures)
  const pendingRef = useRef(false)
  const layoutRef = useRef(getLayoutData)
  const cvRef = useRef(cvContent)
  const onPdfRef = useRef(onPdfChange)
  const onGeneratingRef = useRef(onGenerating)
  const compileStateRef = useRef(compileState)
  const resolveQrUrlRef = useRef(resolveQrUrl)

  useEffect(() => {
    layoutRef.current = getLayoutData
  }, [getLayoutData])
  useEffect(() => {
    cvRef.current = cvContent
  }, [cvContent])
  useEffect(() => {
    onPdfRef.current = onPdfChange
  }, [onPdfChange])
  useEffect(() => {
    onGeneratingRef.current = onGenerating
  }, [onGenerating])
  useEffect(() => {
    compileStateRef.current = compileState
  }, [compileState])
  useEffect(() => {
    resolveQrUrlRef.current = resolveQrUrl
  }, [resolveQrUrl])

  const generate = useCallback(async () => {
    if (compileStateRef.current !== 'idle') {
      pendingRef.current = true
      return
    }
    pendingRef.current = false
    setError(null)

    const layoutData = layoutRef.current()
    const cv = cvRef.current

    setCompileState(isCompilerReady() ? 'compiling' : 'loading')
    onGeneratingRef.current(true)
    if (!isCompilerReady()) onCompilerReady(() => setCompileState('compiling'))

    try {
      let qrSvg: string | undefined
      const style = (layoutData as { style?: Record<string, unknown> }).style ?? {}
      if (style.show_qr === 'true') {
        const qrUrl = resolveQrUrlRef.current(cv, style)
        qrSvg = await QRCode.toString(qrUrl, { type: 'svg', margin: 0 })
      }

      const url = await compileTypst({
        templateId,
        cvContent: cv,
        layoutJson: JSON.stringify(layoutData),
        qrSvg,
      })
      // cvContent can change while this compile is in flight (cold WASM
      // loads take several seconds) — e.g. the CV being compiled gets
      // deleted, or another one becomes active. A stale result must never
      // overwrite what's now on screen; the pendingRef retry below already
      // re-triggers a fresh compile for whatever content is current.
      if (cvRef.current === cv) onPdfRef.current(url)
    } catch (err) {
      if (cvRef.current === cv) setError(err instanceof Error ? err.message : String(err))
    } finally {
      compileStateRef.current = 'idle'
      setCompileState('idle')
      onGeneratingRef.current(false)
      if (pendingRef.current) {
        pendingRef.current = false
        generate()
      }
    }
  }, [templateId]) // templateId is the only prop that isn't ref-stabilized

  useEffect(() => {
    if (isCompilerReady()) {
      setCompilerReady(true)
      return
    }
    onCompilerReady(() => setCompilerReady(true))
  }, [])

  // Auto-generate when parent signals via trigger (e.g. first CV save)
  useEffect(() => {
    const cv = cvRef.current
    if (generateTrigger > 0 && compileStateRef.current === 'idle' && cv) generate()
  }, [generateTrigger, generate])

  // Auto-generate on any layout, style, or CV content change (debounced) —
  // except the first time this mount ever sees real content, which compiles
  // immediately instead. That first appearance is either a fresh mount
  // racing CV hydration from storage (cvContent starts empty, then becomes
  // real once loaded), or EditorShell remounting after a template/layout
  // switch (cvContent is already real on this instance's very first render,
  // since the CV was already loaded before the switch) — in both cases
  // there's no rapid interactive editing in flight to debounce against, so
  // waiting only means momentarily showing stale/wrong preview content (the
  // sample PDF, or — worse, for the remount case — never triggering a
  // compile at all, since nothing else changes afterward to re-fire this
  // effect) for no benefit.
  const hasGeneratedRef = useRef(false)
  // biome-ignore lint/correctness/useExhaustiveDependencies: getLayoutData and cvContent are hook params that change reactively
  useEffect(() => {
    if (!cvRef.current) return
    if (!hasGeneratedRef.current) {
      hasGeneratedRef.current = true
      generate()
      return
    }
    const timer = setTimeout(() => generate(), AUTO_GENERATE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [getLayoutData, cvContent, generate])

  return { compileState, compilerReady, error, generate }
}
