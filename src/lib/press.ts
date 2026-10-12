const HOLD_MS = 450;
const SLOP_PX = 8;

type Point = { x: number; y: number };

let scrollLocked = false;

/**
 * Lets an in-progress press stop the page from scrolling under a dragged tile. iOS only honors
 * preventDefault from a non-passive touchmove listener that exists before the touch starts.
 */
export function blockTouchScroll() {
  const block = (event: TouchEvent) => {
    if (scrollLocked && event.cancelable) event.preventDefault();
  };
  window.addEventListener('touchmove', block, { passive: false });
  return () => window.removeEventListener('touchmove', block);
}

export type PressHandlers = {
  onTap(): void;
  /** The pointer has been held still long enough to count as a long press. */
  onHold(): void;
  /** Released after a long press without dragging. */
  onMenu(at: Point): void;
  /** Pixels moved since the press started. */
  onDrag(dx: number, dy: number): void;
  onDrop(): void;
  /** Always called last, however the press ended. */
  onEnd(): void;
};

/**
 * Recognizes a tap, a long press, or a drag. Touch drags must start with a long press so a quick
 * swipe still scrolls the page; mouse drags start as soon as the pointer moves.
 */
export function trackPress(el: HTMLElement, event: PointerEvent, handlers: PressHandlers) {
  const { clientX: x0, clientY: y0 } = event;
  const mouse = event.pointerType === 'mouse';
  let state: 'pending' | 'held' | 'dragging' = 'pending';

  const timer = setTimeout(() => {
    state = 'held';
    scrollLocked = true;
    handlers.onHold();
  }, HOLD_MS);

  const onMove = (e: PointerEvent) => {
    const dx = e.clientX - x0;
    const dy = e.clientY - y0;
    if (state !== 'dragging') {
      if (Math.hypot(dx, dy) < SLOP_PX) return;
      if (state === 'pending' && !mouse) return stop();
      clearTimeout(timer);
      state = 'dragging';
      scrollLocked = true;
    }
    handlers.onDrag(dx, dy);
  };

  const onUp = (e: PointerEvent) => {
    if (state === 'pending') handlers.onTap();
    else if (state === 'held') handlers.onMenu({ x: e.clientX, y: e.clientY });
    else handlers.onDrop();
    stop();
  };

  const onCancel = () => {
    if (state === 'dragging') handlers.onDrop();
    stop();
  };

  function stop() {
    clearTimeout(timer);
    scrollLocked = false;
    el.removeEventListener('pointermove', onMove);
    el.removeEventListener('pointerup', onUp);
    el.removeEventListener('pointercancel', onCancel);
    handlers.onEnd();
  }

  el.setPointerCapture(event.pointerId);
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', onCancel);
}

/** Reports pixels moved from the press point until the pointer is released. */
export function trackDrag(
  el: HTMLElement,
  event: PointerEvent,
  onDrag: (dx: number, dy: number) => void,
  onDrop: () => void,
) {
  const { clientX: x0, clientY: y0 } = event;
  const onMove = (e: PointerEvent) => onDrag(e.clientX - x0, e.clientY - y0);

  el.setPointerCapture(event.pointerId);
  el.addEventListener('pointermove', onMove);
  el.addEventListener(
    'lostpointercapture',
    () => {
      el.removeEventListener('pointermove', onMove);
      onDrop();
    },
    { once: true },
  );
}
