import * as React from "react"

import { cn } from "@/lib/utils"

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

type Tab<T extends string> = {
  value: T
  label: React.ReactNode
  content: React.ReactNode
}

interface TabsProps<T extends string> {
  value: T
  onValueChange: (v: T) => void
  tabs: Tab<T>[]
  "aria-label"?: string
  className?: string
  listClassName?: string
  tabClassName?: string
  panelClassName?: string
}

// Panels sit side by side on a scroll-snap track, so a sideways swipe switches
// too. The value only changes once the track comes to rest.
function Tabs<T extends string>({
  value,
  onValueChange,
  tabs,
  "aria-label": ariaLabel,
  className,
  listClassName,
  tabClassName,
  panelClassName,
}: TabsProps<T>) {
  const id = React.useId()
  const trackRef = React.useRef<HTMLDivElement>(null)
  const barRef = React.useRef<HTMLSpanElement>(null)
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([])
  const panelRefs = React.useRef<(HTMLDivElement | null)[]>([])
  const found = tabs.findIndex((t) => t.value === value)
  const index = Math.max(found, 0)

  const latest = React.useRef({ tabs, value, onValueChange })
  React.useLayoutEffect(() => {
    latest.current = { tabs, value, onValueChange }
  })

  const leftOf = (i: number) => panelRefs.current[i]?.offsetLeft ?? 0

  const restingIndex = () => {
    const x = trackRef.current?.scrollLeft ?? 0
    let best = 0
    panelRefs.current.forEach((_, i) => {
      if (Math.abs(leftOf(i) - x) < Math.abs(leftOf(best) - x)) best = i
    })
    return best
  }

  const placeBar = () => {
    const track = trackRef.current
    const bar = barRef.current
    if (!track || !bar) return
    const x = track.scrollLeft
    const last = panelRefs.current.length - 1
    let i = 0
    while (i < last - 1 && leftOf(i + 1) <= x) i++
    const span = leftOf(i + 1) - leftOf(i)
    const t = last > 0 && span > 0 ? Math.min(Math.max((x - leftOf(i)) / span, 0), 1) : 0
    const a = tabRefs.current[i]
    const b = tabRefs.current[Math.min(i + 1, last)] ?? a
    if (!a || !b) return
    const left = a.offsetLeft + (b.offsetLeft - a.offsetLeft) * t
    const width = a.offsetWidth + (b.offsetWidth - a.offsetWidth) * t
    bar.style.width = `${width}px`
    bar.style.transform = `translateX(${left}px)`
    // the label lights up as soon as its panel is the nearer one
    const near = restingIndex()
    tabRefs.current.forEach((tab, j) => tab?.toggleAttribute("data-current", j === near))
  }

  // the value moved without the track (first render, history): jump to it
  React.useLayoutEffect(() => {
    const track = trackRef.current
    if (track && restingIndex() !== index) {
      track.scrollTo({ left: leftOf(index), behavior: "instant" })
    }
    placeBar()
  }, [index])

  React.useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const settle = () => {
      const { tabs, value, onValueChange } = latest.current
      const next = tabs[restingIndex()]?.value
      if (next !== undefined && next !== value) onValueChange(next)
    }
    // no scrollend (older Safari): settle once scroll events stop coming
    const hasScrollEnd = "onscrollend" in window
    let timer: ReturnType<typeof setTimeout> | undefined
    const onScroll = () => {
      placeBar()
      if (!hasScrollEnd) {
        clearTimeout(timer)
        timer = setTimeout(settle, 150)
      }
    }
    track.addEventListener("scroll", onScroll, { passive: true })
    if (hasScrollEnd) track.addEventListener("scrollend", settle)
    const ro = new ResizeObserver(() => placeBar())
    ro.observe(track)
    tabRefs.current.forEach((tab) => tab && ro.observe(tab))
    return () => {
      clearTimeout(timer)
      track.removeEventListener("scroll", onScroll)
      track.removeEventListener("scrollend", settle)
      ro.disconnect()
    }
  }, [])

  const select = (i: number) => {
    const track = trackRef.current
    if (!track) return
    const left = leftOf(i)
    if (reducedMotion() || Math.abs(track.scrollLeft - left) < 1) {
      track.scrollTo({ left, behavior: "instant" })
      if (tabs[i].value !== value) onValueChange(tabs[i].value)
      return
    }
    // the value follows on scrollend
    track.scrollTo({ left, behavior: "smooth" })
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const count = tabs.length
    const to = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: count - 1,
    }[e.key]
    if (to === undefined) return
    e.preventDefault()
    const next = (to + count) % count
    select(next)
    tabRefs.current[next]?.focus()
  }

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        aria-orientation="horizontal"
        onKeyDown={onKeyDown}
        className={cn(
          "relative flex items-center border-b border-line text-ink-muted",
          listClassName
        )}
      >
        {tabs.map((t, i) => (
          <button
            key={t.value}
            ref={(el) => {
              tabRefs.current[i] = el
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${t.value}`}
            aria-selected={i === index}
            aria-controls={`${id}-panel-${t.value}`}
            tabIndex={i === index ? 0 : -1}
            onClick={() => select(i)}
            className={cn(
              "inline-flex cursor-pointer items-center justify-center whitespace-nowrap px-3 py-2.5 text-base font-medium text-ink-muted transition-colors duration-(--d-1) hover:text-ink focus-visible:outline-2 focus-visible:outline-ring data-current:text-ink",
              tabClassName
            )}
          >
            {t.label}
          </button>
        ))}
        <span
          ref={barRef}
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-px left-0 h-0.5 rounded-full bg-ink"
        />
      </div>
      <div
        ref={trackRef}
        className="relative flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] lg:gap-8 [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((t, i) => (
          <div
            key={t.value}
            ref={(el) => {
              panelRefs.current[i] = el
            }}
            role="tabpanel"
            id={`${id}-panel-${t.value}`}
            aria-labelledby={`${id}-tab-${t.value}`}
            inert={i !== index}
            className={cn(
              "min-h-0 w-full shrink-0 snap-start snap-always overflow-y-auto",
              panelClassName
            )}
          >
            {t.content}
          </div>
        ))}
      </div>
    </div>
  )
}

export { Tabs }
export type { Tab, TabsProps }
