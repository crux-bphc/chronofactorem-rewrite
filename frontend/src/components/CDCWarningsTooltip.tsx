import { AlertOctagon } from "lucide-react";
import { useState } from "react";
import BottomSheet from "@/components/BottomSheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { WarningsList } from "@/components/WarningsList";
import { useTimetableState } from "@/context";
import { useWarningsSummary } from "@/lib/useWarningsSummary";

export const CDCWarningsTooltip = () => {
  const {
    state: { screenIsLarge },
  } = useTimetableState();
  const { missingCdcs, notFound } = useWarningsSummary();
  const [open, setOpen] = useState(false);

  if (missingCdcs.length === 0 && notFound.length === 0) return null;

  const trigger = (
    <button
      type="button"
      aria-label="Missing CDCs"
      className="p-2 rounded-full hover:bg-accent hover:text-accent-foreground transition duration-200 ease-in-out max-sm:flex max-sm:h-9 max-sm:items-center max-sm:gap-1.5 max-sm:border max-sm:bg-background max-sm:px-3 max-sm:py-0 max-sm:text-sm max-sm:font-semibold"
    >
      <AlertOctagon className="w-5 h-5 md:w-6 md:h-6 m-1 max-sm:m-0 max-sm:size-4" />
      <span className="sm:hidden">
        {missingCdcs.length > 0
          ? `${missingCdcs.length} missing CDC${missingCdcs.length > 1 ? "s" : ""}`
          : "CDCs not found"}
      </span>
    </button>
  );

  if (!screenIsLarge) {
    return (
      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        icon={<AlertOctagon className="size-5" />}
        title="Missing CDCs"
        description="CDCs for this semester that are not in your timetable."
        className="max-h-[65dvh]"
        trigger={trigger}
      >
        <WarningsList only="cdcs" onNavigate={() => setOpen(false)} />
      </BottomSheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-80 p-3">
        {missingCdcs.length > 0 && (
          <p className="pb-1 text-sm text-ink">
            You haven't added all CDCs for this semester to your timetable.
          </p>
        )}
        <WarningsList only="cdcs" onNavigate={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
};

export default CDCWarningsTooltip;
