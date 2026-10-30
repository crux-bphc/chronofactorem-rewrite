export function titleCase(s: string): string {
  return s
    .split(/(\s+)/)
    .map((w) => {
      if (/^[IVXLC]+$/i.test(w)) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join("");
}
