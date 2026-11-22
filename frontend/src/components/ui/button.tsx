import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap leading-none font-medium transition-[transform,background-color,color,border-color] duration-(--d-1) ease-(--e-out) [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-px active:translate-y-px active:scale-[.985] data-[state=open]:active:translate-y-0 data-[state=open]:active:scale-100 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 aria-invalid:border-danger hover:cursor-pointer",
  {
    variants: {
      variant: {
        primary: "bg-brand text-brand-ink hover:opacity-88",
        secondary:
          "border border-line bg-surface text-ink hover:border-ink/25 hover:bg-sunk",
        quiet:
          "bg-transparent text-ink-muted hover:bg-sunk hover:text-ink [@media(hover:hover)_and_(pointer:fine)]:hover:translate-y-0",
        danger: "bg-danger text-danger-ink hover:opacity-90",
        tint: "bg-brand-bg text-brand hover:opacity-88",
        link: "text-ink underline-offset-4 hover:underline [@media(hover:hover)_and_(pointer:fine)]:hover:translate-y-0",
        // Legacy names, same look as their new counterparts.
        default: "bg-brand text-brand-ink hover:opacity-88",
        destructive: "bg-danger text-danger-ink hover:opacity-90",
        outline:
          "border border-line bg-surface text-ink hover:border-ink/25 hover:bg-sunk",
        ghost:
          "bg-transparent text-ink-muted hover:bg-sunk hover:text-ink [@media(hover:hover)_and_(pointer:fine)]:hover:translate-y-0",
        card: "border border-line bg-surface text-ink hover:border-ink/25 hover:bg-sunk",
      },
      size: {
        default:
          "h-11 rounded-md px-5 text-[15px] font-medium has-[>svg]:px-4",
        sm: "relative h-9 max-lg:after:absolute max-lg:after:-inset-[3px] max-lg:after:content-[''] rounded-md gap-1.5 px-3.5 text-sm font-medium has-[>svg]:px-3",
        lg: "h-12 rounded-md px-6 text-base font-medium has-[>svg]:px-5",
        icon: "relative size-9 max-lg:after:absolute max-lg:after:-inset-[4px] max-lg:after:content-[''] rounded-md",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
