import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { TimetableSectionType } from "@/utils/timetable";

type SectionPreview = {
  preview: TimetableSectionType | null;
  setPreview: (section: TimetableSectionType | null) => void;
};

const noPreview: SectionPreview = { preview: null, setPreview: () => {} };

const SectionPreviewContext = createContext<SectionPreview>(noPreview);

/** Holds the section hovered in the picker, so the grid can ghost it. */
export function SectionPreviewProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [preview, setPreview] = useState<TimetableSectionType | null>(null);
  const value = useMemo(() => ({ preview, setPreview }), [preview]);
  return (
    <SectionPreviewContext.Provider value={value}>
      {children}
    </SectionPreviewContext.Provider>
  );
}

export function useSectionPreview(): SectionPreview {
  return useContext(SectionPreviewContext);
}

/**
 * Keeps the last non-null `value` for `ms` after it turns null, so whatever
 * shows it can fade out instead of vanishing.
 */
export function useFadingValue<T>(
  value: T | null,
  ms: number,
): { value: T | null; visible: boolean } {
  const [last, setLast] = useState<T | null>(value);
  if (value !== null && value !== last) setLast(value);
  useEffect(() => {
    if (value !== null) return;
    const timer = setTimeout(() => setLast(null), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return { value: value ?? last, visible: value !== null };
}
