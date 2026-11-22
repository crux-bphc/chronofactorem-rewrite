import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center border transition-colors",
  {
    variants: {
      variant: {
        chip: "gap-1 rounded-full border-line bg-sunk px-2.5 py-0.5 text-[12.5px] font-medium text-ink-muted",
        "chip-brand":
          "gap-1 rounded-full border-transparent bg-brand-bg px-2.5 py-0.5 text-[12.5px] font-medium text-brand",
        pill: "rounded-sm border-transparent bg-sunk px-1.5 py-0.5 font-mono text-[11px] font-medium text-ink-muted",
        "pill-ghost":
          "rounded-sm border-dashed border-ink-faint bg-transparent px-1.5 py-0.5 font-mono text-[11px] font-medium text-ink-muted",
        // Legacy names.
        default:
          "rounded-full border-transparent bg-brand px-2.5 py-0.5 text-sm font-medium text-brand-ink",
        secondary:
          "rounded-full border-transparent bg-sunk px-2.5 py-0.5 text-sm font-medium text-ink",
        destructive:
          "rounded-full border-transparent bg-danger px-2.5 py-0.5 text-sm font-medium text-danger-ink",
        outline:
          "rounded-full border-line px-2.5 py-0.5 text-sm font-medium text-ink",
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
