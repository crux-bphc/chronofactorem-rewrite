import * as React from "react"

import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      data-skeleton
      className={cn(
        "rounded-md bg-sunk bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--surface)_55%,transparent),transparent)] bg-[length:200%_100%] bg-no-repeat animate-[skeleton-sweep_1.6s_linear_infinite] motion-reduce:animate-none",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
