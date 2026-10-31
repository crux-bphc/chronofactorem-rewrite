import { useMemo, useRef } from "react";

const MIN_DISTANCE = 48;
// left to the browser's own edge swipes (back and forward)
const EDGE = 24;

/**
 * Touch swipes across the phone's day view: left for the next day, right for
 * the previous. Vertical drags stay the page's scroll.
 */
export function useDaySwipe(
  day: number,
  dayCount: number,
  showDay?: (day: number) => void,
) {
  const start = useRef<{ id: number; x: number; y: number } | null>(null);
  return useMemo(() => {
    if (!showDay) return {};
    return {
      style: { touchAction: "pan-y pinch-zoom" },
      onPointerDown: (e: React.PointerEvent) => {
        if (e.pointerType !== "touch") return;
        if (e.clientX < EDGE || e.clientX > window.innerWidth - EDGE) return;
        start.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
      },
      onPointerUp: (e: React.PointerEvent) => {
        const from = start.current;
        start.current = null;
        if (from?.id !== e.pointerId) return;
        const dx = e.clientX - from.x;
        const dy = e.clientY - from.y;
        if (Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) < 2 * Math.abs(dy))
          return;
        const next = day + (dx < 0 ? 1 : -1);
        if (next >= 0 && next < dayCount) showDay(next);
      },
      onPointerCancel: () => {
        start.current = null;
      },
    };
  }, [day, dayCount, showDay]);
}
