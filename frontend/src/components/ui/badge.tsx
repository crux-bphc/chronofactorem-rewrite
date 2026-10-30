import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center border transition-colors",
  {
    variants: {
      variant: {
        chip: "gap-1 rounded-full border-transparent bg-sunk px-2 py-0.5 text-sm font-semibold text-ink-muted",
        "chip-brand":
          "gap-1 rounded-full border-transparent bg-brand-bg px-2 py-0.5 text-sm font-semibold text-brand",
        pill: "rounded-sm border-transparent bg-sunk px-[7px] py-0.5 text-[11.5px] font-semibold text-ink-muted",
        "pill-ghost":
          "rounded-sm border-dashed border-ink-faint bg-transparent px-[7px] py-0.5 text-[11.5px] font-semibold text-ink-muted",
        // Legacy names.
        default:
          "rounded-full border-transparent bg-brand px-2.5 py-0.5 text-sm font-semibold text-brand-ink",
        secondary:
          "rounded-full border-transparent bg-sunk px-2.5 py-0.5 text-sm font-semibold text-ink",
        destructive:
          "rounded-full border-transparent bg-danger px-2.5 py-0.5 text-sm font-semibold text-white",
        outline:
          "rounded-full border-line px-2.5 py-0.5 text-sm font-semibold text-ink",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
