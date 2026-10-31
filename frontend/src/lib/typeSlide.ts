import { useLayoutEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "./viewTransitions";

/** A section list on the track, `slot` list-widths from the first one. */
export type Pane<T> = { type: T; slot: number };

type Slide<T> = {
  key: string | null;
  type: T | null;
  slot: number;
  panes: Pane<T>[];
  // which way the last switch moved, and a count so each switch animates once
  dir: 1 | -1 | 0;
  step: number;
  // the type changed within the same course, so the new list starts at the top
  top: boolean;
};

// how far a list on the track is pinned up, from its `translate`
const lift = (el: HTMLElement) =>
  Number.parseFloat(el.style.translate.split(" ")[1] ?? "") || 0;

const ms = (value: string, fallback: number) => {
  const v = value.trim();
  if (!v) return fallback;
  return Number.parseFloat(v) * (v.endsWith("ms") ? 1 : 1000);
};

/**
 * Slides section-type lists past each other on one moving track, from the
 * right when the new type is later in `order`. Panes go directly in
 * `trackRef`, the current one marked `data-current`.
 */
export function useTypeSlide<T>(
  key: string | null,
  type: T | null,
  order: readonly T[],
  ready: boolean,
) {
  const [slide, setSlide] = useState<Slide<T>>(() => ({
    key,
    type,
    slot: 0,
    panes: type === null ? [] : [{ type, slot: 0 }],
    dir: 0,
    step: 0,
    top: false,
  }));

  if (slide.key !== key || slide.type !== type) {
    const from = slide.type;
    if (
      ready &&
      slide.key === key &&
      from !== null &&
      type !== null &&
      !prefersReducedMotion()
    ) {
      const dir = order.indexOf(type) > order.indexOf(from) ? 1 : -1;
      const slot = slide.slot + dir;
      // A list already on the track keeps its node; one in the way is dropped.
      const panes = [
        ...slide.panes.filter((p) => p.type !== type && p.slot !== slot),
        { type, slot },
      ].sort((a, b) => a.slot - b.slot);
      setSlide({
        key,
        type,
        slot,
        panes,
        dir,
        step: slide.step + 1,
        top: true,
      });
    } else {
      setSlide({
        key,
        type,
        slot: 0,
        panes: type === null ? [] : [{ type, slot: 0 }],
        dir: 0,
        step: slide.step + 1,
        top: slide.key === key && from !== null,
      });
    }
  }

  const trackRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const track = trackRef.current;
    const scroller = scrollRef.current;
    if (slide.top && track && scroller) {
      // New list at the top; outgoing lists pinned so they don't move on screen
      const panes = [...track.children] as HTMLElement[];
      const current = panes.find((p) => p.dataset.current !== undefined);
      const before = scroller.scrollTop;
      const top = current ? -lift(current) : 0;
      if (current) current.style.translate = "";
      scroller.scrollTo({ top, behavior: "instant" });
      const moved = scroller.scrollTop - before;
      for (const p of panes) {
        if (p === current) continue;
        const y = lift(p) + moved;
        p.style.translate = y ? `0 ${y}px` : "";
      }
    }
    const settle = () =>
      setSlide((s) =>
        s.step === slide.step
          ? { ...s, panes: s.panes.filter((p) => p.slot === s.slot) }
          : s,
      );
    if (slide.dir === 0) {
      for (const a of track?.getAnimations() ?? []) a.cancel();
      return;
    }
    if (!track) {
      settle();
      return;
    }
    // Start from wherever a cut-short slide left the track
    const t = getComputedStyle(track).transform;
    const x = t === "none" ? 0 : new DOMMatrixReadOnly(t).m41;
    for (const a of track.getAnimations()) a.cancel();
    const gap =
      Number.parseFloat(
        getComputedStyle(track).getPropertyValue("--slide-gap"),
      ) || 0;
    const style = getComputedStyle(document.documentElement);
    const anim = track.animate(
      [
        {
          transform: `translateX(${x + slide.dir * (track.offsetWidth + gap)}px)`,
        },
        { transform: "none" },
      ],
      {
        duration: ms(style.getPropertyValue("--d-3"), 300),
        easing: style.getPropertyValue("--e-out").trim() || "ease-out",
      },
    );
    anim.onfinish = settle;
  }, [slide.step, slide.dir, slide.top]);

  return {
    panes: slide.panes,
    offset: (pane: Pane<T>) => pane.slot - slide.slot,
    trackRef,
    scrollRef,
  };
}
