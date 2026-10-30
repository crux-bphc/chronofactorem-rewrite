import { Bird } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** The empty-state bird. Hops once on mount unless motion is reduced. */
export function EmptyBird({ className }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const hop = el.animate(
      [
        { transform: "translateY(0)" },
        { transform: "translateY(-10px)", offset: 0.4 },
        { transform: "translateY(0)" },
      ],
      { duration: 300, easing: "cubic-bezier(.2,0,0,1)" },
    );
    return () => hop.cancel();
  }, []);

  return (
    <Bird
      ref={ref}
      size={112}
      strokeWidth={1.5}
      aria-hidden="true"
      className={cn("text-ink-faint", className)}
    />
  );
}
