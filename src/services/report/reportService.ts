/**
 * AI 종합 리포트 — 4가지 관점을 하나의 이야기로.
 * 앱이 계산한 근거(dossier)를 프롬프트로 만들어 백엔드에 보내고, 섹션 단위로 받아 저장한다.
 * API 키는 앱에 넣지 않는다. REPORT_CONFIG.endpoint(자체 백엔드)가 LLM을 호출하고 { text } 를 돌려준다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scopedKey } from '../storage/storageService';
import { CompatibilityResult, User } from '../../types';
import { BRANCHES, ELEMENT_INFO, STEMS } from '../../data/sajuData';
import { THAI_DAYS, THAI_FRIENDS, WEEKDAY_TO_THAI } from '../../data/thaiData';
import { MBTI_INFO } from '../../data/mbtiData';
import { BLOOD_INFO } from '../../data/bloodData';
import { dayPillar } from '../fortune/sajuService';
import { weekdayOf } from '../../utils/date';
import {
  BRANCH_GOOD, ELS, SAMHAP, WEEK, ageNow, axisVerdict, crossAxes, daeun, isClash, isLiuhe, isStemHap, isWonjin, lifeStages,
  mainStem, monthPillarOf, monthReport, pFrom, pText, partnerUser, sajuFull, samjae, stage12, tenGod, tenName, thaiDay, themeCareer,
  themeLove, themeMoney, yearData, zodiacRel, isoOf,
} from '../premium/engine';
import { DOHWA, EL_JOB, GROUP_KO, GWIIN, HIDDEN, SINSAL, STAGE12, STEM_HAP, STEM_PERSONA, TG, YEAR_IDIOM, YEOKMA } from '../premium/data';
import { THEME_T, ThemeKind } from '../premium/catalog';

export const REPORT_CONFIG = {
  enabled: false, // 백엔드 준비 후 true
  endpoint: 'https://YOUR-BACKEND/functions/v1/onulna-report',
  timeoutMs: 120000,
};

export type ReportKind = 'sajuDeep' | 'life' | 'newyear' | 'monthly' | 'theme-love' | 'theme-money' | 'theme-career' | 'compat';
export interface ReportCtx { key: string; kind: ReportKind; user: User; today: string; year?: number; month?: { y: number; m: number }; compat?: CompatibilityResult }
export interface Outline { title: string; parts: [string, string][][] }

const EL = (e: keyof typeof ELEMENT_INFO) => ELEMENT_INFO[e].ko;

/* ---------- 데이터 요약 (LLM에 넘길 근거) ---------- */
function dossierBase(u: User, today: string, label?: string) {
  const F = sajuFull(u); const td = thaiDay(u); const T = THAI_DAYS[td]; const dae = daeun(u); const now = ageNow(u, today); const ax = crossAxes(u, F);
  const pil = F.pillars.map(([l, p]) => p
    ? `- ${l} ${pText(p)}: 천간 ${l === '일주' ? '일간(나)' : TG[tenGod(F.ds, p.stem)]}, 지지 ${TG[tenGod(F.ds, mainStem(p.branch))]}, 지장간 ${HIDDEN[p.branch].map(s => STEMS[s].ko).join('')}, 12운성 ${STAGE12[stage12(F.ds, p.branch)]}`
    : `- ${l}: 출생시간 모름`).join('\n');
  return `${label ? `■ ${label}\n` : ''}[기본] 이름 ${u.nickname} · ${u.gender === 'female' ? '여성' : '남성'} · 만 ${now}세 · 양력 ${u.birthDate} ${u.birthTime || '(시간 모름)'} · ${BRANCHES[F.ch.year.branch].animal}띠${u.occupation ? ' · 직업 ' + u.occupation : ''}${u.concern ? ' · 요즘 고민: ' + u.concern : ''}
[사주 원국]
${pil}
- 일주 ${pText(F.ch.day)}, 일간 ${STEMS[F.ds].ko}${EL(F.meE)} (${STEM_PERSONA[F.ds].img} — ${STEM_PERSONA[F.ds].core})
- 오행 개수: ${ELS.map(e => EL(e) + F.elc[e]).join(' ')}
- 십성: ${(Object.keys(F.grp) as (keyof typeof F.grp)[]).map(k => GROUP_KO[k] + ' ' + F.grp[k]).join(', ')} / 두드러진 십성 ${F.topTG.map(x => TG[x.i] + '×' + x.c).join(', ')}
- 신강약 ${F.strength}(${Math.round(F.ratio * 100)}%), 용신 ${EL(F.yong)}, 희신 ${EL(F.hee)}, 기신 ${EL(F.gi)}
- 신살: ${F.sinsal.map(k => SINSAL[k].name).join(', ') || '두드러진 신살 없음'}
- 배우자궁(일지) ${BRANCHES[F.ch.day.branch].ko}, 일지 12운성 ${STAGE12[F.dayStage]}, 배우자의 별(${u.gender === 'female' ? '관성' : '재성'}) ${F.grp[F.spouseGrp]}개
- 대운(${dae.fwd ? '순행' : '역행'}, ${dae.start}세 시작): ${dae.list.map(d => `${d.age}~${d.age + 9}세 ${pText(d.p)} ${TG[tenGod(F.ds, d.p.stem)]}/${TG[tenGod(F.ds, mainStem(d.p.branch))]} ${d.score}점`).join(' | ')}
[태국 점성술] ${T.label}생, 수호 행성 ${T.planetKo}(${T.planet}), 성향 "${T.trait}", 행운색 ${T.color}, 주의색 ${T.cautionColor}, 잘 맞는 요일생 ${THAI_FRIENDS[td].map(k => THAI_DAYS[k].label).join('·')}
[MBTI] ${u.mbti} ${MBTI_INFO[u.mbti].nickname} — 강점 "${MBTI_INFO[u.mbti].strength}", 주의 "${MBTI_INFO[u.mbti].watch}"
[혈액형] ${u.bloodType}형 — ${BLOOD_INFO[u.bloodType].trait}
[4가지 관점 교차] ${ax.map(a => { const { pos, neg, verdict } = axisVerdict(a); return `${a.name} ${verdict}(${a.pos} ${pos}/4·${a.neg} ${neg}/4)`; }).join(', ')}`;
}

export function yearFacts(u: User, y: number) {
  const D = yearData(u, y); const F = sajuFull(u);
  const sTG = tenGod(F.ds, D.yp.stem), bTG = tenGod(F.ds, mainStem(D.yp.branch)); const st = stage12(F.ds, D.yp.branch);
  const sj = samjae(F.ch.year.branch, D.yp.branch); const g0 = SAMHAP(F.ch.year.branch), g1 = SAMHAP(F.ch.day.branch);
  const fl: string[] = [];
  if (DOHWA[g0] === D.yp.branch || DOHWA[g1] === D.yp.branch) fl.push('도화가 들어옴');
  if (YEOKMA[g0] === D.yp.branch || YEOKMA[g1] === D.yp.branch) fl.push('역마가 움직임');
  if (GWIIN[F.ds].includes(D.yp.branch)) fl.push('천을귀인의 해');
  if (isClash(F.ch.day.branch, D.yp.branch)) fl.push('일지와 충');
  if (isLiuhe(F.ch.day.branch, D.yp.branch)) fl.push('일지와 육합');
  if (sj) fl.push(sj);
  return `[${y}년 세운] ${pText(D.yp)} ${D.animal}의 해. 일간 기준 천간 ${TG[sTG]}, 지지 ${TG[bTG]}, 12운성 ${STAGE12[st]}. 일간과의 관계 ${tenName(D.rel)}. 띠 관계 ${D.zodiac[0]}(${D.myAnimal}띠×${D.animal}해). 특별한 기운: ${fl.join(', ') || '없음'}. 올해의 사자성어(앱 표시) ${YEAR_IDIOM[D.rel][0]}.
- 종합 점수 ${D.total}, 분야 점수 연애 ${D.cat.love} · 재물 ${D.cat.money} · 직장 ${D.cat.work} · 관계 ${D.cat.relationship}
- 월별(점수/월건/십성): ${D.months.map(x => { const mp = monthPillarOf(y, x.m); return `${x.m}월 ${x.total}점 ${pText(mp).slice(0, 2)} ${TG[tenGod(F.ds, mp.stem)]}`; }).join(' | ')}
- 좋은 달 ${D.best.map(b => b.m).sort((a, b) => a - b).join('·')}월, 쉬어갈 달 ${D.low.map(b => b.m).sort((a, b) => a - b).join('·')}월, 분기 점수 ${D.qs.join('/')}
- 올해 키워드 ${D.kws.join(', ')}
- 태국: ${D.views.thai} / MBTI: ${D.views.mbti} / 혈액형: ${D.views.blood}`;
}

function monthFacts(u: User, y: number, m: number) {
  const R = monthReport(u, isoOf(y, m, 1)); const F = sajuFull(u); const mp = monthPillarOf(y, m);
  const sTG = tenGod(F.ds, mp.stem), bTG = tenGod(F.ds, mainStem(mp.branch));
  const weeks: string[] = [];
  for (let w = 0; w < 5; w++) {
    const ds = R.days.slice(w * 7, w * 7 + 7); if (!ds.length) break;
    weeks.push(`${w + 1}주차(${ds[0].d}~${ds[ds.length - 1].d}일) 평균 ${Math.round(ds.reduce((s, x) => s + x.total, 0) / ds.length)}점, 최고 ${ds.reduce((a, b) => (b.total > a.total ? b : a)).d}일`);
  }
  const fp = WEEKDAY_TO_THAI[R.first];
  return `[${y}년 ${m}월 월운] 월건 ${pText(mp)}, 천간 ${TG[sTG]}, 지지 ${TG[bTG]}, 12운성 ${STAGE12[stage12(F.ds, mp.branch)]}. 이달 첫날은 ${THAI_DAYS[fp].label}(${THAI_DAYS[fp].planetKo}의 기운).
- 이달 평균 ${R.avg}점, 분야 평균 연애 ${R.cat.love} · 재물 ${R.cat.money} · 직장 ${R.cat.work} · 관계 ${R.cat.relationship}
- 주차별: ${weeks.join(' | ')}
- 좋은 날: ${R.best.map(x => `${x.d}일(${WEEK[weekdayOf(x.iso)]}) ${x.total}점 ${pText(dayPillar(x.iso)).slice(0, 2)}일`).join(', ')} / 조심할 날: ${R.low.map(x => `${x.d}일(${WEEK[weekdayOf(x.iso)]}) ${x.total}점`).join(', ')}
- 이달 키워드 ${R.kws.join(', ')}`;
}

function lifeFacts(u: User, today: string) {
  const st = lifeStages(u); const F = sajuFull(u); const cy = Number(today.slice(0, 4));
  return `[평생 3단계] ${st.map(s => `${s.label}(${s.range}) ${s.score}점, 기준 기둥과 일간 관계 ${tenName(s.rel)}`).join(' | ')}
[앞으로 10년 세운] ${Array.from({ length: 10 }, (_, i) => { const y = cy + i; const yp = pFrom(y - 4); return `${y}년 ${pText(yp).slice(0, 2)} ${TG[tenGod(F.ds, yp.stem)]}`; }).join(', ')}`;
}

function themeFacts(u: User, today: string, kind: ThemeKind) {
  const F = sajuFull(u);
  if (kind === 'love') {
    const L = themeLove(u, today); const hap = STEM_HAP.find(p => p.includes(F.ds))!;
    return `[연애 데이터] 연애 스타일(앱 요약) ${L.st}. 천간합 짝 ${STEMS[hap[0] === F.ds ? hap[1] : hap[0]].ko}일간. 잘 맞는 띠 ${BRANCH_GOOD(F.ch.year.branch).map(b => BRANCHES[b].animal).join('·')}. 잘 맞는 MBTI ${L.types.join(', ')}. 연애운 강한 달 ${L.ms.map(x => x.y + '년 ' + x.m + '월').join(', ')}. 인연이 강해지는 해 ${L.yrs.map(x => x.yy + '년(' + x.why + ')').join(', ') || '특별히 두드러진 해 없음'}.`;
  }
  if (kind === 'money') {
    const M = themeMoney(u, today);
    return `[재물 데이터] 돈 성향 유형 "${M.t.name}" — ${M.t.desc} 강점 ${M.t.str}, 주의 ${M.t.watch}. 재성 ${F.grp.wealth}개(정재 ${F.tgc[5]}, 편재 ${F.tgc[4]}). 재물 흐름 좋은 달 ${M.ms.map(x => x.y + '년 ' + x.m + '월').join(', ')}.`;
  }
  const C = themeCareer(u, today);
  return `[직업 데이터] 앱 추천 분야 ${C.jobs.join(', ')}. 용신 업종 ${EL_JOB[F.yong].join(', ')}. 일하는 스타일 ${C.style.join(' / ')}. 커리어 상승 대운 ${C.ups.map(d => d.age + '~' + (d.age + 9) + '세 ' + pText(d.p)).join(', ') || '없음'}.`;
}

/* ---------- 리포트 목차 ---------- */
export function outline(rk: ReportCtx): Outline {
  if (rk.kind === 'sajuDeep') return { title: '평생 종합 풀이', parts: [[['타고난 본질', '일주·일간·오행 균형·신강약과 태국 점성술·MBTI·혈액형이 공통으로 가리키는 핵심 정체성'], ['성격의 빛과 그림자', '강점과 약점, 편할 때와 스트레스 받을 때의 모습을 구체적 장면으로'], ['마음이 움직이는 방식', '감정을 느끼고 판단하고 에너지를 충전하는 방식. 교차 분석 결과를 근거로'], ['대인관계와 사회성', '친구·동료·윗사람과의 관계 패턴, 귀인, 관계에서 반복되는 숙제']], [['연애관과 결혼관', '배우자 자리·배우자의 별·도화 여부·연애 패턴·잘 맞는 상대'], ['재물관과 돈의 흐름', '재성 구조, 버는 방식, 쓰는 습관, 모으는 법'], ['직업과 적성', '직업 유형, 구체적인 추천 분야 6가지 이상과 이유, 일하는 스타일'], ['건강과 컨디션 관리', '오행 균형 기준 관리 포인트와 생활 리듬. 의학적 진단이 아님을 자연스럽게 밝히기']], [['인생의 큰 흐름', '대운 흐름 요약, 황금기, 지금 대운의 의미'], ['평생의 숙제와 성장 포인트', '부족한 기운과 그것을 채우는 방향'], ['개운법', '용신 기반 색·숫자·방향·물건·음식·습관을 생활 예시로'], ['나에게 보내는 편지', '따뜻한 마무리, 편지 형식']]] };
  if (rk.kind === 'newyear') { const y = rk.year!; return { title: `${y}년 신년운세`, parts: [[[`${y}년 총운`, '한 해 전체를 하나의 이야기로. 세운 간지·십성·띠 관계·특별한 기운·점수 흐름을 엮어 6문단 이상'], ['올해의 키워드와 테마', '키워드 3개 각각의 의미와 생활 속 모습'], ['상반기 흐름', '1~6월의 흐름, 월 점수와 월건을 인용'], ['하반기 흐름', '7~12월의 흐름, 월 점수와 월건을 인용']], [['재물운', '수입·지출·저축·투자 태도, 좋은 달'], ['직장·사업운', '승진·이직·사업·성과, 좋은 달'], ['연애·결혼운', '솔로와 커플 각각, 인연이 강한 시기'], ['건강운', '컨디션 리듬과 관리 포인트, 의료 조언 아님'], ['인간관계·가족운', '귀인, 갈등 조심, 가족'], ['학업·자기계발', '시험·자격·배움']], [['월별 운세', '"### N월 · 소제목 (점수)" 형식으로 1월부터 12월까지 12개 모두, 각 3~4문장. 월건과 십성을 인용'], ['기회의 시기와 조심할 시기', '구체적인 달과 행동 지침'], [`${y}년 개운법`, '용신 기반 색·숫자·방향·물건·습관'], [`${y}년의 나에게 보내는 편지`, '따뜻한 마무리, 편지 형식']]] }; }
  if (rk.kind === 'monthly') { const s = rk.month!; return { title: `${s.y}년 ${s.m}월 상세운세`, parts: [[[`${s.m}월 총운`, '월건·십성·점수 흐름을 엮은 이달 전체 이야기, 5문단 이상'], ['이달의 키워드', '키워드 각각의 의미와 생활 속 모습'], ['주차별 흐름', '"### N주차 (날짜 범위)" 형식으로 주마다 3~4문장']], [['재물운', '이달 돈의 흐름과 실천'], ['직장·사업운', '이달 일의 흐름과 실천'], ['연애운', '솔로와 커플 각각'], ['건강·컨디션', '리듬과 관리, 의료 조언 아님'], ['인간관계', '만남과 조심할 점']], [['좋은 날과 조심할 날', '데이터의 날짜를 인용해 날짜별 활용법'], ['이달의 개운법', '색·숫자·음식·습관'], ['이달을 위한 한마디', '짧고 따뜻한 마무리']]] }; }
  if (rk.kind === 'life') return { title: '평생운', parts: [[['인생 전체 이야기', '태어나서 지금까지, 그리고 앞으로의 큰 줄기를 하나의 이야기로'], ['초년운 (~29세)', '학업·가정·첫 사회생활'], ['중년운 (30~54세)', '일·재물·가정의 정점'], ['말년운 (55세~)', '여유·관계·건강']], [['10년 대운 흐름', '"### 나이 · 간지 대운" 형식으로 8개 대운 각각 3문장'], ['인생의 황금기', '점수가 높은 대운 구간과 그때 해야 할 일'], ['위기와 극복의 시기', '점수가 낮은 구간과 대비법']], [['앞으로 10년', '"### 연도" 형식으로 해마다 2문장'], ['평생의 재물·일·사랑', '세 영역의 평생 흐름'], ['인생 조언', '편지 형식의 마무리']]] };
  if (rk.kind.startsWith('theme-')) {
    const k = rk.kind.slice(6) as ThemeKind;
    const P: Record<ThemeKind, [string, string][][]> = {
      love: [[['나의 연애 DNA', '네 관점이 하나로 그리는 연애하는 나'], ['배우자 자리와 인연의 별', '일지·배우자의 별·도화'], ['끌리는 사람, 잘 맞는 사람', '일간·띠·MBTI·요일생을 엮어 구체적인 인물상'], ['연애할 때 나의 패턴', '시작·유지·갈등·이별의 패턴']], [['연애운이 강한 시기', '달과 해를 인용'], ['결혼과 가정의 흐름', '대운·세운 기준, 단정 금지'], ['관계를 지키는 법', '구체적 실천 6가지 이상'], ['사랑에게 보내는 조언', '편지 형식']]],
      money: [[['나의 재물 DNA', '네 관점이 그리는 돈과 나의 관계'], ['돈을 버는 방식', '강점이 되는 수입 구조'], ['돈을 쓰는 습관', '소비 패턴과 함정'], ['돈을 모으는 법', '성향에 맞는 저축·관리 방법(투자 권유 금지)']], [['재물이 모이는 시기', '대운·세운·좋은 달 인용'], ['앞으로 5년 재물 흐름', '"### 연도" 형식'], ['재물 개운법', '색·방향·물건·습관'], ['재물 조언', '마무리']]],
      career: [[['나의 직업 DNA', '네 관점이 그리는 일하는 나'], ['잘 맞는 일과 분야', '구체적 직무 8가지 이상과 이유'], ['일하는 방식과 리더십', '협업·의사결정·리더십 스타일'], ['조직형인가 독립형인가', '근거와 함께 판단']], [['커리어 상승기', '대운 인용'], ['앞으로 5년 커리어 흐름', '"### 연도" 형식'], ['이직·창업 타이밍', '해와 달을 인용, 단정 금지'], ['커리어 조언', '마무리']]],
    };
    return { title: THEME_T[k], parts: P[k] };
  }
  return { title: '심층 궁합 리포트', parts: [[['두 사람의 인연', '두 사람의 사주·성향을 겹쳐 본 관계의 본질'], ['첫인상과 끌림', '서로에게 끌리는 이유'], ['성격 궁합', '닮은 점과 다른 점을 구체적 장면으로'], ['대화와 소통', '말하는 방식, 오해 포인트, 대화법']], [['연애 궁합', '설렘과 애정 표현'], ['결혼·생활 궁합', '생활 리듬, 역할 분담'], ['금전 궁합', '돈 관리 방식, 규칙 제안'], ['갈등 패턴과 화해법', '반복될 수 있는 갈등과 구체적 화해 방법']], [['서로에게 주는 것', '각자가 상대에게 채워주는 것'], ['오래 함께하기 위한 약속', '실천 약속 6가지 이상'], ['서로에게 보내는 편지', '두 사람에게 각각 짧은 편지']]] };
}

function factsFor(rk: ReportCtx) {
  const u = rk.user;
  if (rk.kind === 'compat' && rk.compat) {
    const r = rk.compat; const p = partnerUser(r); const A = sajuFull(u), B = sajuFull(p);
    return dossierBase(u, rk.today, '나') + '\n\n' + dossierBase(p, rk.today, '상대') + `\n\n[관계 데이터] 앱 궁합 점수: 종합 ${r.total}, 연애 ${r.love}, 성격 ${r.personality}, 대화 ${r.conversation}, 금전 ${r.money}. 일간 ${STEMS[A.ds].ko}-${STEMS[B.ds].ko}${isStemHap(A.ds, B.ds) ? ' 천간합' : ''}. 일지 ${BRANCHES[A.ch.day.branch].ko}-${BRANCHES[B.ch.day.branch].ko}${isLiuhe(A.ch.day.branch, B.ch.day.branch) ? ' 육합' : ''}${isClash(A.ch.day.branch, B.ch.day.branch) ? ' 충' : ''}${SAMHAP(A.ch.day.branch) === SAMHAP(B.ch.day.branch) && A.ch.day.branch !== B.ch.day.branch ? ' 삼합' : ''}. 띠 ${zodiacRel(A.ch.year.branch, B.ch.year.branch)}${isWonjin(A.ch.year.branch, B.ch.year.branch) ? ' 원진' : ''}. ${u.nickname}에게 상대는 ${TG[tenGod(A.ds, B.ds)]}, 상대에게 ${u.nickname}은 ${TG[tenGod(B.ds, A.ds)]}. 서로의 용신 보유: 상대가 내 용신 ${B.elc[A.yong]}개, 내가 상대 용신 ${A.elc[B.yong]}개.`;
  }
  let x = '';
  if (rk.kind === 'newyear') x = yearFacts(u, rk.year!);
  else if (rk.kind === 'monthly') x = monthFacts(u, rk.month!.y, rk.month!.m);
  else if (rk.kind === 'life') x = lifeFacts(u, rk.today);
  else if (rk.kind.startsWith('theme-')) x = themeFacts(u, rk.today, rk.kind.slice(6) as ThemeKind);
  return dossierBase(u, rk.today) + (x ? '\n\n' + x : '');
}

export function buildReportPrompt(rk: ReportCtx, O: Outline, i: number, facts: string) {
  const secs = O.parts[i]; const prev = O.parts.slice(0, i).flat().map(s => s[0]); const nm = rk.user.nickname;
  return `당신은 운세 콘텐츠 앱 "운Pick"의 수석 작가입니다. 아래 [데이터]는 앱이 계산한 ${rk.kind === 'compat' ? '두 사람의' : nm + '님의'} 사주(명리), 태국 점성술, MBTI, 혈액형 분석 결과입니다.

임무: "${O.title}" 리포트의 일부를 씁니다. 네 가지 관점을 따로따로 설명하지 말고, 하나의 목소리로 엮은 종합 풀이를 씁니다.

글쓰기 원칙
- 존댓말(해요체). ${rk.kind === 'compat' ? '두 사람을 이름+님으로 부릅니다.' : nm + '님이라고 부릅니다.'}
- "사주에서는…, MBTI에서는…"처럼 관점별로 나열하지 마세요. 근거는 문장 속에 자연스럽게 녹입니다. 예: "편인의 깊은 사고와 ENFP의 호기심이 겹쳐, 남들이 지나치는 질문을 붙잡는 사람이에요."
- 데이터의 구체적 사실(간지, 십성, 12운성, 점수, 달, 나이)을 인용해 이 사람만을 위한 글로 만드세요. 뻔한 일반론은 쓰지 마세요.
- 생활 장면과 실천 행동을 구체적으로 제시하세요.
- 미래를 단정하거나 겁주지 마세요. 의료·법률·투자 결정을 지시하지 마세요. 재미와 참고를 위한 콘텐츠의 따뜻한 톤.
- 각 섹션은 4~5개 문단, 문단마다 3~5문장. 각 섹션 끝에 핵심 포인트 2~3줄.
${i ? `- 앞부분(${prev.join(', ')})은 이미 작성되었습니다. 겹치지 않게 이어 쓰세요.` : ''}

출력 형식 (이 형식 외의 말은 쓰지 마세요)
## 섹션 제목 | 한 줄 요약(30자 안팎)
문단

문단
> 핵심 포인트
> 핵심 포인트

(하위 항목이 필요한 섹션은 "### 소제목" 줄 다음에 문단을 씁니다.)

이번에 쓸 섹션 (이 순서, 이 제목 그대로)
${secs.map((s, k) => `${k + 1}. ${s[0]} — ${s[1]}`).join('\n')}

[데이터]
${facts}`;
}

/* ---------- 파싱 ---------- */
export interface ReportBlock { t: 'h' | 'pt' | 'p'; v: string }
export interface ReportSection { title: string; lead: string; blocks: ReportBlock[] }
export function parseReport(text: string): ReportSection[] {
  const secs: ReportSection[] = []; let cur: ReportSection | null = null;
  for (const raw of text.split('\n')) {
    const l = raw.trim();
    if (!l || l === '---') continue;
    if (/^##\s/.test(l) && !/^###/.test(l)) {
      const body = l.replace(/^##\s*/, ''); const i = body.indexOf('|');
      cur = { title: (i < 0 ? body : body.slice(0, i)).trim(), lead: i < 0 ? '' : body.slice(i + 1).trim(), blocks: [] };
      secs.push(cur); continue;
    }
    if (!cur) { cur = { title: '', lead: '', blocks: [] }; secs.push(cur); }
    if (/^###\s/.test(l)) { cur.blocks.push({ t: 'h', v: l.replace(/^###\s*/, '') }); continue; }
    if (/^>/.test(l)) { cur.blocks.push({ t: 'pt', v: l.replace(/^>\s*/, '').replace(/^핵심\s*포인트\s*[:：]?\s*/, '') }); continue; }
    cur.blocks.push({ t: 'p', v: l.replace(/^[-•]\s*/, '') });
  }
  return secs.filter(s => s.title || s.blocks.length);
}

/* ---------- 생성 상태 (화면을 떠나도 이어서 쓴다) ---------- */
export type GenStatus = 'running' | 'done' | 'error' | 'stopped' | 'partial';
export interface GenState { parts: string[]; part: number; total: number; status: GenStatus; err?: string | null; ctl?: AbortController }
const REP_V = 'v1';
const repKey = (uid: string, k: string) => scopedKey(`rep:${REP_V}:${uid}:${k}`);
const states = new Map<string, GenState>();
const subs = new Set<() => void>();
const emit = () => subs.forEach(f => f());
export const reportAvailable = () => REPORT_CONFIG.enabled;
export function subscribeReports(fn: () => void) { subs.add(fn); return () => { subs.delete(fn); }; }
export const getGenState = (key: string) => states.get(key);

export async function loadSavedReport(uid: string, key: string) {
  if (states.has(key)) return;
  try {
    const v = await AsyncStorage.getItem(repKey(uid, key));
    if (!v) return;
    const r = JSON.parse(v);
    if (r && r.parts) { states.set(key, { parts: r.parts, part: r.part ?? r.parts.length, total: r.total ?? r.parts.length, status: r.status === 'done' ? 'done' : 'partial' }); emit(); }
  } catch { /* 저장본이 깨졌으면 새로 쓴다 */ }
}
function saveRep(uid: string, key: string, st: GenState) {
  AsyncStorage.setItem(repKey(uid, key), JSON.stringify({ parts: st.parts, part: st.part, total: st.total, status: st.status === 'done' ? 'done' : 'partial' })).catch(() => {});
}

async function callBackend(prompt: string, ctl: AbortController): Promise<string> {
  const timer = setTimeout(() => ctl.abort(), REPORT_CONFIG.timeoutMs);
  try {
    const res = await fetch(REPORT_CONFIG.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }), signal: ctl.signal });
    if (!res.ok) throw Object.assign(new Error('http ' + res.status), { code: res.status === 429 ? 'rate_limited' : 'error' });
    const j = await res.json();
    if (typeof j?.text !== 'string') throw Object.assign(new Error('invalid'), { code: 'error' });
    return j.text;
  } finally { clearTimeout(timer); }
}

export async function generateReport(rk: ReportCtx, fresh = false, onDone?: () => void) {
  if (!reportAvailable()) return;
  const O = outline(rk); const facts = factsFor(rk);
  const prev = states.get(rk.key);
  const resume = !!prev && prev.status !== 'done' && !fresh;
  const st: GenState = resume ? { ...prev!, status: 'running', err: null } : { parts: [], part: 0, total: O.parts.length, status: 'running' };
  states.set(rk.key, st); emit();
  for (let i = resume ? st.part : 0; i < O.parts.length; i++) {
    st.part = i; st.parts[i] = '';
    const ctl = new AbortController(); st.ctl = ctl; emit();
    try {
      st.parts[i] = await callBackend(buildReportPrompt(rk, O, i, facts), ctl);
      st.part = i + 1; saveRep(rk.user.id, rk.key, { ...st, status: 'partial' }); emit();
    } catch (e: any) {
      st.status = ctl.signal.aborted ? 'stopped' : 'error'; st.err = e?.code ?? null; emit();
      return;
    }
  }
  st.status = 'done'; st.part = O.parts.length; saveRep(rk.user.id, rk.key, st); emit();
  onDone?.();
}
export function stopReport(key: string) { states.get(key)?.ctl?.abort(); }

/** 목차 개수로 분량 표기 (섹션당 약 800자) */
export function approxChars(sections: number) {
  const n = sections * 800;
  return n >= 9500 ? (n / 10000).toFixed(1).replace('.0', '') + '만' : Math.round(n / 1000) + '천';
}
