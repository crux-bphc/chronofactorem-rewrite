import * as React from "react";
import { cn } from "@/lib/utils";

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function Collapse({
  open,
  children,
  onExited,
  appearOpen,
}: {
  open: boolean;
  children: React.ReactNode;
  onExited?: () => void;
  appearOpen?: boolean;
}) {
  // With appearOpen, mount expanded and let the closing play on the next frame.
  const [settled, setSettled] = React.useState(!appearOpen);
  React.useEffect(() => {
    if (settled) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setSettled(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [settled]);
  const expanded = settled ? open : true;

  const exitedRef = React.useRef(onExited);
  exitedRef.current = onExited;
  React.useEffect(() => {
    if (!open && settled && reducedMotion()) exitedRef.current?.();
  }, [open, settled]);

  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-(--d-2) ease-(--e-out)",
        expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      )}
      onTransitionEnd={(e) => {
        if (
          e.target === e.currentTarget &&
          e.propertyName === "grid-template-rows" &&
          !open &&
          !reducedMotion()
        ) {
          exitedRef.current?.();
        }
      }}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
