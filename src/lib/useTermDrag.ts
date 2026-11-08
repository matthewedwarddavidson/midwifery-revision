import { useRef, useState, type PointerEvent } from 'react'

export interface DragPosition {
  term: string
  x: number
  y: number
}

/** How far the pointer must move before a press becomes a drag; shorter moves count as taps. */
const DRAG_THRESHOLD = 6

/**
 * Drag terms with mouse, pen or touch. Uses pointer events because the browser's own drag and drop
 * doesn't work with touch. `onDrop` gets the element under the pointer when the term is let go.
 */
export function useTermDrag(onDrop: (term: string, target: Element | null) => void) {
  const [drag, setDrag] = useState<DragPosition | null>(null)
  const press = useRef<{ term: string; x: number; y: number; moved: boolean } | null>(null)
  const justDragged = useRef(false)

  function dragHandlers(term: string) {
    return {
      onPointerDown(event: PointerEvent<HTMLElement>) {
        if (event.button !== 0) return
        press.current = { term, x: event.clientX, y: event.clientY, moved: false }
        event.currentTarget.setPointerCapture(event.pointerId)
      },
      onPointerMove(event: PointerEvent<HTMLElement>) {
        const current = press.current
        if (!current) return
        const distance = Math.hypot(event.clientX - current.x, event.clientY - current.y)
        if (!current.moved && distance < DRAG_THRESHOLD) return
        current.moved = true
        setDrag({ term: current.term, x: event.clientX, y: event.clientY })
      },
      onPointerUp(event: PointerEvent<HTMLElement>) {
        const current = press.current
        press.current = null
        if (!current?.moved) return
        setDrag(null)
        justDragged.current = true
        onDrop(current.term, document.elementFromPoint(event.clientX, event.clientY))
      },
      onPointerCancel() {
        press.current = null
        setDrag(null)
      },
    }
  }

  /** A drag ends with a click on the dragged element; click handlers call this to ignore that click. */
  function wasDrag(): boolean {
    const result = justDragged.current
    justDragged.current = false
    return result
  }

  return { drag, dragHandlers, wasDrag }
}
