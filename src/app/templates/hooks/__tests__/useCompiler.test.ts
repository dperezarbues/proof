// @vitest-environment jsdom
import { cleanup, renderHook, waitFor } from '@testing-library/react'
import QRCode from 'qrcode'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { compileTypst, isCompilerReady, onCompilerReady } from '@/lib/typst-compile'
import { useCompiler } from '../useCompiler'

vi.mock('qrcode', () => ({ default: { toString: vi.fn() } }))
vi.mock('@/lib/typst-compile', () => ({
  compileTypst: vi.fn(),
  isCompilerReady: vi.fn(() => true),
  onCompilerReady: vi.fn(),
}))

const compileTypstMock = vi.mocked(compileTypst)
const isCompilerReadyMock = vi.mocked(isCompilerReady)
const onCompilerReadyMock = vi.mocked(onCompilerReady)
const qrToStringMock = vi.mocked(QRCode.toString)

function setup({ showQr = false }: { showQr?: boolean } = {}) {
  const onPdfChange = vi.fn()
  const onGenerating = vi.fn()
  const getLayoutData = () => ({ style: showQr ? { show_qr: 'true' } : {} })

  const view = renderHook(() =>
    useCompiler({
      templateId: 'default',
      cvContent: '{"name":"Ada"}',
      getLayoutData,
      generateTrigger: 1,
      onPdfChange,
      onGenerating,
      resolveQrUrl: () => 'https://example.com/cv',
    }),
  )

  return { ...view, onPdfChange, onGenerating }
}

beforeEach(() => {
  isCompilerReadyMock.mockReturnValue(true)
  onCompilerReadyMock.mockImplementation(() => {})
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('useCompiler', () => {
  it('reports the compiled PDF and returns to idle on success', async () => {
    compileTypstMock.mockResolvedValue('blob:pdf-url')
    const { result, onPdfChange, onGenerating } = setup()

    await waitFor(() => expect(result.current.compileState).toBe('idle'))

    expect(onPdfChange).toHaveBeenCalledWith('blob:pdf-url')
    expect(onGenerating).toHaveBeenCalledWith(true)
    expect(onGenerating).toHaveBeenLastCalledWith(false)
    expect(result.current.error).toBeNull()
  })

  it('surfaces a compile failure via error state instead of throwing', async () => {
    compileTypstMock.mockRejectedValue(new Error('worker crashed'))
    const { result } = setup()

    await waitFor(() => expect(result.current.error).toBe('worker crashed'))
    expect(result.current.compileState).toBe('idle')
  })

  // Regression: QR generation used to run before the try block, so a throw
  // here became an unhandled rejection — onGenerating(false) never fired and
  // no error reached the UI. See useCompiler.ts generate().
  it('surfaces a QR-generation failure via error state and still clears the generating flag', async () => {
    qrToStringMock.mockRejectedValue(new Error('qr boom'))
    const { result, onGenerating } = setup({ showQr: true })

    await waitFor(() => expect(result.current.error).toBe('qr boom'))

    expect(result.current.compileState).toBe('idle')
    expect(onGenerating).toHaveBeenCalledWith(true)
    expect(onGenerating).toHaveBeenLastCalledWith(false)
    expect(compileTypstMock).not.toHaveBeenCalled()
  })
})
