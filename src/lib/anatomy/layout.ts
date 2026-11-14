/** Layout for the fully exploded "inventory" view.
 *
 * Every visible structure gets a cell sized to its projected bounding box,
 * cells are shelf-packed into rows (tallest first), and rows are centred into
 * a rectangle the camera can frame. Aspect-aware so portrait and landscape
 * screens both get a compact board.
 */
import type { Part } from './types';

export interface LayoutCell {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExplodeLayout {
  cells: Map<string, LayoutCell>;
  width: number;
  height: number;
}

export function packInventory(parts: Part[], aspect = 1): ExplodeLayout {
  const cards = parts.map((p) => ({
    id: p.id,
    width: Math.max(0.035, p.bounds[1][0] - p.bounds[0][0]) + 0.04,
    height: Math.max(0.035, p.bounds[1][1] - p.bounds[0][1]) + 0.04,
  }));
  const area = cards.reduce((n, c) => n + c.width * c.height, 0);
  const maxWidth = Math.max(0.3, ...cards.map((c) => c.width));
  const targetWidth = Math.max(
    maxWidth,
    Math.sqrt(area * Math.max(0.5, Math.min(1.6, aspect))) * 1.2
  );
  // Tallest first keeps each row's wasted strip small; the id tiebreak makes
  // the layout deterministic between frames.
  cards.sort((a, b) => b.height - a.height || (a.id < b.id ? -1 : 1));

  const cells = new Map<string, LayoutCell>();
  let x = 0;
  let y = 0;
  let rowHeight = 0;
  let usedWidth = 0;
  for (const c of cards) {
    if (x > 0 && x + c.width > targetWidth) {
      x = 0;
      y += rowHeight;
      rowHeight = 0;
    }
    cells.set(c.id, { x: x + c.width / 2, y: -y - c.height / 2, width: c.width, height: c.height });
    x += c.width;
    usedWidth = Math.max(usedWidth, x);
    rowHeight = Math.max(rowHeight, c.height);
  }
  const height = y + rowHeight;
  const cx = usedWidth / 2;
  const cy = height / 2;
  cells.forEach((c) => {
    c.x -= cx;
    c.y += cy;
  });
  return { cells, width: usedWidth, height };
}
