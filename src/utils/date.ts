export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayISO() {
  return toISODate(new Date());
}

export function parseISO(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
}

/** 시간대 영향 없이 날짜 차이를 계산하기 위해 UTC 기준 일수 사용 */
export function dayNumber(iso: string) {
  const { y, m, d } = parseISO(iso);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

export function weekdayOf(iso: string) {
  const { y, m, d } = parseISO(iso);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=일
}

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
export function formatKoreanDate(iso: string) {
  const { y, m, d } = parseISO(iso);
  return `${y}년 ${m}월 ${d}일 ${WEEK[weekdayOf(iso)]}요일`;
}

export function isValidDate(y: number, m: number, d: number) {
  if (!y || !m || !d || y < 1900 || y > new Date().getFullYear()) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}
