'use client'

import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Standard modal-dialog a11y behavior for components that mount when opened
 * and unmount when closed: focus moves into the dialog on open, Escape
 * closes it, Tab/Shift+Tab cycle within it instead of escaping to the page
 * behind, and focus returns to whatever triggered the dialog on close.
 *
 * onClose is read through a ref so the mount/unmount effect doesn't need it
 * in its dependency array — these modals stay mounted across unrelated
 * parent re-renders, which would otherwise re-run the effect (re-stealing
 * focus, re-registering the listener) every time the parent passes a new
 * inline onClose closure.
 */
export function useModalDialogA11y(onClose: () => void) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const prevFocusRef = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    prevFocusRef.current = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current
    const focusable = dialog?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ;(focusable?.[0] ?? dialog)?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab' || !dialog) return
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      prevFocusRef.current?.focus()
    }
  }, [])

  return dialogRef
}
