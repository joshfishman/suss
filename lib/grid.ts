export const GRID_COLS = 4;
export const GRID_GAP = 32; // 2rem gap

export function colWidth(containerWidth: number) {
  return (containerWidth - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;
}

export function gridToPxX(x: number, containerWidth: number) {
  return x * colWidth(containerWidth) + x * GRID_GAP;
}

export function gridToPxW(w: number, containerWidth: number) {
  return w * colWidth(containerWidth) + (w - 1) * GRID_GAP;
}

export function pxToGridX(px: number, containerWidth: number) {
  return Math.max(0, Math.min(GRID_COLS - 1, Math.round(px / (colWidth(containerWidth) + GRID_GAP))));
}

export function pxToGridW(px: number, containerWidth: number) {
  return Math.max(1, Math.min(GRID_COLS, Math.round((px + GRID_GAP) / (colWidth(containerWidth) + GRID_GAP))));
}

export function gridToPxY(y: number) {
  return y * (320 + GRID_GAP);
}

export function ratioToPxH(w: number, ratio: number, containerWidth: number) {
  const widthPx = gridToPxW(w, containerWidth);
  return Math.max(80, Math.round(widthPx / ratio));
}

export function clampGridX(x: number, w: number) {
  return Math.max(0, Math.min(GRID_COLS - w, x));
}
