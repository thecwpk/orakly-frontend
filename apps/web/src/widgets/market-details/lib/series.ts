/** Chart series from API anchors only — no synthetic walks. */

export type ImpliedPoint = { label: string; yes: number };

export function buildImpliedHistory(midYes: number): ImpliedPoint[] {
  const y = Math.min(0.99, Math.max(0.01, midYes));
  return [
    { label: "", yes: y },
    { label: "Now", yes: y },
  ];
}

export type VolumePoint = { label: string; vol: number };

export function buildVolumeHistory(volumeUsd: number): VolumePoint[] {
  const v = Math.max(0, volumeUsd);
  return [{ label: "24h", vol: v }];
}
