const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Rendering (and so requestAnimationFrame) is paused while a view
// transition's update runs, so wait on macrotasks for React to commit.
const settle = () =>
  new Promise<void>((resolve) =>
    setTimeout(() => setTimeout(() => resolve(), 0), 0),
  );

/**
 * Slides the list/search view and the picker past each other. Falls back to
 * calling `update` directly without view transitions or with reduced motion.
 */
export function runPanelTransition(
  direction: "forward" | "back",
  update: () => unknown,
): void {
  if (!document.startViewTransition || reducedMotion()) {
    update();
    return;
  }
  // Older engines have startViewTransition but ignore the options object, so
  // the update callback would never run. Only use types where supported.
  if (!CSS.supports("selector(:active-view-transition-type(a))")) {
    update();
    return;
  }
  let started = false;
  const run = async () => {
    started = true;
    await update();
    await settle();
  };
  try {
    const vt = document.startViewTransition({
      update: run,
      types: [`panel-${direction}`],
    });
    // A newer transition (a quick second tap) skips this one; that's fine.
    vt.ready.catch(() => {});
  } catch {
    if (!started) update();
  }
}

export const panelForward = (fn: () => unknown) => () =>
  runPanelTransition("forward", fn);

/** Applied to the content root of the list/search view and of the picker. */
export const PANEL_VT_CLASS = "[view-transition-name:cf-panel]";
