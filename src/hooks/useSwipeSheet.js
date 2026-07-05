import { useCallback, useEffect, useRef, useState } from 'react';

const DISMISS_RATIO = 0.3;
const VELOCITY_THRESHOLD = 0.5; // px/ms
const TAP_SLOP = 6; // px

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = e => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}

/**
 * Drag-to-open/close gesture for a bottom sheet (axis 'y') or side panel (axis 'x').
 * Shared by DetailPanel (dismiss-only) and MobileFilterSheet (open + close).
 */
export function useSwipeSheet({
  axis = 'y',
  open,
  onOpenChange,
  closedOffset,
  closeDirection = 1,
  scrollRef = null,
  tapToggles = false,
}) {
  const reducedMotion = usePrefersReducedMotion();
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const gestureRef = useRef(null);

  useEffect(() => { setDragOffset(0); }, [open]);

  const getPos = e => (axis === 'y' ? e.clientY : e.clientX);

  const beginDrag = useCallback((e, alwaysAllowed) => {
    // Don't hijack taps on interactive elements (e.g. a close button living
    // inside the draggable header) — let their own click handlers fire.
    if (e.target.closest?.('button, a, input, select, textarea')) return;
    const scrollEl = scrollRef?.current;
    const atEdge = alwaysAllowed || !scrollEl || scrollEl.scrollTop <= 0;
    if (!atEdge) { gestureRef.current = null; return; }
    gestureRef.current = { startPos: getPos(e), startTime: performance.now(), pointerId: e.pointerId };
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }, [axis, scrollRef]);

  const moveDrag = useCallback(e => {
    const g = gestureRef.current;
    if (!g) return;
    const baseOffset = open ? 0 : closedOffset;
    const delta = (getPos(e) - g.startPos) * closeDirection;
    let next = baseOffset + delta;
    if (next < 0) next *= 0.35;
    if (next > closedOffset) next = closedOffset + (next - closedOffset) * 0.35;
    setDragOffset(next - baseOffset);
  }, [axis, open, closedOffset, closeDirection]);

  const endDrag = useCallback(e => {
    const g = gestureRef.current;
    gestureRef.current = null;
    if (!g) return;
    setDragging(false);
    setDragOffset(0);

    const delta = (getPos(e) - g.startPos) * closeDirection;
    const elapsed = Math.max(1, performance.now() - g.startTime);
    const velocity = delta / elapsed;

    if (tapToggles && Math.abs(delta) < TAP_SLOP) {
      onOpenChange(!open);
      return;
    }

    const travelled = Math.abs(delta);
    const ratio = closedOffset > 0 ? travelled / closedOffset : 0;
    const fastFlick = Math.abs(velocity) > VELOCITY_THRESHOLD;

    if (fastFlick) {
      onOpenChange(velocity < 0);
    } else if (ratio > DISMISS_RATIO) {
      onOpenChange(delta < 0);
    }
    // otherwise: snap back to current `open` state (dragOffset already reset above)
  }, [axis, open, closedOffset, closeDirection, tapToggles, onOpenChange]);

  const grabHandlers = {
    onPointerDown: e => beginDrag(e, true),
    onPointerMove: moveDrag,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  };

  const handlers = {
    onPointerDown: e => beginDrag(e, false),
    onPointerMove: moveDrag,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  };

  const baseOffset = open ? 0 : closedOffset;
  const offset = baseOffset + dragOffset;
  const transform = axis === 'y' ? `translateY(${offset}px)` : `translateX(${offset}px)`;

  return {
    style: {
      transform,
      transition: (dragging || reducedMotion) ? 'none' : 'transform 0.25s ease',
    },
    handlers,
    grabHandlers,
    dragging,
    reducedMotion,
  };
}
