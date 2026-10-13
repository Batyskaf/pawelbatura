import { architectureLevels } from '../config';
export function paintingCenterHeight(canvasHeight: number) {
  const railTop = architectureLevels.dadoCenter + architectureLevels.trimThickness / 2;
  return railTop + architectureLevels.artworkClearance + architectureLevels.frameMargin + canvasHeight / 2;
}
