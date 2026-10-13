import { architectureLevels, movement } from '../config';
export function paintingCenterHeight(canvasHeight: number) {
  const railTop = architectureLevels.dadoCenter + architectureLevels.trimThickness / 2;
  return Math.max(movement.eyeHeight, railTop + architectureLevels.artworkClearance + architectureLevels.frameMargin + canvasHeight / 2);
}
