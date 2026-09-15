import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CompileResponse, WorkerMessage } from '../typst-worker'

class FakeWorker {
  onmessage: ((e: MessageEvent<WorkerMessage>) => void) | null = null
  onerror: ((e: ErrorEvent) => void) | null = null
  postMessage = vi.fn()
  terminate = vi.fn()
  constructor(public url: URL) {}
}

let currentWorker: FakeWorker | undefined

async function loadModule() {
  return await import('../typst-compile')
}

const opts = () => ({ templateId: 'default', cvContent: '{}', layoutJson: '{}' })

beforeEach(() => {
  vi.resetModules()
  currentWorker = undefined
  vi.stubGlobal(
    'Worker',
    class extends FakeWorker {
      constructor(url: URL) {
        super(url)
        currentWorker = this
      }
    },
  )
  URL.createObjectURL = vi.fn(() => 'blob:mock-url')
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('compileTypst', () => {
  it('resolves with a blob URL on a successful compile', async () => {
    const { compileTypst } = await loadModule()
    const promise = compileTypst(opts())
    const sentMsg = currentWorker?.postMessage.mock.calls[0][0]

    currentWorker?.onmessage?.({
      data: { id: sentMsg.id, ok: true, pdf: new ArrayBuffer(4) } satisfies CompileResponse,
    } as MessageEvent<WorkerMessage>)

    await expect(promise).resolves.toBe('blob:mock-url')
  })

  it('rejects with the worker-reported error message', async () => {
    const { compileTypst } = await loadModule()
    const promise = compileTypst(opts())
    const sentMsg = currentWorker?.postMessage.mock.calls[0][0]

    currentWorker?.onmessage?.({
      data: { id: sentMsg.id, ok: false, error: 'Unknown template: x' } satisfies CompileResponse,
    } as MessageEvent<WorkerMessage>)

    await expect(promise).rejects.toThrow('Unknown template: x')
  })

  it('rejects with a timeout error naming the configured duration', async () => {
    vi.useFakeTimers()
    const { compileTypst } = await loadModule()
    const promise = compileTypst(opts())
    const rejection = expect(promise).rejects.toThrow('Compile timed out after 30s')
    await vi.advanceTimersByTimeAsync(30_000)
    await rejection
  })

  // Regression: a failed worker used to be nulled out without being terminated,
  // leaking the WASM instance + fonts it held. See typst-compile.ts onerror.
  it('terminates the worker and rejects pending compiles on a worker error', async () => {
    const { compileTypst, isCompilerReady } = await loadModule()
    const promise = compileTypst(opts())
    const failedWorker = currentWorker as FakeWorker

    failedWorker.onerror?.({ message: 'WASM init crashed' } as ErrorEvent)

    await expect(promise).rejects.toThrow('WASM init crashed')
    expect(failedWorker.terminate).toHaveBeenCalledTimes(1)
    expect(isCompilerReady()).toBe(false)
  })

  it('spins up a fresh worker for the next compile after a previous one errored', async () => {
    const { compileTypst } = await loadModule()
    const p1 = compileTypst(opts())
    const firstWorker = currentWorker as FakeWorker
    firstWorker.onerror?.({ message: 'boom' } as ErrorEvent)
    await expect(p1).rejects.toThrow()

    compileTypst(opts())
    expect(currentWorker).not.toBe(firstWorker)
  })
})

describe('compiler-ready signalling', () => {
  it('flips ready state and fires listeners once a ready message arrives', async () => {
    const { onCompilerReady, isCompilerReady, initTypstWorker } = await loadModule()
    const fn = vi.fn()
    onCompilerReady(fn)
    initTypstWorker(['default'])
    expect(isCompilerReady()).toBe(false)

    currentWorker?.onmessage?.({ data: { type: 'ready' } } as MessageEvent<WorkerMessage>)

    expect(isCompilerReady()).toBe(true)
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
