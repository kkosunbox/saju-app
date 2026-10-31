/**
 * 공유 카드 데이터 — 콘텐츠마다 핵심 결과 · 강조 한 줄 · 지표 · 질문으로 함축한다.
 * 생년월일 같은 개인 정보는 카드에 넣지 않는다.
 */
import { CombinedFortune, CompatibilityResult, ShareCard, User, TarotReading } from '../../types';
import { STEMS } from '../../data/sajuData';
import { RELATIONSHIP_INFO } from '../../data/relationships';
import { MbtiMatches, PastLife, SajuCharacter, Talisman } from '../../types/content';
import { WEEK, stageKeyOfAge } from '../premium/helpers';
import { CrushReport, DaeunTable, LifeStage, LuckyDays, MonthReport, SajuFull, SpousePreview, ThemeCareer, ThemeLove, ThemeMoney, YearData } from '../../types/premium';
import { STEM_PERSONA } from '../premium/data';
import { parseISO, weekdayOf } from '../../utils/date';
import { getResultMascot, type MascotPose } from '../../utils/resultMascot';
import { carriedTalent, characterStrength, COMFORT, lifeRange, moneyCopy, personaCopy, PLAIN_ELEMENT, relationCopy } from './shareCopy';
import type { TalismanPaperData } from '../../components/TalismanPaper';

export interface ShareSpec {
  /** 상단 분류 (예: 미래 배우자 리포트) */
  kind: string;
  /** 도장·워터마크 한자 한 글자 */
  seal: string;
  /** 사주 캐릭터 카드: 그림을 고를 일주 한자 (예: 己丑) */
  pillar?: string;
  eyebrow: string;
  headline: string;
  sub?: string;
  /** 액자 중앙의 보조 제목과 강조 결과 (실제 콘텐츠에서 생성). */
  detail?: { label: string; value: string };
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
  /** 오늘의 부적: 스토리 카드에 부적 종이를 그대로 그린다 */
  talisman?: TalismanPaperData;
  tarot?: TarotReading;
  /** 오늘의 운세: 칭호 · 올해 상위 % 카드로 그린다 */
  today?: TodayCardData;
}

export interface TodayCardData {
  nickname: string;
  total: number;
  title: string;
  line: string;
  topPercent: number;
  /** 홈과 같은 마스코트 포즈 (null이면 기본 무지개 젤리) */
  pose: MascotPose | null;
  /** [라벨, 점수] 4개 */
  scores: [string, string][];
}

/** 받침이 있으면 a, 없으면 b (예: 훈장이에요 / 화가예요) */
const josa = (w: string, a: string, b: string) => { const c = w.charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c <= 11171 && c % 28 ? a : b; };
const md = (iso: string) => { const p = parseISO(iso); return `${p.m}/${p.d}`; };
const mdw = (iso: string) => `${md(iso)} ${WEEK[weekdayOf(iso)]}`;
const ieyo = (w: string) => josa(w, '이에요', '예요');

/*
 * 공유 메시지는 사용자 말투로 꾸미지 않고 앱이 보내는 안내문으로 쓴다 (선물 부적 문구와 같은 결).
 * 첫 줄은 누구의 어떤 결과인지 하나만, 둘째 줄은 받은 사람이 링크로 무엇을 볼 수 있는지.
 */
const seeMine = (what: string, verb = '볼') => `생일만 넣으면 나의 ${what}도 바로 ${verb} 수 있어요.`;

/* ---------- 무료 ---------- */
export function todaySpec(u: User, f: CombinedFortune, card?: ShareCard | null): ShareSpec {
  if (card) {
    const pct = `상위 ${card.yearTopPercent}%`;
    return {
      kind: '오늘의 운세', seal: '日', eyebrow: `${u.nickname}님은 오늘`,
      headline: card.title, sub: card.line, stats: [],
      hook: '너는 오늘 상위 몇 %?',
      text: `${u.nickname}님은 오늘 '${card.title}'${ieyo(card.title)}.\n${seeMine('오늘 운세')}`, file: 'woonpick-today', route: 'Home', short: `${card.title} · ${pct}`,
      today: {
        nickname: u.nickname, total: f.totalScore, title: card.title, line: card.line, topPercent: card.yearTopPercent, pose: getResultMascot(f).pose,
        scores: [['연애', String(f.love)], ['재물', String(f.money)], ['직장', String(f.work)], ['관계', String(f.relationship)]],
      },
    };
  }
  // 칭호가 없는 예전 운세는 기본 카드로
  return {
    kind: '오늘의 운세', seal: '日', eyebrow: `${u.nickname}님의 오늘`,
    headline: f.summary, big: { value: String(f.totalScore), unit: '점', label: '오늘의 종합운' },
    stats: [['연애', String(f.love)], ['재물', String(f.money)], ['일', String(f.work)]],
    teaser: '오늘 꼭 피해야 할 한 가지',
    hook: '너의 오늘은 몇 점일까?',
    text: `${u.nickname}님의 오늘 운세는 ${f.totalScore}점이에요.\n${seeMine('오늘 운세')}`, file: 'woonpick-today', route: 'Home', short: `${f.totalScore}점 · ${f.keywords[0]}`,
  };
}

export function mbtiSpec(u: User, m: MbtiMatches): ShareSpec {
  const { best, worst } = m; const top = best[0];
  return {
    kind: '찰떡 MBTI', seal: '性', eyebrow: `${u.mbti} ${u.nickname}님의 찰떡 MBTI는`,
    headline: top.type, sub: top.together,
    detail: { label: top.nickname, value: `궁합 ${top.score}점` },
    big: { value: String(top.score), unit: '점', label: '궁합 점수' },
    stats: [['2위', best[1].type], ['3위', best[2].type], ['조심', worst.type]],
    teaser: `${top.type}와 잘 맞는 진짜 이유`,
    hook: '너의 찰떡 MBTI는 뭘까?',
    text: `${u.nickname}님의 찰떡 MBTI는 ${top.type}(${top.nickname})예요.\n${seeMine('찰떡 MBTI')}`, file: 'woonpick-mbti', route: 'MbtiMatch', short: `${top.type}(${top.nickname})`,
  };
}

export function characterSpec(u: User, c: SajuCharacter): ShareSpec {
  const strength = characterStrength(c.hanja, c.core);
  return {
    kind: '사주 캐릭터', seal: c.hanja.slice(0, 1), pillar: c.hanja, eyebrow: `60가지 캐릭터 중 ${u.nickname}님은`,
    headline: c.name, sub: c.core,
    detail: { label: '60가지 사주 캐릭터 중 하나', value: `${PLAIN_ELEMENT[c.element]}의 기운` },
    stats: [['찰떡 친구', c.bestFriend], ['타고난 기운', PLAIN_ELEMENT[c.element]], ['나의 강점', strength]],
    teaser: `나와 찰떡인 캐릭터는 '${c.bestFriend.split(' ')[0]} ··'`,
    hook: '너는 어떤 캐릭터일까?',
    text: `60가지 사주 캐릭터 중 ${u.nickname}님은 '${c.name}'${ieyo(c.name)}.\n${seeMine('캐릭터')}`, file: 'woonpick-character', route: 'Character', short: c.name,
  };
}

export function talismanSpec(u: User, t: Talisman): ShareSpec {
  return {
    kind: '오늘의 부적', seal: t.hanja, eyebrow: `${u.nickname}님에게 온 오늘의 부적`,
    headline: t.mantra, sub: `${t.hanja} · ${t.keyword}`,
    stats: [['행운의 색', t.color], ['숫자', String(t.number)], ['시간', t.time]],
    hook: '오늘 너에게 온 부적은?',
    text: `${u.nickname}님이 받은 오늘의 부적은 '${t.keyword}'${ieyo(t.keyword)}.\n"${t.mantra}"\n나의 오늘 부적도 받아 보세요.`, file: 'woonpick-talisman', route: 'Talisman', short: `${t.hanja} · ${t.keyword}`,
    talisman: { hanja: t.hanja, mantra: t.mantra, keyword: t.keyword, nickname: u.nickname },
  };
}

export function compatSpec(u: User, r: CompatibilityResult): ShareSpec {
  return {
    kind: '궁합', seal: '和', eyebrow: `${u.nickname} × ${r.target.nickname}`,
    headline: r.summary, big: { value: String(r.total), unit: '점', label: '우리 둘의 궁합' },
    stats: [[RELATIONSHIP_INFO[r.relationship].bars.love.replace(/ 궁합$/, ''), String(r.love)], ['대화', String(r.conversation)], [RELATIONSHIP_INFO[r.relationship].bars.money.replace(/ 궁합$/, ''), String(r.money)]],
    teaser: '둘이 가장 부딪히기 쉬운 순간',
    hook: '우리 궁합은 몇 점일까?',
    text: `${u.nickname} × ${r.target.nickname} 궁합은 ${r.total}점이에요.\n생일만 넣으면 누구와의 궁합이든 바로 볼 수 있어요.`, file: 'woonpick-compat', route: 'Compatibility', short: `궁합 ${r.total}점`,
  };
}

export function pastLifeSpec(u: User, P: PastLife): ShareSpec {
  return {
    kind: '전생 테스트', seal: '前', eyebrow: `${u.nickname}님의 전생은`,
    headline: P.title, sub: P.scene,
    detail: { label: '이번 생에도 남은 재능', value: P.carried },
    stats: [['살았던 시대', P.era.split('의 ')[0]], ['나의 강점', carriedTalent(P.carried)], ['전생 인연', P.bond]],
    teaser: '이번 생에 풀어야 할 숙제',
    hook: '너는 전생에 누구였을까?',
    text: `${u.nickname}님의 전생은 '${P.title}'${ieyo(P.title)}.\n${seeMine('전생')}`, file: 'woonpick-pastlife', route: 'PastLife', short: P.title,
  };
}

/* ---------- 프리미엄 ---------- */
/** 배우자 리포트는 첫 화면(미리보기) 내용만 싣는다 */
export function spouseSpec(u: User, R: SpousePreview): ShareSpec {
  return {
    kind: '미래 배우자 리포트', seal: '緣', eyebrow: `${u.nickname}님의 미래 배우자는`,
    headline: R.headline, sub: `${R.ageGap} 상대`,
    big: { value: String(R.bestYear), unit: '년', label: '인연이 가장 강한 해' },
    stats: [['상대 MBTI', R.mbti], ['상대 띠', `${R.animal}띠`], ['올해 만남운', `${R.thisYear}점`]],
    teaser: '그 사람을 처음 만나는 곳',
    hook: '내 미래 배우자는 누구일까?',
    text: `${u.nickname}님의 미래 배우자는 '${R.headline}'${ieyo(R.headline)}.\n${seeMine('미래 배우자')}`, file: 'woonpick-spouse', route: 'Spouse', short: R.headline,
  };
}

export function crushSpec(u: User, r: CompatibilityResult, R: CrushReport): ShareSpec {
  return {
    kind: '그 사람의 속마음', seal: '心', eyebrow: '그 사람이 나를 생각하는 마음',
    headline: R.oneLine, big: { value: String(R.temp), unit: '℃', label: '마음 온도' },
    stats: [['연애 지수', `${R.chance}점`], ['나는 그에게', relationCopy(R.tg, R.feel)], ['연락하기 좋은 날', md(R.contact[0].iso)]],
    teaser: '마음을 표현하기 가장 좋은 날',
    hook: '그 사람의 마음은 어떨까?',
    text: `${u.nickname}님을 향한 그 사람의 마음 온도는 ${R.temp}℃예요.\n생일만 넣으면 궁금한 그 사람의 마음도 바로 볼 수 있어요.`, file: 'woonpick-crush', route: 'Compatibility', short: `마음 온도 ${R.temp}℃`,
  };
}

export function lifeSpec(u: User, st: LifeStage[], dae: DaeunTable, now: number): ShareSpec {
  const cur = st.find(x => x.key === stageKeyOfAge(now)) ?? st[0];
  const gold = [...dae.list].sort((a, b) => b.score - a.score)[0];
  return {
    kind: '평생운', seal: '圖', eyebrow: `${u.nickname}님의 인생 지도`,
    headline: cur.headline, sub: cur.desc.split(/(?<=[.!?。])\s/)[0],
    detail: { label: `지금은 ${lifeRange(cur.range)}`, value: `${gold.age}~${gold.age + 9}세가 정점` },
    big: { value: `${gold.age}`, unit: '세~', label: '인생 최고의 10년' },
    stats: st.map(x => [lifeRange(x.range), `${x.score}점`] as [string, string]),
    teaser: '인생에서 가장 조심해야 할 10년',
    hook: '내 인생의 황금기는 언제?',
    text: `${u.nickname}님의 인생 최고의 10년은 ${gold.age}세부터예요.\n${seeMine('황금기')}`, file: 'woonpick-life', route: 'Life', short: `최고의 10년 ${gold.age}세~`,
  };
}

export function newYearSpec(u: User, D: YearData): ShareSpec {
  const y = D.y; const idiom = D.idiom;
  return {
    kind: `${y} 신년운세`, seal: '年', eyebrow: `${u.nickname}님의 ${y}년은`,
    headline: `${idiom[0]}의 해`, sub: `${idiom[1]} · ${idiom[2]}`.length > 18 ? idiom[2] : `${idiom[1]} · ${idiom[2]}`,
    big: { value: String(D.total), unit: '점', label: `${y}년 총운` },
    stats: [['좋은 달', D.best.map(b => b.m).sort((a, b) => a - b).join('·') + '월'], ['연애', String(D.cat.love)], ['재물', String(D.cat.money)]],
    teaser: `${y}년에 조심해야 할 달`,
    hook: `${y}년은 어떤 해일까?`,
    text: `${u.nickname}님의 ${y}년은 '${idiom[0]}'의 해예요.\n${seeMine(`${y}년 운세`)}`, file: `woonpick-${y}`, route: 'NewYear', short: `${idiom[0]}의 해`,
  };
}

/** 화면 맨 위와 같은 한 줄 (R.line) */
export function monthlySpec(u: User, R: MonthReport): ShareSpec {
  const { y, m } = R; const line = [R.line.headline, R.line.sub] as const;
  return {
    kind: `${m}월 운세`, seal: '月', eyebrow: `${u.nickname}님의 ${y}년 ${m}월`,
    headline: line[0], sub: line[1].split('.')[0],
    big: { value: String(R.avg), unit: '점', label: `${m}월 평균` },
    stats: [['행운의 날', R.best.map(b => b.d).sort((a, b) => a - b).join('·') + '일'], ['이달의 테마', R.kws[0]], ['연애', String(R.cat.love)]],
    teaser: `${m}월에 피해야 할 날`,
    hook: '이번 달 나의 행운의 날은?',
    text: `${u.nickname}님의 ${m}월 행운의 날은 ${R.best.map(b => b.d).sort((a, b) => a - b).join('·')}일이에요.\n${seeMine(`${m}월 행운의 날`)}`, file: `woonpick-${y}-${m}`, route: 'Monthly', short: line[0],
  };
}

export function sajuDeepSpec(u: User, F: SajuFull): ShareSpec {
  const per = STEM_PERSONA[F.ds];
  const name = `${per.img} 같은 사람`;
  const { strength } = personaCopy(F.ds);
  return {
    kind: '상세 사주 해석', seal: STEMS[F.ds].hanja, eyebrow: `${u.nickname}님의 타고난 성격`,
    headline: name, sub: per.str[0],
    detail: { label: '내 사주를 한마디로', value: per.core },
    stats: [['나의 강점', strength], ['편안한 환경', COMFORT[F.yong]], ['잘 맞는 역할', per.work.split(' · ')[0]]],
    teaser: '타고난 재물 그릇의 크기',
    hook: '내 사주에 숨겨진 본성은?',
    text: `${u.nickname}님은 '${name}'${ieyo(name)}.\n${seeMine('타고난 성격')}`, file: 'woonpick-saju', route: 'SajuDeep', short: name,
  };
}

export function themeSpec(u: User, kind: 'love' | 'money' | 'career', data: ThemeLove | ThemeMoney | ThemeCareer): ShareSpec {
  if (kind === 'love') {
    const L = data as ThemeLove;
    return {
      kind: '연애·결혼운', seal: '緣', eyebrow: `${u.nickname}님의 연애 스타일`,
      headline: L.st, sub: '사주와 MBTI로 읽는 나의 관계 스타일',
      detail: { label: '연애운이 좋은 달', value: L.ms.slice(0, 2).map(x => `${x.y}년 ${x.m}월`).join(' · ') || '—' },
      stats: [['연애운 강한 달', L.ms.map(x => x.m).sort((a, b) => a - b).join('·') + '월'], ['잘 맞는 MBTI', L.types[0]], ['인연의 해', L.yrs[0] ? `${L.yrs[0].yy}` : '—']],
      teaser: '결혼 흐름이 들어오는 시기',
      hook: '나는 어떤 연애를 할까?',
      text: `${u.nickname}님의 연애 스타일은 '${L.st}'${ieyo(L.st)}.\n${seeMine('연애 스타일')}`, file: 'woonpick-love', route: 'Theme', short: L.st,
    };
  }
  if (kind === 'money') {
    const M = data as ThemeMoney;
    const copy = moneyCopy(M.t);
    return {
      kind: '재물운', seal: '財', eyebrow: `${u.nickname}님의 돈 성향은`,
      headline: M.t.name, sub: M.t.desc,
      detail: { label: '재물운이 좋은 달은?', value: M.ms[0] ? `${M.ms[0].y}년 ${M.ms[0].m}월` : '—' },
      stats: [['재물 강한 달', M.ms.map(x => x.m).sort((a, b) => a - b).join('·') + '월'], ['돈 관리 강점', copy.strength], ['지출 주의점', copy.watch]],
      teaser: '재물이 크게 모이는 10년',
      hook: '나는 어떤 부자가 될까?',
      text: `${u.nickname}님의 돈 성향은 '${M.t.name}'${ieyo(M.t.name)}.\n${seeMine('돈 성향')}`, file: 'woonpick-money', route: 'ThemeMoney', short: M.t.name,
    };
  }
  const C = data as ThemeCareer; const up = C.ups[0];
  return {
    kind: '직업·적성', seal: '業', eyebrow: `${u.nickname}님에게 맞는 일은`,
    headline: `${C.jobs[0]} · ${C.jobs[1]}`, sub: C.style[0],
    detail: { label: '내가 빛나는 일터', value: u.mbti.startsWith('E') ? '함께 협력하는 곳' : '혼자 몰입하는 곳' },
    stats: [['커리어 상승기', up ? `${up.age}세~` : '—'], ['업무 스타일', u.mbti.endsWith('J') ? '계획형' : '자율형'], ['추천 분야', C.jobs[2] ?? '—']],
    teaser: '이직·창업하기 좋은 타이밍',
    hook: '나에게 꼭 맞는 일은 뭘까?',
    text: `${u.nickname}님에게 맞는 일은 ${C.jobs[0]}·${C.jobs[1]}${ieyo(C.jobs[1])}.\n${seeMine('적성')}`, file: 'woonpick-career', route: 'ThemeCareer', short: `${C.jobs[0]} · ${C.jobs[1]}`,
  };
}

export function luckySpec(u: User, L: LuckyDays): ShareSpec {
  const { P, list } = L; const pk = P[0];
  return {
    kind: '길일 찾기', seal: P[1], eyebrow: `${u.nickname}님의 ${P[2]} 길일`,
    headline: mdw(list[0].iso), sub: list[0].c.summary,
    detail: { label: '앞으로 45일 중', value: `${P[2]}하기 좋은 날` },
    stats: [['2순위', mdw(list[1].iso)], ['3순위', mdw(list[2].iso)], ['행운의 시간', list[0].c.luckyTime]],
    teaser: `${P[2]}할 때 피해야 할 날`,
    hook: `나에게 ${P[2]}하기 좋은 날은?`,
    text: `${u.nickname}님의 ${P[2]} 길일은 ${mdw(list[0].iso)}${ieyo(mdw(list[0].iso))}.\n${seeMine(`${P[2]} 길일`, '찾을')}`, file: `woonpick-lucky-${pk}`, route: 'Lucky', short: `${P[2]} 길일 ${mdw(list[0].iso)}`,
  };
}


export function tarotSpec(u: User, card: TarotReading): ShareSpec {
  return { kind: '오늘의 타로', seal: '✦', eyebrow: `${u.nickname}님에게 온 카드`, headline: card.name, sub: card.message,
    detail: { label: '카드의 키워드', value: card.keyword }, stats: [['카드', `${card.id}`], ['방향', '정방향'], ['덱', '메이저 22장']],
    hook: '오늘 당신에게 온 카드는?', text: `${u.nickname}님의 오늘의 타로는 ${card.name}.\n${card.message}`, file: 'woonpick-tarot', route: 'Tarot', short: `${card.name} · ${card.keyword}`, tarot: card };
}
