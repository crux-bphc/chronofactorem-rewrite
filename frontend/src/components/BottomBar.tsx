import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Phone thumb-zone action bar. On desktop it sits inline after the content. */
export function BottomBar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 bg-linear-to-t from-bg from-70% to-transparent px-4 pt-3 pb-[calc(26px+env(safe-area-inset-bottom))] lg:static lg:bg-none lg:px-0 lg:pt-8 lg:pb-0",
        className,
      )}
    >
      <div className="mx-auto flex max-w-[640px] gap-2.5 *:flex-1 lg:mx-0 lg:*:flex-none">
        {children}
      </div>
    </div>
  );
}
