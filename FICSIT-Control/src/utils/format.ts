export function formatMW(mw: number): string {
  if (mw >= 1000) return `${(mw / 1000).toFixed(1)} GW`;
  return `${mw.toFixed(1)} MW`;
}

export function formatLocation(loc: { x: number; y: number; z: number }): string {
  return `${Math.round(loc.x)}, ${Math.round(loc.y)}, ${Math.round(loc.z)}`;
}

export function getTeleportCommand(loc: { x: number; y: number; z: number }): string {
  // TeleportPlayer <X> <Y> <Z> (offset +1000z ≈ 10m above to clear tall machines)
  return `TeleportPlayer ${Math.round(loc.x)} ${Math.round(loc.y)} ${Math.round(loc.z + 1000)}`;
}

export function getPakUtilityCommand(loc: { x: number; y: number; z: number }): string {
  // !tp <X> <Y> <Z> (offset +1000z ≈ 10m above to clear tall machines)
  return `!tp ${Math.round(loc.x)} ${Math.round(loc.y)} ${Math.round(loc.z + 1000)}`;
}
