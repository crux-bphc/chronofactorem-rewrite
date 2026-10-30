const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const nextFrame = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
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
  document.startViewTransition({
    update: async () => {
      await update();
      await nextFrame();
    },
    types: [`panel-${direction}`],
  });
}

export const panelForward = (fn: () => unknown) => () =>
  runPanelTransition("forward", fn);

export const panelBack = (fn: () => unknown) => () =>
  runPanelTransition("back", fn);

/** Applied to the content root of the list/search view and of the picker. */
export const PANEL_VT_CLASS = "[view-transition-name:cf-panel]";
