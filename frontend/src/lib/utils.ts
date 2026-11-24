import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const widePageClass =
  "mx-auto w-full max-w-[640px] px-4 pb-16 lg:max-w-[1200px] lg:px-7";
export const narrowPageClass =
  "mx-auto w-full max-w-[640px] px-4 pb-28 lg:pt-10 lg:pb-12";
