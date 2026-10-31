import sharp from "sharp";

// one change in a screenshot: the box around a patch of changed pixels, with
// what was in that box before and after
export type Change = {
  width: number;
  height: number;
  // how many of its pixels changed
  pixels: number;
  before: Int32Array;
  after: Int32Array;
};

// a change with fewer changed pixels than this, like a few antialiased
// pixels, may well be noise
export const TINY = 10;

const pixelsOf = async (png: Buffer) => {
  const { data, info } = await sharp(png)
    .removeAlpha()
    .toColourspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });
  const px = new Int32Array(info.width * info.height);
  for (let i = 0; i < px.length; i++) {
    px[i] = (data[i * 3] << 16) | (data[i * 3 + 1] << 8) | data[i * 3 + 2];
  }
  return { px, width: info.width, height: info.height };
};

// changed pixels up to two cells apart are one change
const CELL = 8;
const REACH = 2;

export const changesBetween = async (
  beforePng: Buffer,
  afterPng: Buffer,
): Promise<Change[]> => {
  const [a, b] = await Promise.all([beforePng, afterPng].map(pixelsOf));
  const width = Math.max(a.width, b.width);
  const height = Math.max(a.height, b.height);
  // outside the smaller screenshot counts as changed
  const at = (img: typeof a, x: number, y: number) =>
    x < img.width && y < img.height ? img.px[y * img.width + x] : -1;

  const columns = Math.ceil(width / CELL);
  const rows = Math.ceil(height / CELL);
  const changed = new Uint8Array(width * height);
  const cells = new Int32Array(columns * rows);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (at(a, x, y) === at(b, x, y)) continue;
      changed[y * width + x] = 1;
      cells[Math.floor(y / CELL) * columns + Math.floor(x / CELL)] = -1;
    }
  }

  // label the changed cells, each group of nearby ones with its own number
  let groups = 0;
  for (let start = 0; start < cells.length; start++) {
    if (cells[start] !== -1) continue;
    const group = ++groups;
    cells[start] = group;
    const stack = [start];
    while (stack.length) {
      const cell = stack.pop() as number;
      const cx = cell % columns;
      const cy = (cell - cx) / columns;
      for (let ny = cy - REACH; ny <= cy + REACH; ny++) {
        for (let nx = cx - REACH; nx <= cx + REACH; nx++) {
          if (nx < 0 || ny < 0 || nx >= columns || ny >= rows) continue;
          const next = ny * columns + nx;
          if (cells[next] !== -1) continue;
          cells[next] = group;
          stack.push(next);
        }
      }
    }
  }

  const boxes = Array.from({ length: groups }, () => ({
    x0: width,
    y0: height,
    x1: -1,
    y1: -1,
    pixels: 0,
  }));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!changed[y * width + x]) continue;
      const box =
        boxes[cells[Math.floor(y / CELL) * columns + Math.floor(x / CELL)] - 1];
      box.x0 = Math.min(box.x0, x);
      box.y0 = Math.min(box.y0, y);
      box.x1 = Math.max(box.x1, x);
      box.y1 = Math.max(box.y1, y);
      box.pixels++;
    }
  }
  return boxes.map(({ x0, y0, x1, y1, pixels }) => {
    const w = x1 - x0 + 1;
    const h = y1 - y0 + 1;
    const crop = (img: typeof a) => {
      const out = new Int32Array(w * h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) out[y * w + x] = at(img, x0 + x, y0 + y);
      }
      return out;
    };
    return { width: w, height: h, pixels, before: crop(a), after: crop(b) };
  });
};

// two changes are the same if their boxes are within a couple of pixels in
// size and most of their pixels match, lined up at either the left or the
// right edge, since text next to a changed part can push it along
const SIZE_SLACK = 2;
const ALIKE = 0.9;
const alike = (p: Change, q: Change) => {
  if (
    Math.abs(p.width - q.width) > SIZE_SLACK ||
    Math.abs(p.height - q.height) > SIZE_SLACK
  ) {
    return false;
  }
  const w = Math.min(p.width, q.width);
  const h = Math.min(p.height, q.height);
  for (const [px, qx] of [
    [0, 0],
    [p.width - w, q.width - w],
  ]) {
    let same = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * p.width + px + x;
        const j = y * q.width + qx + x;
        if (p.before[i] === q.before[j]) same++;
        if (p.after[i] === q.after[j]) same++;
      }
    }
    if (same >= ALIKE * 2 * w * h) return true;
  }
  return false;
};

// the fewest screenshots that between them show every change that isn't
// tiny, picked greedily, earlier screenshots first on a tie. every other
// screenshot repeats changes already shown, or only has tiny ones
export const groupRepeats = <T>(
  screenshots: { item: T; changes: Change[] }[],
) => {
  const tiny = screenshots.filter(({ changes }) =>
    changes.every((change) => change.pixels < TINY),
  );
  let left = screenshots
    .filter((screenshot) => !tiny.includes(screenshot))
    .map(({ item, changes }) => ({
      item,
      changes: changes.filter((change) => change.pixels >= TINY),
    }));
  const shown: { item: T; changes: Change[] }[] = [];
  const unseen = (change: Change) =>
    !shown.some(({ changes }) => changes.some((seen) => alike(change, seen)));
  for (;;) {
    const counts = left.map(({ changes }) => changes.filter(unseen).length);
    const most = Math.max(0, ...counts);
    if (!most) break;
    shown.push(left[counts.indexOf(most)]);
    left = left.filter((_, i) => i !== counts.indexOf(most));
  }
  // each repeat next to the shown screenshot with most of its changes
  const repeats = left.map(({ item, changes }) => {
    const shared = shown.map(
      (screenshot) =>
        changes.filter((change) =>
          screenshot.changes.some((seen) => alike(change, seen)),
        ).length,
    );
    return { item, of: shown[shared.indexOf(Math.max(...shared))].item };
  });
  return {
    shown: shown.map(({ item }) => item),
    repeats,
    tiny: tiny.map(({ item }) => item),
  };
};
