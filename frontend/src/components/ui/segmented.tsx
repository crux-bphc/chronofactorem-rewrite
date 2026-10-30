import * as React from "react"

import { cn } from "@/lib/utils"

type SegmentedOption<T extends string> = {
  value: T
  label: React.ReactNode
  "aria-label"?: string
}

interface SegmentedProps<T extends string> {
  value: T
  onValueChange: (v: T) => void
  options: SegmentedOption<T>[]
  size?: "md" | "sm"
  className?: string
}

function Segmented<T extends string>({
  value,
  onValueChange,
  options,
  size = "md",
  className,
}: SegmentedProps<T>) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([])
  const count = options.length
  const found = options.findIndex((o) => o.value === value)
  const index = Math.max(found, 0)

  const move = (to: number) => {
    const next = (to + count) % count
    onValueChange(options[next].value)
    refs.current[next]?.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault()
        move(index + 1)
        break
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault()
        move(index - 1)
        break
      case "Home":
        e.preventDefault()
        move(0)
        break
      case "End":
        e.preventDefault()
        move(count - 1)
        break
    }
  }

  return (
    <div
      role="radiogroup"
      onKeyDown={onKeyDown}
      className={cn(
        "relative grid rounded-md bg-sunk p-[3px]",
        size === "md" ? "h-10" : "h-8",
        className
      )}
      style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-[3px] bottom-[3px] left-[3px] rounded-[8px] bg-surface shadow-sm transition-transform duration-(--d-2) ease-(--e-out)"
        style={{
          width: `calc((100% - 6px) / ${count})`,
          transform: `translateX(${index * 100}%)`,
        }}
      />
      {options.map((o, i) => (
        <button
          key={o.value}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="button"
          role="radio"
          aria-checked={i === index}
          aria-label={o["aria-label"]}
          tabIndex={i === index ? 0 : -1}
          onClick={() => onValueChange(o.value)}
          className={cn(
            "relative z-10 flex cursor-pointer items-center justify-center gap-1.5 rounded-[8px] px-3 font-semibold transition-colors duration-(--d-1)",
            size === "md" ? "text-base" : "text-sm",
            i === index ? "text-ink" : "text-ink-muted hover:text-ink"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export { Segmented }
export type { SegmentedProps, SegmentedOption }
