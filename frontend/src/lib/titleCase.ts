const ROMAN = /^(?=[IVX])X{0,3}(IX|IV|V?I{0,3})$/i;

export function titleCase(s: string): string {
  return s
    .split(/([\s\-/(),]+)/)
    .map((w) => {
      if (ROMAN.test(w)) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join("");
}
