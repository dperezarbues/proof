'use client'

import type { CompileInput } from '@/app/templates/compile-input'
import type {
  CompileRequest,
  CompileResponse,
  WorkerInitMessage,
  WorkerMessage,
} from './typst-worker'

type PendingCallback = { resolve: (url: string) => void; reject: (err: Error) => void }

let worker: Worker | null = null
let workerReady = false
let nextId = 0
const pending = new Map<number, PendingCallback>()
const readyListeners: Array<() => void> = []

function getWorker(): Worker {
  if (worker) return worker

  worker = new Worker(new URL('./typst-worker.ts', import.meta.url))

  worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
    const msg = e.data

    if ('type' in msg && msg.type === 'ready') {
      workerReady = true
      for (const fn of readyListeners.splice(0)) fn()
      return
    }

    const resp = msg as CompileResponse
    const cb = pending.get(resp.id)
    if (!cb) return
    pending.delete(resp.id)

    if (resp.ok) {
      const blob = new Blob([resp.pdf], { type: 'application/pdf' })
      cb.resolve(URL.createObjectURL(blob))
    } else {
      cb.reject(new Error(resp.error))
    }
  }

  worker.onerror = (e) => {
    const msg = e.message ?? 'Worker error'
    for (const [id, cb] of pending) {
      cb.reject(new Error(msg))
      pending.delete(id)
    }
    readyListeners.length = 0
    worker?.terminate()
    worker = null
    workerReady = false
  }

  return worker
}

export function initTypstWorker(templateIds: string[]): void {
  const msg: WorkerInitMessage = { type: 'init', templateIds }
  getWorker().postMessage(msg)
}

export function isCompilerReady(): boolean {
  return workerReady
}

export function onCompilerReady(fn: () => void): void {
  if (workerReady) {
    fn()
    return
  }
  readyListeners.push(fn)
}

const COMPILE_TIMEOUT_MS = 30_000

/**
 * Public compile API — takes the typed `CompileInput`, not the worker's flat
 * wire format. Serializing `cv`+`language` into the single JSON blob the
 * worker shadows as /runtime/cv.json (Typst reads the language back out via
 * `_cv_language`, see src/typst/sections.typ) is this function's job alone;
 * nothing upstream needs to know that's how it's carried across the
 * postMessage boundary.
 */
export async function compileTypst(input: CompileInput): Promise<string> {
  return new Promise((resolve, reject) => {
    const id = nextId++
    const timer = setTimeout(() => {
      pending.delete(id)
      reject(new Error(`Compile timed out after ${COMPILE_TIMEOUT_MS / 1000}s`))
    }, COMPILE_TIMEOUT_MS)

    pending.set(id, {
      resolve: (url) => {
        clearTimeout(timer)
        resolve(url)
      },
      reject: (err) => {
        clearTimeout(timer)
        reject(err)
      },
    })

    const cvContent = JSON.stringify({ ...input.cv, _cv_language: input.language })
    const layoutJson = JSON.stringify(input.layoutData)
    const msg: CompileRequest = {
      id,
      templateId: input.templateId,
      cvContent,
      layoutJson,
      qrSvg: input.qrSvg,
    }
    getWorker().postMessage(msg)
  })
}
