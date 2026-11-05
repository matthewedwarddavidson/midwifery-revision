import { useEffect, useRef } from 'react'

export function useKeyHandler(active: boolean, handler: (key: string) => boolean) {
  const handlerRef = useRef(handler)
  useEffect(() => {
    handlerRef.current = handler
  })

  useEffect(() => {
    if (!active) return
    function onKey(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (handlerRef.current(event.key)) event.preventDefault()
    }
    // Register after the current event finishes, so the key press that
    // activated this handler isn't handled twice.
    const timer = setTimeout(() => window.addEventListener('keydown', onKey), 0)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
    }
  }, [active])
}
