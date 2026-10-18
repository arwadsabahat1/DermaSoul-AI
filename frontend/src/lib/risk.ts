export function riskStyles(level: string) {
  const l = level.toLowerCase();
  if (l.includes("high")) {
    return "bg-red-900/90 text-white ring-1 ring-red-950/40";
  }
  if (l.includes("moderate")) {
    return "bg-amber-100 text-amber-950 ring-1 ring-amber-200/70";
  }
  if (l.includes("uncertain")) {
    return "bg-sky-50 text-sky-950 ring-1 ring-sky-200";
  }
  return "bg-sage-400/25 text-forest-900 ring-1 ring-sage-500/30";
}
