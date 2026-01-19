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

// Calculate centered x position for a block of width w
export function centerGridX(w: number) {
  return (GRID_COLS - w) / 2;
}

// Snap to center if close enough, otherwise return nearest grid position
export function snapToGridX(px: number, w: number, containerWidth: number) {
  const rawX = px / (colWidth(containerWidth) + GRID_GAP);
  const centerX = centerGridX(w);
  const centerPx = gridToPxX(centerX, containerWidth);
  
  // If within 20% of a column width from center, snap to center
  const snapThreshold = colWidth(containerWidth) * 0.3;
  if (Math.abs(px - centerPx) < snapThreshold) {
    return centerX;
  }
  
  // Otherwise snap to nearest integer grid position
  const snapped = Math.round(rawX);
  return clampGridX(snapped, w);
}
