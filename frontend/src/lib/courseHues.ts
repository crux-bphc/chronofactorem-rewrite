import type { CSSProperties } from "react";

// hand-picked dusty hues instead of an even spread, so no cyan, lime or
// magenta; past 8 courses the overflow hues fill the gaps
const PRIMARY_HUES = [28, 55, 85, 155, 230, 262, 295, 350] as const;
const OVERFLOW_HUES = [12, 40, 110, 185, 210, 245, 320, 335] as const;

// greens, yellows and purples look louder than reds and blues at the same
// chroma, so they get less of it
const CHROMA_SCALE: Partial<Record<number, number>> = {
  55: 0.9,
  85: 0.9,
  110: 0.8,
  155: 0.8,
  185: 0.8,
  210: 0.9,
  230: 0.9,
  295: 0.8,
  320: 0.8,
  335: 0.8,
  350: 0.8,
};
const CHRONO_BIRTHDAY = 20230617; // chrono birthday!!!!
const CRUX_BLUE = 0x164a9e; // CRUx blue #164a9e
const HASH_MODULUS = 1_000_000_007;

const hashCourseCode = (code: string, seed: number): number => {
  const input = `${seed}:${code.trim().toUpperCase()}`;
  let hash = CHRONO_BIRTHDAY;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * CRUX_BLUE + input.charCodeAt(i)) % HASH_MODULUS;
  }
  return hash;
};

const angularDistance = (firstHue: number, secondHue: number): number => {
  const diff = Math.abs(firstHue - secondHue) % 360;
  return diff > 180 ? 360 - diff : diff;
};

const minDistance = (candidateHue: number, usedHues: number[]): number => {
  let closest = 360;
  for (const usedHue of usedHues) {
    const distance = angularDistance(usedHue, candidateHue);
    if (distance < closest) closest = distance;
  }
  return closest;
};

const poolForCount = (usedCount: number): readonly number[] => {
  if (usedCount < PRIMARY_HUES.length) return PRIMARY_HUES;
  if (usedCount < PRIMARY_HUES.length + OVERFLOW_HUES.length) {
    return OVERFLOW_HUES;
  }
  return PRIMARY_HUES;
};

const pickNextHue = (hash: number, usedHues: number[]): number => {
  const pool = poolForCount(usedHues.length);
  const available = pool.filter((hue) => !usedHues.includes(hue));
  const candidates = available.length > 0 ? available : [...pool];
  const preferred = pool[hash % pool.length];

  let maxDistance = -1;
  for (const hue of candidates) {
    const distance = minDistance(hue, usedHues);
    if (distance > maxDistance) maxDistance = distance;
  }

  const topCandidates = candidates.filter(
    (hue) => minDistance(hue, usedHues) >= maxDistance - 10,
  );
  return topCandidates.includes(preferred)
    ? preferred
    : topCandidates[hash % topCandidates.length];
};

export const courseHues = (
  codes: Iterable<string>,
  seed = 0,
): Map<string, number> => {
  const result = new Map<string, number>();
  const uniqueCodes = [...new Set(codes)].sort();
  const usedHues: number[] = [];

  for (const code of uniqueCodes) {
    const chosen = pickNextHue(hashCourseCode(code, seed), usedHues);
    usedHues.push(chosen);
    result.set(code, chosen);
  }
  return result;
};

export const hueStyle = (hue: number | undefined): CSSProperties | undefined =>
  hue === undefined
    ? undefined
    : ({ "--h": hue, "--k": CHROMA_SCALE[hue] ?? 1 } as CSSProperties);
