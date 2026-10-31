const ROMAN = /^(?=[IVX])X{0,3}(IX|IV|V?I{0,3})$/i;

// Words that stay upper-case when a shouty catalog name is title-cased.
const ACRONYMS = new Set([
  "AI",
  "DNA",
  "RNA",
  "VLSI",
  "RF",
  "MEMS",
  "IC",
  "CMOS",
  "IOT",
  "GIS",
  "NMR",
  "CAD",
  "DSP",
  "ML",
  "IT",
  "HR",
  "UI",
  "UX",
  "API",
  "OS",
  "DBMS",
  "PCB",
  "FPGA",
  "MOSFET",
  "BJT",
  "IPR",
  "CADD",
]);

export function titleCase(s: string): string {
  // Already mixed-case names were typed by a person; leave them alone.
  if (/[a-z]/.test(s)) return s;
  return s
    .split(/([\s\-/(),]+)/)
    .map((w) => {
      if (ACRONYMS.has(w.toUpperCase()) || ROMAN.test(w))
        return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join("");
}
