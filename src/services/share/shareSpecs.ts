/**
 * 공유 카드 데이터 — 콘텐츠마다 "핵심 한 줄 + 숫자 3개 + 봉인된 이야기 + 질문" 구조로 함축한다.
 * 봉인된 이야기는 결과의 가장 궁금한 부분을 가려서, 보는 사람이 직접 들어와 확인하게 만든다.
 * 생년월일 같은 개인 정보는 카드에 넣지 않는다.
 */
import { CombinedFortune, CompatibilityResult, User } from '../../types';
import { BRANCHES, ELEMENT_INFO, STEMS } from '../../data/sajuData';
import { mbtiMatches, pastLife, sajuCharacter, todayTalisman } from '../content/freeContent';
import { crushReport, spouseReport } from '../content/premiumContent';
import { ConsultEntry, MODE_LABEL, catOf, consultAnswer } from '../content/consult';
import {
  PurposeKey, ageNow, daeun, lifeStages, luckyDays, monthPillarOf, monthReport, isoOf, sajuFull, stageKeyOfAge,
  themeCareer, themeLove, themeMoney, yearData, WEEK,
} from '../premium/engine';
import { relation } from '../fortune/sajuService';
import { MONTH_LINE, STEM_PERSONA, YEAR_IDIOM } from '../premium/data';
import { parseISO, weekdayOf } from '../../utils/date';

export interface ShareSpec {
  /** 상단 분류 (예: 미래 배우자 리포트) */
  kind: string;
  /** 도장·워터마크 한자 한 글자 */
  seal: string;
  eyebrow: string;
  headline: string;
  sub?: string;
  big?: { value: string; unit?: string; label: string };
  /** [라벨, 값] 2~3개 */
  stats: [string, string][];
  /** 봉인된 이야기 — label은 보이고 내용은 가린다 */
  teaser?: string;
  /** 카드 하단 질문 */
  hook: string;
  /** 공유 메시지 */
  text: string;
  file: string;
  /** 결과 링크로 친구가 열 화면 · 친구에게 보일 결과 한 줄 */
  route: string;
  short: string;
}

/** 받침이 있으면 a, 없으면 b (예: 훈장이었대 / 시인이었대 / 화가였대) */
const josa = (w: string, a: string, b: string) => { const c = w.charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c <= 11171 && c % 28 ? a : b; };
const md = (iso: string) => { const p = parseISO(iso); return `${p.m}/${p.d}`; };
const mdw = (iso: string) => `${md(iso)} ${WEEK[weekdayOf(iso)]}`;

/* ---------- 무료 ---------- */
export function todaySpec(u: User, f: CombinedFortune): ShareSpec {
  return {
    kind: '오늘의 운세', seal: '日', eyebrow: `${u.nickname}님의 오늘`,
    headline: f.summary, big: { value: String(f.totalScore), unit: '점', label: '오늘의 종합운' },
    stats: [['연애', String(f.love)], ['재물', String(f.money)], ['일', String(f.work)]],
    teaser: '오늘 꼭 피해야 할 한 가지',
    hook: '너의 오늘은 몇 점일까?',
    text: `오늘 내 운세 ${f.totalScore}점, 키워드는 '${f.keywords[0]}'. 너는 오늘 몇 점이야?`, file: 'woonpick-today', route: 'Home', short: `${f.totalScore}점 · ${f.keywords[0]}`,
  };
}

export function mbtiSpec(u: User): ShareSpec {
  const { best, worst } = mbtiMatches(u.mbti); const top = best[0];
  return {
    kind: '찰떡 MBTI', seal: '性', eyebrow: `${u.mbti} ${u.nickname}님의 찰떡 MBTI는`,
    headline: top.type, sub: top.together,
    big: { value: String(top.score), unit: '점', label: '궁합 점수' },
    stats: [['2위', best[1].type], ['3위', best[2].type], ['조심', worst.type]],
    teaser: `${top.type}와 잘 맞는 진짜 이유`,
    hook: '너의 찰떡 MBTI는 뭘까?',
    text: `내 찰떡 MBTI는 ${top.type}(${top.nickname})래. 너랑 잘 맞는 유형은 뭐야?`, file: 'woonpick-mbti', route: 'MbtiMatch', short: `${top.type}(${top.nickname})`,
  };
}

export function characterSpec(u: User): ShareSpec {
  const c = sajuCharacter(u);
  return {
    kind: '사주 캐릭터', seal: c.hanja.slice(0, 1), eyebrow: `60가지 캐릭터 중 ${u.nickname}님은`,
    headline: c.name, sub: `${c.title} · ${c.core}`,
    stats: [['일주', c.hanja], ['기운', `${ELEMENT_INFO[c.element].ko}(${ELEMENT_INFO[c.element].hanja})`], ['키워드', c.keyword]],
    teaser: `나와 찰떡인 캐릭터는 '${c.bestFriend.split(' ')[0]} ··'`,
    hook: '너는 60가지 중 어떤 캐릭터일까?',
    text: `나 사주 캐릭터가 '${c.name}'${josa(c.name, '이래', '래')}. 너는 60가지 중에 뭐 나와?`, file: 'woonpick-character', route: 'Character', short: c.name,
  };
}

export function talismanSpec(u: User, today: string): ShareSpec {
  const t = todayTalisman(u, today);
  return {
    kind: '오늘의 부적', seal: t.hanja, eyebrow: `${u.nickname}님에게 온 오늘의 부적`,
    headline: t.mantra, sub: `${t.hanja} · ${t.keyword}`,
    stats: [['행운의 색', t.color], ['숫자', String(t.number)], ['시간', t.time]],
    hook: '오늘 너에게 온 부적은?',
    text: `오늘 받은 부적: ${t.hanja}(${t.keyword}). "${t.mantra}" 너도 하나 받아 봐.`, file: 'woonpick-talisman', route: 'Talisman', short: `${t.hanja} · ${t.keyword}`,
  };
}

export function compatSpec(u: User, r: CompatibilityResult): ShareSpec {
  return {
    kind: '궁합', seal: '和', eyebrow: `${u.nickname} × ${r.target.nickname}`,
    headline: r.summary, big: { value: String(r.total), unit: '점', label: '우리 둘의 궁합' },
    stats: [['연애', String(r.love)], ['대화', String(r.conversation)], ['재물', String(r.money)]],
    teaser: '둘이 가장 부딪히기 쉬운 순간',
    hook: '우리 궁합은 몇 점일까?',
    text: `${u.nickname} × ${r.target.nickname} 궁합 ${r.total}점 나왔어. 생일만 넣으면 우리 궁합도 바로 나와.`, file: 'woonpick-compat', route: 'Compatibility', short: `궁합 ${r.total}점`,
  };
}

export function pastLifeSpec(u: User): ShareSpec {
  const P = pastLife(u);
  return {
    kind: '전생 테스트', seal: '前', eyebrow: `${u.nickname}님의 전생은`,
    headline: P.title, sub: P.scene,
    stats: [['시대', P.era.split('의 ')[0]], ['타고난 재능', P.carried.split(' ')[0]], ['전생 인연', P.bond]],
    teaser: '이번 생에 풀어야 할 숙제',
    hook: '너는 전생에 누구였을까?',
    text: `나 전생에 '${P.title}'${josa(P.title, '이었대', '였대')}. 너는 전생에 누구였을 것 같아?`, file: 'woonpick-pastlife', route: 'PastLife', short: P.title,
  };
}

/* ---------- 프리미엄 ---------- */
export function spouseSpec(u: User, today: string): ShareSpec {
  const R = spouseReport(u, today);
  return {
    kind: '미래 배우자 리포트', seal: '緣', eyebrow: `${u.nickname}님의 미래 배우자는`,
    headline: R.headline, sub: R.look.split(',')[0],
    big: { value: String(R.bestYear.yy), unit: '년', label: '인연이 가장 강한 해' },
    stats: [['MBTI', R.mbti[0]], ['띠', `${R.animals[0]}띠`], ['나이', R.ageGap.startsWith('동갑') ? '동갑·연하' : R.ageGap.includes('연상') ? '연상' : '상관없음']],
    teaser: '그 사람을 처음 만나는 곳',
    hook: '내 미래 배우자는 어떤 사람일까?',
    text: `내 미래 배우자는 '${R.headline}'래. ${R.bestYear.yy}년에 인연이 제일 강하다는데, 너는?`, file: 'woonpick-spouse', route: 'Spouse', short: R.headline,
  };
}

export function crushSpec(u: User, r: CompatibilityResult, today: string): ShareSpec {
  const R = crushReport(u, r, today);
  return {
    kind: '그 사람의 속마음', seal: '心', eyebrow: `${r.target.nickname}님이 나를 생각하는 마음`,
    headline: R.oneLine, big: { value: String(R.temp), unit: '℃', label: '마음 온도' },
    stats: [['연인 가능성', `${R.chance}%`], ['나는 그에게', R.tg], ['연락하기 좋은 날', md(R.contact[0].iso)]],
    teaser: '마음을 표현하기 가장 좋은 날',
    hook: '그 사람은 나를 어떻게 생각할까?',
    text: `그 사람 마음 온도가 ${R.temp}℃래. 너도 궁금한 사람 있으면 봐 봐.`, file: 'woonpick-crush', route: 'Compatibility', short: `마음 온도 ${R.temp}℃`,
  };
}

export function lifeSpec(u: User, today: string): ShareSpec {
  const st = lifeStages(u); const dae = daeun(u); const now = ageNow(u, today);
  const cur = st.find(x => x.key === stageKeyOfAge(now)) ?? st[0];
  const gold = [...dae.list].sort((a, b) => b.score - a.score)[0];
  return {
    kind: '평생운', seal: '圖', eyebrow: `${u.nickname}님의 인생 지도`,
    headline: cur.headline, sub: `지금은 ${cur.label}(${cur.range})`,
    big: { value: `${gold.age}`, unit: '세~', label: '인생 최고의 10년' },
    stats: st.map(x => [x.label, String(x.score)] as [string, string]),
    teaser: '인생에서 가장 조심해야 할 10년',
    hook: '내 인생의 황금기는 언제일까?',
    text: `내 인생 최고의 10년은 ${gold.age}세부터래. 너의 황금기는 언제야?`, file: 'woonpick-life', route: 'Life', short: `최고의 10년 ${gold.age}세~`,
  };
}

export function newYearSpec(u: User, y: number): ShareSpec {
  const D = yearData(u, y); const idiom = YEAR_IDIOM[D.rel];
  return {
    kind: `${y} 신년운세`, seal: '年', eyebrow: `${u.nickname}님의 ${y}년은`,
    headline: `${idiom[0]}의 해`, sub: `${idiom[1]} · ${idiom[2]}`.length > 18 ? idiom[2] : `${idiom[1]} · ${idiom[2]}`,
    big: { value: String(D.total), unit: '점', label: `${y}년 총운` },
    stats: [['좋은 달', D.best.map(b => b.m).sort((a, b) => a - b).join('·') + '월'], ['연애', String(D.cat.love)], ['재물', String(D.cat.money)]],
    teaser: `${y}년에 조심해야 할 달`,
    hook: `너의 ${y}년은 어떤 해일까?`,
    text: `내 ${y}년은 '${idiom[0]}(${idiom[1]})'의 해래. 너의 ${y}년은 어떤 해야?`, file: `woonpick-${y}`, route: 'NewYear', short: `${idiom[0]}의 해`,
  };
}

export function monthlySpec(u: User, y: number, m: number): ShareSpec {
  const R = monthReport(u, isoOf(y, m, 1)); const F = sajuFull(u);
  const rel = relation(F.meE, STEMS[monthPillarOf(y, m).stem].element); const line = MONTH_LINE[rel];
  return {
    kind: `${m}월 운세`, seal: '月', eyebrow: `${u.nickname}님의 ${y}년 ${m}월`,
    headline: line[0], sub: line[1].split('.')[0],
    big: { value: String(R.avg), unit: '점', label: `${m}월 평균` },
    stats: [['행운의 날', R.best.map(b => b.d).sort((a, b) => a - b).join('·') + '일'], ['키워드', R.kws[0]], ['연애', String(R.cat.love)]],
    teaser: `${m}월에 피해야 할 날`,
    hook: '이번 달 나의 행운의 날은?',
    text: `내 ${m}월은 '${line[0]}'. 행운의 날은 ${R.best.map(b => b.d).sort((a, b) => a - b).join('·')}일이래. 너는 언제야?`, file: `woonpick-${y}-${m}`, route: 'Monthly', short: line[0],
  };
}

export function sajuDeepSpec(u: User): ShareSpec {
  const F = sajuFull(u); const per = STEM_PERSONA[F.ds];
  const name = `${STEMS[F.ds].ko}${BRANCHES[F.ch.day.branch].ko}일주`;
  return {
    kind: '상세 사주 해석', seal: STEMS[F.ds].hanja, eyebrow: `${u.nickname}님은 ${per.img}을 닮은`,
    headline: name, sub: per.core,
    stats: [['기운', F.strength], ['용신', `${ELEMENT_INFO[F.yong].ko}(${ELEMENT_INFO[F.yong].hanja})`], ['강점', per.str[0].split(' ')[0]]],
    teaser: '타고난 재물 그릇의 크기',
    hook: '내 사주에 숨겨진 본성은?',
    text: `나는 '${name}', ${per.core}을 타고났대. 너는 무슨 일주야?`, file: 'woonpick-saju', route: 'SajuDeep', short: name,
  };
}

export function themeSpec(u: User, today: string, kind: 'love' | 'money' | 'career'): ShareSpec {
  const F = sajuFull(u); const now = ageNow(u, today);
  if (kind === 'love') {
    const L = themeLove(u, today);
    return {
      kind: '연애·결혼운', seal: '緣', eyebrow: `${u.nickname}님의 연애 스타일`,
      headline: L.st, sub: `${u.bloodType}형답게 ${L.blood}`,
      stats: [['연애운 강한 달', L.ms.map(x => x.m).sort((a, b) => a - b).join('·') + '월'], ['잘 맞는 MBTI', L.types[0]], ['인연의 해', L.yrs[0] ? `${L.yrs[0].yy}` : '—']],
      teaser: '결혼 흐름이 들어오는 시기',
      hook: '나는 어떤 연애를 하는 사람일까?',
      text: `내 연애 스타일은 '${L.st}'래. 너는 어떤 연애 해?`, file: 'woonpick-love', route: 'Theme', short: L.st,
    };
  }
  if (kind === 'money') {
    const M = themeMoney(u, today);
    return {
      kind: '재물운', seal: '財', eyebrow: `${u.nickname}님의 돈 성향은`,
      headline: M.t.name, sub: M.t.desc,
      stats: [['재물 강한 달', M.ms.map(x => x.m).sort((a, b) => a - b).join('·') + '월'], ['재물 기운', `${M.cnt}개`], ['강점', M.t.str.split(' ')[0]]],
      teaser: '재물이 크게 모이는 10년',
      hook: '나는 어떤 부자가 될 사람일까?',
      text: `내 돈 성향은 '${M.t.name}'래. 너는 어떤 타입이야?`, file: 'woonpick-money', route: 'Theme', short: M.t.name,
    };
  }
  const C = themeCareer(u, today); const up = C.ups[0];
  return {
    kind: '직업·적성', seal: '業', eyebrow: `${u.nickname}님에게 맞는 일은`,
    headline: `${C.jobs[0]} · ${C.jobs[1]}`, sub: C.style[0],
    stats: [['커리어 상승기', up ? `${up.age}세~` : '—'], ['일하는 방식', C.style[1].split(' ')[0]], ['추천', C.jobs[2] ?? '—']],
    teaser: '이직·창업하기 좋은 타이밍',
    hook: '나에게 꼭 맞는 일은 뭘까?',
    text: `나한테 맞는 일은 ${C.jobs[0]}·${C.jobs[1]}래. 너는 뭐 나와?`, file: 'woonpick-career', route: 'Theme', short: `${C.jobs[0]} · ${C.jobs[1]}`,
  };
}

export function luckySpec(u: User, today: string, pk: PurposeKey): ShareSpec {
  const { P, list } = luckyDays(u, today, pk);
  return {
    kind: '길일 찾기', seal: P[1], eyebrow: `${u.nickname}님의 ${P[2]} 길일`,
    headline: mdw(list[0].iso), sub: `앞으로 45일 중 ${P[2]}하기 가장 좋은 날`,
    stats: [['2순위', mdw(list[1].iso)], ['3순위', mdw(list[2].iso)], ['행운의 시간', list[0].c.luckyTime]],
    teaser: `${P[2]}할 때 피해야 할 날`,
    hook: `나에게 ${P[2]}하기 좋은 날은?`,
    text: `내 ${P[2]} 길일은 ${mdw(list[0].iso)}래. 너한테 좋은 날도 찾아봐.`, file: `woonpick-lucky-${pk}`, route: 'Lucky', short: `${P[2]} 길일 ${mdw(list[0].iso)}`,
  };
}


/** 고민 상담 — 고민 원문은 절대 싣지 않는다. 주제와 답의 한 줄만 */
export function consultSpec(u: User, e: ConsultEntry): ShareSpec {
  const A = consultAnswer(u, e.text, e.cat, e.at); const C = catOf(e.cat);
  return {
    kind: '말 못 할 고민 상담', seal: C.hanja, eyebrow: `${C.label} 고민에 사주가 답했어요`,
    headline: A.headline,
    stats: [['지금은', MODE_LABEL[A.mode]], ['풀리는 달', A.bestMonth], ['행동하기 좋은 날', A.days[0]?.label.split(' ')[0] ?? '—']],
    teaser: '사주가 알려준 구체적인 해결법 3가지',
    hook: '너의 말 못 할 고민, 사주는 뭐라고 할까?',
    text: `말 못 할 ${C.label} 고민을 물어봤더니 "${A.headline}"래. 너도 털어놔 봐.`, file: `woonpick-consult-${e.id}`, route: 'Consult', short: `${C.label} 고민 → ${A.headline.split('.')[0]}`,
  };
}
