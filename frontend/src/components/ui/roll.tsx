import * as React from "react";
import { cn } from "@/lib/utils";

/** Swaps `value` with a vertical slide. The first render does not animate. */
export function Roll({
  value,
  className,
}: {
  value: string | number;
  className?: string;
}) {
  const key = String(value);
  const [current, setCurrent] = React.useState({ key, value });
  const [leaving, setLeaving] = React.useState<{
    key: string;
    value: string | number;
  } | null>(null);

  if (current.key !== key) {
    setLeaving(current);
    setCurrent({ key, value });
  }

  React.useEffect(() => {
    if (!leaving) return;
    const id = window.setTimeout(() => setLeaving(null), 220);
    return () => window.clearTimeout(id);
  }, [leaving]);

  return (
    <span className={cn("inline-grid overflow-hidden", className)}>
      {leaving && (
        <span
          key={`out-${leaving.key}`}
          aria-hidden="true"
          className="col-start-1 row-start-1 animate-[cf-roll-out_var(--d-2)_var(--e-out)_both]"
        >
          {leaving.value}
        </span>
      )}
      <span
        key={`in-${current.key}`}
        className={cn(
          "col-start-1 row-start-1",
          leaving && "animate-[cf-roll-in_var(--d-2)_var(--e-out)_both]",
        )}
      >
        {current.value}
      </span>
    </span>
  );
}
