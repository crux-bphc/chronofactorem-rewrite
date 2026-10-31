import { cn } from "@/lib/utils";

type HapticKind = "selection" | "success" | "warning" | "error";

const patterns: Record<HapticKind, number | number[]> = {
  selection: 10,
  success: [15, 60, 25],
  warning: [30, 80, 30],
  error: [40, 60, 40, 60, 40],
};

const coarse = () => window.matchMedia("(pointer: coarse)").matches;

export function haptic(kind: HapticKind) {
  if (typeof navigator.vibrate !== "function" || !coarse()) return;
  // Chrome blocks (and logs) a vibrate before the first tap on the page
  if (navigator.userActivation?.hasBeenActive === false) return;
  try {
    navigator.vibrate(patterns[kind]);
  } catch {
    // never let a buzz break the tap that asked for it
  }
}

const switchTick =
  typeof window !== "undefined" &&
  typeof navigator.vibrate !== "function" &&
  coarse();

// iOS has no vibrate, but Safari ticks when a real tap toggles a switch input,
// even through its label. Put this last inside a `relative` button.
export function HapticTap({ className }: { className?: string }) {
  if (!switchTick) return null;
  return (
    <label
      aria-hidden="true"
      className={cn(
        "absolute inset-0 z-1 touch-manipulation [-webkit-tap-highlight-color:transparent]",
        className,
      )}
    >
      <input
        type="checkbox"
        {...{ switch: "" }}
        tabIndex={-1}
        // the label's own click already reached the button
        onClick={(e) => e.stopPropagation()}
        className="invisible absolute size-px"
      />
    </label>
  );
}
