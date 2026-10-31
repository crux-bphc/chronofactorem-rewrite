import { X } from "lucide-react";
import { HapticTap, haptic } from "@/lib/haptics";
import type { TimetableCell } from "@/utils/timetableGrid";

/**
 * The editor's × on a phone block or tile. It is a sibling of the block's
 * open button, laid over its top-right corner (the block must be `relative`);
 * `className` places and sizes it and sets the hit area its ::after adds.
 */
export function RemoveButton({
  cell,
  disabled,
  onRemove,
  className,
  hitClassName,
  iconSize,
}: {
  cell: TimetableCell;
  disabled?: boolean;
  onRemove?: (cell: TimetableCell) => void;
  className: string;
  hitClassName: string;
  iconSize: number;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={`Remove ${cell.code} ${cell.type}${cell.number}`}
      onClick={() => {
        haptic("selection");
        onRemove?.(cell);
      }}
      className={`absolute z-1 flex cursor-pointer items-center justify-center rounded-sm text-ink-muted transition-colors duration-(--d-1) after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 hover:text-ink focus-visible:outline-2 focus-visible:outline-ring active:text-ink disabled:cursor-default ${className}`}
    >
      <X size={iconSize} />
      {!disabled && (
        <HapticTap
          className={`inset-auto top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${hitClassName}`}
        />
      )}
    </button>
  );
}
