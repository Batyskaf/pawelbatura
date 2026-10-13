export interface ScreenBounds { left: number; right: number; top: number; bottom: number }
export function placeLabel(bounds: ScreenBounds, width: number, height: number) {
  const labelWidth = Math.min(290, width * .34), labelHeight = 64, gap = 22;
  const centerY = (bounds.top + bounds.bottom) / 2;
  const middleY = Math.max(90, Math.min(height - 150, centerY - labelHeight / 2));
  if (width - bounds.right > labelWidth + gap + 20) return { x: bounds.right + gap, y: middleY, width: labelWidth, edge: 'right' as const };
  if (bounds.left > labelWidth + gap + 20) return { x: bounds.left - labelWidth - gap, y: middleY, width: labelWidth, edge: 'left' as const };
  const x = Math.max(20, Math.min(width - labelWidth - 20, (bounds.left + bounds.right) / 2 - labelWidth / 2));
  if (height - bounds.bottom > labelHeight + gap + 110) return { x, y: bounds.bottom + gap, width: labelWidth, edge: 'bottom' as const };
  if (bounds.top > labelHeight + gap + 90) return { x, y: bounds.top - labelHeight - gap, width: labelWidth, edge: 'top' as const };
  // At extreme close range use the screen edge furthest from the painting's center.
  return { x, y: centerY > height / 2 ? 90 : height - 160, width: labelWidth, edge: centerY > height / 2 ? 'top' as const : 'bottom' as const };
}
