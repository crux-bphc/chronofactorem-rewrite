import * as React from "react"
import { Drawer } from "vaul"
import { ChevronLeft, X } from "lucide-react"

import { cn } from "@/lib/utils"

const Sheet = ({
  shouldScaleBackground = false,
  ...props
}: React.ComponentProps<typeof Drawer.Root>) => (
  <Drawer.Root shouldScaleBackground={shouldScaleBackground} {...props} />
)
Sheet.displayName = "Sheet"

const SheetTrigger = Drawer.Trigger

const SheetClose = Drawer.Close

const SheetContent = React.forwardRef<
  React.ElementRef<typeof Drawer.Content>,
  React.ComponentPropsWithoutRef<typeof Drawer.Content> & { full?: boolean }
>(({ full = false, className, children, ...props }, ref) => (
  <Drawer.Portal>
    <Drawer.Overlay className="fixed inset-0 z-50 bg-(--scrim) [animation-duration:var(--d-3)]! [animation-timing-function:var(--e-out)]!" />
    <Drawer.Content
      ref={ref}
      aria-describedby={undefined}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-sheet bg-bg text-ink shadow-float outline-none data-[state=open]:[animation-duration:var(--d-3)]! data-[state=open]:[animation-timing-function:var(--e-spring)]! data-[state=closed]:[animation-duration:var(--d-2)]! data-[state=closed]:[animation-timing-function:var(--e-in)]!",
        full ? "top-14" : "pb-[26px]",
        className
      )}
      {...props}
    >
      <div
        aria-hidden
        className="mx-auto mb-1.5 mt-2 h-[5px] w-[38px] shrink-0 rounded-full bg-line"
      />
      {children}
    </Drawer.Content>
  </Drawer.Portal>
))
SheetContent.displayName = "SheetContent"

const SheetHeader = ({
  title,
  onBack,
  className,
}: {
  title: React.ReactNode
  onBack?: () => void
  className?: string
}) => (
  <div
    className={cn(
      "flex shrink-0 items-center justify-between gap-2 px-4 pb-2.5 pt-1",
      className
    )}
  >
    <div className="flex min-w-0 items-center gap-1.5">
      {onBack && (
        <button
          type="button"
          aria-label="Back"
          onClick={onBack}
          className="-ml-1 inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-ink-muted transition-colors duration-(--d-1) hover:text-ink"
        >
          <ChevronLeft className="size-5" />
        </button>
      )}
      <Drawer.Title className="truncate text-[19px] font-semibold">
        {title}
      </Drawer.Title>
    </div>
    <Drawer.Close
      aria-label="Close"
      className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-ink-muted transition-colors duration-(--d-1) hover:text-ink"
    >
      <X className="size-5" />
    </Drawer.Close>
  </div>
)
SheetHeader.displayName = "SheetHeader"

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader }
