/** 같은 사람 + 같은 날짜 → 같은 결과를 내기 위한 결정적 난수 */
export function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function seededRandom(seed: string) {
  let s = hashString(seed) || 1;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rand: () => number, arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

export function pickMany<T>(rand: () => number, arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (copy.length && out.length < n) out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]);
  return out;
}

export const clamp = (v: number, min = 40, max = 99) => Math.max(min, Math.min(max, Math.round(v)));
