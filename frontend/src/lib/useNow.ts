import { useEffect, useState } from "react";

/**
 * The current time, refreshed on every minute boundary. `null` while disabled.
 * Re-syncs when the tab becomes visible again, so a laptop waking up (or a
 * date rollover while hidden) is caught straight away.
 */
export function useNow(enabled: boolean): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    if (!enabled) {
      setNow(null);
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      clearTimeout(timer);
      const d = new Date();
      setNow(d);
      timer = setTimeout(
        tick,
        60_000 - (d.getSeconds() * 1000 + d.getMilliseconds()) + 20,
      );
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled]);

  return enabled ? now : null;
}
