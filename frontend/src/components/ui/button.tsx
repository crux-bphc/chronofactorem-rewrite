import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap leading-none transition-[transform,background-color,color,border-color] duration-(--d-1) ease-(--e-out) active:scale-[.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none aria-invalid:border-danger hover:cursor-pointer",
  {
    variants: {
      variant: {
        primary: "bg-brand text-brand-ink hover:bg-brand/90",
        secondary: "border border-line bg-surface text-ink hover:bg-ev",
        quiet: "bg-transparent text-ink-muted hover:bg-ev hover:text-ink",
        danger: "bg-danger text-white hover:bg-danger/90",
        tint: "bg-brand-bg text-brand hover:bg-brand-bg/70",
        link: "text-brand underline-offset-4 hover:underline",
        // Legacy names, same look as their new counterparts.
        default: "bg-brand text-brand-ink hover:bg-brand/90",
        destructive: "bg-danger text-white hover:bg-danger/90",
        outline: "border border-line bg-surface text-ink hover:bg-ev",
        ghost: "bg-transparent text-ink-muted hover:bg-ev hover:text-ink",
        card: "border border-line bg-surface text-ink hover:bg-ev",
      },
      size: {
        default:
          "h-12 rounded-xl px-4 text-lg font-semibold has-[>svg]:px-3",
        sm: "h-[38px] rounded-md gap-1.5 px-3 text-base font-medium has-[>svg]:px-2.5",
        lg: "h-12 rounded-xl px-4 text-lg font-semibold has-[>svg]:px-3",
        icon: "size-9 rounded-md",
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
