/**
 * MBTI를 모를 때 사주로 비슷한 성향을 추정한다(가입 시 건너뛰기용).
 * 일간 음양 → E/I, 일간 오행 → N/S · T/F, 월지 계절 → J/P. 추정값임을 화면에 "(추정)"으로 표시한다.
 */
import { MBTI } from '../types';
import { STEMS } from '../data/sajuData';
import { buildChart } from '../services/fortune/sajuService';

export function guessMbti(birthDate: string, birthTime: string | null): MBTI {
  const ch = buildChart(birthDate, birthTime);
  const st = ch.day.stem, el = STEMS[st].element;
  const ei = st % 2 === 0 ? 'E' : 'I';
  const ns = el === 'earth' || el === 'metal' ? 'S' : 'N';
  const tf = el === 'metal' || el === 'water' ? 'T' : 'F';
  const jp = [2, 3, 4, 8, 9, 10].includes(ch.month.branch) ? 'J' : 'P';
  return `${ei}${ns}${tf}${jp}` as MBTI;
}
