export function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function toNumber(value: string | string[] | undefined, fallback = 0) {
  if (Array.isArray(value)) return Number(value[0] ?? fallback) || fallback;
  return Number(value ?? fallback) || fallback;
}

export function toStringValue(value: string | string[] | undefined, fallback = "") {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}
