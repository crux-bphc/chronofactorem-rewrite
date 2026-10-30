"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, children, ...props }, ref) => {
  const listRef = React.useRef<HTMLDivElement | null>(null)
  const [bar, setBar] = React.useState<{ left: number; width: number } | null>(
    null
  )
  const [animate, setAnimate] = React.useState(false)

  React.useEffect(() => {
    const list = listRef.current
    if (!list) return
    const measure = () => {
      const active = list.querySelector<HTMLElement>('[data-state="active"]')
      setBar((prev) => {
        if (!active) return null
        const next = { left: active.offsetLeft, width: active.offsetWidth }
        return prev && prev.left === next.left && prev.width === next.width
          ? prev
          : next
      })
    }
    measure()
    const frame = requestAnimationFrame(() => setAnimate(true))
    const mo = new MutationObserver(measure)
    mo.observe(list, {
      attributes: true,
      attributeFilter: ["data-state"],
      subtree: true,
      childList: true,
    })
    const ro = new ResizeObserver(measure)
    ro.observe(list)
    list.querySelectorAll("[role=tab]").forEach((t) => ro.observe(t))
    return () => {
      cancelAnimationFrame(frame)
      mo.disconnect()
      ro.disconnect()
    }
  }, [])

  return (
    <TabsPrimitive.List
      ref={(el) => {
        listRef.current = el
        if (typeof ref === "function") ref(el)
        else if (ref) ref.current = el
      }}
      className={cn(
        "relative inline-flex items-center border-b border-line text-ink-muted",
        className
      )}
      {...props}
    >
      {children}
      {bar && (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -bottom-px left-0 h-0.5 rounded-full bg-ink",
            animate &&
              "transition-[transform,width] duration-(--d-2) ease-(--e-out)"
          )}
          style={{ width: bar.width, transform: `translateX(${bar.left}px)` }}
        />
      )}
    </TabsPrimitive.List>
  )
})
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex cursor-pointer items-center justify-center whitespace-nowrap px-3 py-2.5 text-base font-medium text-ink-muted transition-colors duration-(--d-1) hover:text-ink disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-ink",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
