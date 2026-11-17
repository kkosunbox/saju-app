/**
 * 예시 사용자 수 — 랜딩의 "N명 운을 Pick하고 있어요"에 쓴다.
 * 화면에는 언제나 '예시' 칩과 함께 나간다 (실제 숫자처럼 보이지 않게).
 *
 * 기준일(2026-11-17)에 13,184명이고, 하루마다 날짜로 정해지는 25~55명씩 늘어난다.
 * 같은 날이면 언제 열어도 같은 숫자이고, 날이 갈수록 줄지 않는다.
 */
const BASE_DATE = "2026-11-17";
const BASE_COUNT = 13184; // 딱 떨어지지 않게
const DAY_MS = 86_400_000;

/** 날짜로 정해지는 0~1 난수 (mulberry32) */
function rand(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** 기준일부터 k번째 날에 늘어난 사람 수 */
const growthOn = (k: number): number => 25 + Math.floor(rand(k) * 31);

/** KST 날짜의 예시 사용자 수 */
export function sampleUsers(now = new Date()): number {
  const kst = new Date(now.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
  const days = Math.round(
    (Date.parse(`${kst}T00:00:00Z`) - Date.parse(`${BASE_DATE}T00:00:00Z`)) /
      DAY_MS,
  );
  let n = BASE_COUNT;
  for (let k = 1; k <= days; k++) n += growthOn(k);
  for (let k = 0; k > days; k--) n -= growthOn(k);
  return n;
}
