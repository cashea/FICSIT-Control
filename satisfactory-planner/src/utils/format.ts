export function formatMW(mw: number): string {
  if (mw >= 1000) return `${(mw / 1000).toFixed(1)} GW`;
  return `${mw.toFixed(1)} MW`;
}
