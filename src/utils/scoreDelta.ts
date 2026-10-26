/** 어제와 비교한 점수 차이. 같거나 어제 점수가 없으면 null. */
export function scoreDelta(now: number, before?: number | null): number | null {
  if (before == null) return null;
  const d = now - before;
  return d === 0 ? null : d;
}

/** 스크린리더용: ' 어제보다 3점 올랐어요'. 표시할 차이가 없으면 빈 문자열. */
export function scoreDeltaLabel(now: number, before?: number | null): string {
  const d = scoreDelta(now, before);
  return d == null ? '' : ` 어제보다 ${Math.abs(d)}점 ${d > 0 ? '올랐어요' : '내렸어요'}`;
}
