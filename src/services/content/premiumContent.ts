/**
 * 신규 프리미엄 — 미래 배우자 리포트 · 그 사람의 속마음
 * 기존 사주 심화 엔진(배우자의 별 · 일지 · 대운 · 십성)과 궁합 엔진을 재사용한다.
 */
import { CompatibilityResult, User } from '../../types';
import { BRANCHES, ELEMENT_INFO, Element, STEMS } from '../../data/sajuData';
import { MBTI_INFO } from '../../data/mbtiData';
import { TenGodGroup } from '../../data/sajuData';
import { relation } from '../fortune/sajuService';
import {
  BRANCH_GOOD, ELS, WEEK, addDays, ageNow, daeun, fortuneOf, isClash, isLiuhe, isWonjin, isoOf, mainStem, partnerUser, pFrom, sajuFull, tenGod, tgGroup, themeLove, zodiacRel,
} from '../premium/engine';
import { BRANCH_SEAT, EL_JOB, EL_LUCK, STAGE12, STAGE12_INFO, STEM_PERSONA, TG, TG_INFO, TG_REL } from '../premium/data';
import { mbtiMatches } from './freeContent';
import { parseISO, weekdayOf } from '../../utils/date';
import { clamp } from '../../utils/seed';

const PLACE: Record<Element, string[]> = {
  wood: ['서점·도서관', '공원 산책길', '배움의 자리(강의·스터디)'],
  fire: ['공연·전시장', 'SNS·모임', '친구의 생일 파티'],
  earth: ['지인 소개', '동네 단골 가게', '직장·학교'],
  metal: ['일로 만난 자리', '운동·동호회', '전문가 모임'],
  water: ['여행지', '카페·와인바', '온라인 커뮤니티'],
};
const LOOK: Record<Element, string> = {
  wood: '키가 크고 시원시원한 인상, 단정한 옷차림', fire: '밝은 표정과 생기 있는 눈빛, 말할 때 손짓이 많은 사람',
  earth: '편안하고 듬직한 인상, 웃을 때 눈이 휘는 사람', metal: '또렷한 이목구비와 깔끔한 스타일, 자기 관리가 철저한 사람',
  water: '부드러운 분위기와 차분한 목소리, 깊은 눈매를 가진 사람',
};
/** 배우자의 사랑 표현 방식 */
const SP_LOVE: Record<Element, string> = {
  wood: '앞으로의 계획을 함께 세우는 것으로 사랑을 표현해요. "우리 나중에"라는 말을 자주 해요.',
  fire: '표현이 크고 솔직해요. 좋으면 바로 말하고, 기념일과 이벤트도 아끼지 않아요.',
  earth: '말보다 꾸준함으로 보여줘요. 늘 같은 자리에서 묵묵히 챙겨 주는 사람이에요.',
  metal: '약속을 지키는 것으로 마음을 증명해요. 한번 마음을 주면 의리가 깊어요.',
  water: '내 기분을 먼저 알아채고 조용히 맞춰 줘요. 깊은 대화로 가까워지는 사람이에요.',
};
/** 배우자의 경제관 */
const SP_MONEY: Record<Element, string> = {
  wood: '당장의 소비보다 배움·성장에 투자하는 편이에요. 함께 미래 계획을 세우기 좋아요.',
  fire: '쓸 땐 시원하게 쓰는 편이라, 결혼 전에 함께 예산 규칙을 정해 두면 좋아요.',
  earth: '알뜰하고 안정 지향이에요. 집·저축 같은 기반을 차곡차곡 만들어 가요.',
  metal: '계획적이고 기준이 분명해요. 가계부가 깔끔하고 큰 지출 전엔 꼭 상의해요.',
  water: '돈의 흐름을 읽는 감각이 있어요. 재테크·정보에 밝아 기회를 잘 잡아요.',
};
/** 이 사람을 알아보는 신호 */
const SP_SIGNS: Record<Element, string[]> = {
  wood: ['처음 만났는데도 앞으로의 이야기를 자연스럽게 나눠요', '내가 성장하도록 응원하고 좋은 자극을 줘요', '탁 트인 곳에서 만나자고 해요'],
  fire: ['함께 있으면 평소보다 많이 웃게 돼요', '먼저 연락하고 먼저 약속을 잡아요', '감정을 숨기지 않아 마음을 헷갈리게 하지 않아요'],
  earth: ['연락하는 텀이 일정하고 한결같아요', '내가 지나가듯 한 말을 기억했다가 챙겨 줘요', '처음부터 편안해서 긴장이 금방 풀려요'],
  metal: ['작은 약속이라도 한 말은 꼭 지켜요', '애매한 표현 대신 분명하게 말해요', '내 일과 시간을 존중하고 선을 지켜 줘요'],
  water: ['대화가 끊기지 않고 밤늦게까지 이어져요', '말하지 않아도 내 기분을 먼저 알아채요', '둘만 있을 때 훨씬 다정해져요'],
};
const SP_FIRST: Record<Element, string> = {
  wood: '함께 무언가를 배우거나 준비하다가 자연스럽게 가까워지는',
  fire: '여럿이 모인 밝은 자리에서 눈에 띄어 상대가 먼저 말을 걸어오는',
  earth: '여러 번 마주치다 어느새 익숙하고 편한 사이가 되는',
  metal: '일이나 목표를 함께하며 서로의 실력과 태도를 알아보는',
  water: '우연히 시작된 대화가 생각보다 길어지는',
};
const SP_HOME: Record<Element, [string, string]> = {
  wood: ['함께 성장하는 동반자형 부부', '서로의 꿈을 응원하고 목표를 같이 세워요. 각자의 성장을 존중하는 게 행복의 열쇠예요.'],
  fire: ['연인 같은 활기찬 부부', '결혼 후에도 설렘이 오래가요. 대신 감정이 앞설 때 한 박자 쉬어 가는 규칙이 필요해요.'],
  earth: ['든든한 가족형 부부', '살림과 안정을 함께 쌓아 가요. 익숙함에 표현이 줄지 않도록 고마움을 자주 말해 주세요.'],
  metal: ['역할이 분명한 팀워크형 부부', '맡은 일을 확실히 해내는 믿음직한 팀이에요. 원칙만큼 서로의 감정도 챙기면 완벽해요.'],
  water: ['친구 같은 대화형 부부', '대화가 많고 서로를 깊이 이해해요. 생각이 많아질 땐 바로 털어놓는 게 오래가는 비결이에요.'],
};
/** 내가 가장 많이 가진 기운으로 본, 인연이 들어오는 길 */
const MEET_WAY: Record<TenGodGroup, string> = {
  peer: '친구·동료의 소개나 모임에서 만날 가능성이 커요. 지인 네트워크가 인연의 통로예요.',
  resource: '가족·선배처럼 나를 아끼는 윗사람의 소개로 이어지기 쉬워요. 소개 제안을 가볍게 넘기지 마세요.',
  output: '취미·배움·SNS처럼 내가 즐기는 활동에서 만나요. 좋아하는 일을 할 때 매력이 가장 빛나요.',
  wealth: '일·거래처럼 현실적인 자리에서 인연이 닿아요. 업무로 만난 사람을 다시 보게 될 수 있어요.',
  officer: '직장·학교처럼 소속된 곳에서 만나기 쉬워요. 오래 봐 온 사람이 어느 날 달리 보일 수 있어요.',
};

export interface SpouseYear { yy: number; v: number; why: string[] }

export function spouseReport(u: User, today: string) {
  const F = sajuFull(u);
  const spouseEl: Element = F.gE[F.spouseGrp];
  const seat = BRANCH_SEAT[F.ch.day.branch];
  const love = themeLove(u, today);
  const now = ageNow(u, today);
  const dae = daeun(u);
  const isSp = (stem: number) => tgGroup(tenGod(F.ds, stem)) === F.spouseGrp;
  const daeLove = dae.list.filter(d => d.age + 9 >= now && (isSp(d.p.stem) || isSp(mainStem(d.p.branch)))).slice(0, 2);
  const mm = mbtiMatches(u.mbti);
  const yb = F.ch.year.branch, db = F.ch.day.branch;
  const animals = BRANCH_GOOD(yb).map(b => BRANCHES[b].animal);
  const avoidAnimals = BRANCHES.map((b, i) => i).filter(i => isClash(yb, i) || isWonjin(yb, i)).map(i => BRANCHES[i].animal);
  const ageGap = F.strength === '신강' ? '동갑이거나 연하' : F.strength === '신약' ? '듬직한 연상' : '나이보다 대화가 통하는';
  const ageWhy = F.strength === '신강' ? '내 기운이 강한 편이라, 나를 편하게 받아 주는 사람과 균형이 맞아요.' : F.strength === '신약' ? '나를 든든하게 받쳐 주는 사람과 있을 때 운이 살아나요.' : '균형 잡힌 사주라 나이 차이보다 대화의 결이 더 중요해요.';
  const spStem = STEMS.findIndex((s, i) => s.element === spouseEl && i % 2 !== F.ds % 2);
  const per = STEM_PERSONA[spStem >= 0 ? spStem : 0];

  // 배우자의 별: 정(안정) · 편(자극)
  const [jI, pI] = u.gender === 'female' ? [7, 6] : [5, 4];
  const jN = F.tgc[jI], pN = F.tgc[pI], n = jN + pN;
  const starText = n === 0
    ? '사주 원국에 배우자의 별이 드러나 있지 않아요. 인연이 없다는 뜻이 아니라, 운에서 별이 들어오는 시기에 인연이 또렷해지는 타입이에요. 그래서 아래 "시기"가 특히 중요해요.'
    : n === 1 ? '배우자의 별이 하나, 또렷하게 있어요. 여러 사람보다 한 사람에게 깊이 마음을 주는 타입이라, 한번 만나면 오래가요.'
    : jN && pN ? '안정과 설렘의 별이 함께 있어 인연의 폭이 넓어요. 선택지가 많은 만큼 "누구를 고르느냐"가 결혼운을 좌우해요.'
    : '배우자의 별이 여럿이라 인연 자체가 많은 편이에요. 서두르기보다 오래 지켜보고 고를수록 좋은 결혼을 해요.';
  const starType = n === 0 ? null : jN >= pN
    ? ['안정형', u.gender === 'female' ? '책임감 있고 반듯한 사람, 믿고 기댈 수 있는 사람과 맺어지기 쉬워요.' : '성실하고 알뜰한 사람, 생활을 함께 단단하게 꾸려 갈 사람과 맺어지기 쉬워요.']
    : ['설렘형', u.gender === 'female' ? '카리스마 있고 추진력 강한 사람, 나를 이끌어 주는 사람에게 끌려요.' : '활동적이고 스케일이 큰 사람, 매력이 넘치는 사람에게 끌려요.'];

  // 배우자 자리(일지)와 다른 기둥의 관계
  const others = [F.ch.year, F.ch.month, F.ch.hour].filter(Boolean).map(p => p!.branch);
  const seatNote = others.some(b => isClash(db, b))
    ? ['沖', '배우자 자리가 다른 기둥과 부딪혀요. 결혼 초 생활 방식 차이로 다투기 쉬우니, 집안일·돈 관리 규칙을 미리 정해 두면 오히려 단단해져요.']
    : others.some(b => isLiuhe(db, b))
    ? ['合', '배우자 자리가 다른 기둥과 합을 이뤄요. 가정이 안정되기 쉽고, 양가와의 관계도 원만한 편이에요.']
    : ['安', '배우자 자리가 다른 기둥과 크게 부딪히지 않아요. 무난하고 편안한 결혼 생활의 흐름이에요.'];

  // 앞으로 6년 인연 지수
  const y0 = parseISO(today).y;
  const yearIdx: SpouseYear[] = [];
  for (let yy = y0; yy < y0 + 6; yy++) {
    const yp = pFrom(yy - 4);
    const why: string[] = [];
    let v = 58;
    if (relation(F.meE, STEMS[yp.stem].element) === F.spouseGrp) { v += 20; why.push('배우자의 별이 들어와요'); }
    if (isSp(mainStem(yp.branch))) { v += 10; if (!why.length) why.push('배우자의 기운이 바탕에 깔려요'); }
    if (isLiuhe(db, yp.branch)) { v += 10; why.push('배우자 자리와 합'); }
    if (zodiacRel(yb, yp.branch) === 'harmony') { v += 7; why.push('귀인의 해'); }
    if (relation(F.meE, STEMS[yp.stem].element) === 'output') { v += 5; why.push('매력이 드러나는 해'); }
    if (isClash(db, yp.branch)) { v -= 12; why.push('관계에 변동이 생기기 쉬워요'); }
    const age = yy - parseISO(u.birthDate).y;
    if (daeLove.some(d => age >= d.age && age <= d.age + 9)) { v += 6; why.push('인연의 대운 안'); }
    yearIdx.push({ yy, v: clamp(v, 40, 98), why: why.length ? why : ['잔잔한 흐름이에요'] });
  }
  const bestYear = [...yearIdx].sort((a, b) => b.v - a.v)[0];

  // 내가 가장 많이 가진 기운 → 만나는 길
  const topGrp = (Object.keys(F.grp) as TenGodGroup[]).reduce((a, b) => (F.grp[b] > F.grp[a] ? b : a));
  const luck = EL_LUCK[spouseEl];
  const topTG = F.topTG[0]?.i ?? 0;

  return {
    headline: seat[1],
    spouseEl,
    look: LOOK[spouseEl],
    personality: [per.core + '을 지녔어요', per.str[0], per.str[1]],
    persona: { img: per.img, hanja: per.emoji, core: per.core, str: per.str, watch: per.watch },
    loveStyle: SP_LOVE[spouseEl],
    moneyStyle: SP_MONEY[spouseEl],
    jobs: (EL_JOB[spouseEl] as string[]).slice(0, 4),
    signs: SP_SIGNS[spouseEl],
    star: { n, text: starText, type: starType },
    seatNote,
    stage: [STAGE12[F.dayStage], STAGE12_INFO[F.dayStage]] as [string, string],
    mbti: mm.best.map(x => x.type),
    mbtiWhy: mm.best[0].reason,
    avoidMbti: mm.worst.type,
    animals,
    avoidAnimals,
    ageGap,
    ageWhy,
    yearIdx,
    bestYear,
    years: love.yrs,
    months: [...love.ms].sort((a, b) => a.y - b.y || a.m - b.m),
    daeLove,
    places: PLACE[spouseEl],
    meetWay: MEET_WAY[topGrp],
    first: `${SP_FIRST[spouseEl]} 장면이 그려져요. ${spouseEl === 'fire' || spouseEl === 'wood' ? '상대가 먼저 다가올' : '천천히 알아가며 가까워질'} 가능성이 커요.`,
    home: SP_HOME[spouseEl],
    blind: [
      `'${MBTI_INFO[u.mbti].watch}' 성향 때문에 좋은 사람을 지나치기 쉬워요.`,
      TG_INFO[topTG].care + '.',
      F.strength === '신강' ? '내 기준이 분명한 만큼, 상대의 방식에 맞춰 보는 연습이 인연을 붙잡아요.' : F.strength === '신약' ? '상대에게 맞추다 나를 잃지 않도록, 원하는 것을 먼저 말해 보세요.' : '마음에 들어도 표현이 늦어 타이밍을 놓치기 쉬워요. 호감은 빨리 보여 주세요.',
    ],
    advice: [
      `${luck.color} 계열을 옷이나 소품에 더해 보세요. 배우자의 기운을 끌어온다고 봐요.`,
      `가까이 두면 좋은 물건 · ${luck.items}`,
      `${luck.dir} 방향의 약속 장소, ${luck.act.split(', ')[0]} 같은 활동이 인연운을 열어요.`,
      `${bestYear.yy}년에는 소개 자리나 새 모임을 마다하지 마세요.`,
    ],
    views: love.views,
  };
}

/** 그 사람의 속마음 — 상대(B)가 나(A)를 어떻게 느끼는지 */
export function crushReport(u: User, r: CompatibilityResult, today: string) {
  const p = partnerUser(r);
  const A = sajuFull(u), B = sajuFull(p);
  const tgBA = tenGod(B.ds, A.ds);
  const grp = tgGroup(tgBA);
  const temp = clamp(r.love * 0.6 + (fortuneOf(p, today).love + fortuneOf(u, today).love) * 0.2, 40, 99);
  const FEEL: Record<string, string> = {
    peer: '편하고 말이 잘 통하는 사람. 친구처럼 시작해 연인으로 발전하기 쉬운 마음이에요.',
    output: '함께 있으면 표현하고 싶어지는 사람. 당신 앞에서 자기도 모르게 많이 웃어요.',
    wealth: '현실적으로 끌리는 사람. 함께하면 안정감을 느끼고 오래 곁에 두고 싶어 해요.',
    officer: '조금 긴장되지만 신경 쓰이는 사람. 잘 보이고 싶은 마음이 커요.',
    resource: '기대고 싶은 사람. 당신에게 위로와 조언을 받고 싶어 해요.',
  };
  const { y, m, d } = parseISO(today);
  const days: { iso: string; s: number }[] = [];
  for (let i = 1; i <= 21; i++) { const iso = addDays(today, i); days.push({ iso, s: fortuneOf(u, iso).love + fortuneOf(p, iso).love }); }
  const contact = days.sort((a, b) => b.s - a.s).slice(0, 3).sort((a, b) => a.iso.localeCompare(b.iso));
  const flow = [0, 1, 2].map(k => {
    const mm = ((m - 1 + k) % 12) + 1, yy = y + Math.floor((m - 1 + k) / 12);
    const v = Math.round([3, 10, 17, 24].reduce((s, dd) => s + fortuneOf(p, isoOf(yy, mm, dd)).love + fortuneOf(u, isoOf(yy, mm, dd)).love, 0) / 8);
    return { label: `${mm}월`, v };
  });
  const theirMbti = MBTI_INFO[p.mbti];
  const ek = (e: Element) => `${ELEMENT_INFO[e].ko}(${ELEMENT_INFO[e].hanja})`;

  // 그 사람이 나에게 끌리는 이유 — 상대에게 필요한 기운(용신)·없는 기운을 내가 가졌는지
  const fill = ELS.filter(e => B.elc[e] === 0 && A.elc[e] >= 2);
  const pull = A.meE === B.yong
    ? `${u.nickname}님의 타고난 ${ek(A.meE)} 기운이 그 사람에게 꼭 필요한 기운(용신)이에요. 함께 있으면 이유 없이 편하고 일이 잘 풀린다고 느껴요.`
    : A.elc[B.yong] >= 2 ? `그 사람에게 필요한 ${ek(B.yong)} 기운을 ${u.nickname}님이 넉넉히 가지고 있어요. 곁에 있으면 힘이 난다고 느끼기 쉬워요.`
    : fill.length ? `그 사람에게 없는 ${fill.map(ek).join('·')} 기운을 ${u.nickname}님이 채워 줘요. 자기와 다른 모습에 호기심을 느껴요.`
    : `${u.nickname}님의 ${STEM_PERSONA[A.ds].core}에 끌려요. 비슷한 결을 가진 사람이라 대화가 편하다고 느껴요.`;

  // 그 사람이 호감을 보낼 때의 신호 (E/I × F/T)
  const SIG: Record<string, string[]> = {
    EF: ['평소보다 리액션이 커지고 이모티콘이 늘어요', '여럿이 있어도 당신 옆자리를 찾아요', '다음 약속을 먼저 꺼내요'],
    ET: ['당신 일에 대해 구체적으로 묻고 도와주려 해요', '같이 할 일을 계획해서 제안해요', '장난을 자주 걸어요'],
    IF: ['당신이 지나가듯 한 말을 기억하고 있어요', '답장이 길어지고 질문으로 끝나요', '둘만 있을 때 말수가 확 늘어요'],
    IT: ['도움이 될 정보나 링크를 챙겨 보내요', '바빠도 당신 연락에는 꼭 답해요', '시간을 내서 직접 도와주러 와요'],
  };
  const signals = SIG[p.mbti[0] + p.mbti[2]];

  // 연인으로 발전할 가능성 · 진도 속도
  const chance = clamp(Math.round(temp * 0.65 + r.total * 0.35), 35, 97);
  const pace = p.mbti[3] === 'J'
    ? ['천천히 확신을 쌓는 타입', '마음이 정리되기까지 3~4번의 만남이 필요해요. 일정한 연락과 약속을 지키는 모습이 확신을 줘요.']
    : ['분위기를 타면 빠른 타입', '좋은 분위기 한 번에 확 가까워질 수 있어요. 대신 연락이 뜸해지면 마음도 금방 식으니 리듬을 이어 가세요.'];

  // 오해가 생기기 쉬운 지점
  const dayClash = isClash(A.ch.day.branch, B.ch.day.branch), won = isWonjin(A.ch.year.branch, B.ch.year.branch);
  const caution = dayClash
    ? '생활 리듬과 표현 방식이 달라 사소한 일로 서운해지기 쉬워요. 서운한 건 그날 바로, 가볍게 말하는 게 좋아요.'
    : won ? '서로 끌리면서도 괜히 날이 서는 순간이 있어요. 농담이 상처가 되지 않게 말끝을 부드럽게 해 주세요.'
    : u.mbti[2] !== p.mbti[2] ? (p.mbti[2] === 'F' ? '그 사람은 감정을, 당신은 해결을 먼저 봐요. 조언보다 "그랬구나"가 먼저예요.' : '그 사람은 해결을, 당신은 감정을 먼저 봐요. 서운함은 돌려 말하기보다 분명하게 말해 주세요.')
    : u.mbti[0] !== p.mbti[0] ? (p.mbti[0] === 'I' ? '그 사람은 혼자 충전하는 시간이 꼭 필요해요. 연락이 뜸한 날을 마음이 식은 걸로 오해하지 마세요.' : '그 사람은 사람들 속에서 에너지를 얻어요. 모임을 즐기는 모습에 불안해하지 않아도 돼요.')
    : '성향이 닮아 편하지만, 같은 약점도 공유해요. 둘 다 미루는 부분은 한 사람이 먼저 용기를 내야 해요.';

  // 고백(마음 표현)하기 좋은 날 — 앞으로 60일 중 두 사람의 연애 흐름이 가장 높은 날
  let best = { iso: addDays(today, 1), s: -1 };
  for (let i = 1; i <= 60; i++) { const iso = addDays(today, i); const sc = fortuneOf(u, iso).love + fortuneOf(p, iso).love; if (sc > best.s) best = { iso, s: sc }; }
  const bp = parseISO(best.iso);

  const TOPIC: Record<Element, string> = {
    wood: '여행 계획, 요즘 배우고 싶은 것', fire: '요즘 빠진 콘텐츠, 공연·전시', earth: '맛집, 소소한 일상 이야기',
    metal: '일과 목표, 운동 루틴', water: '깊은 고민, 취향 이야기, 밤 감성 대화',
  };
  return {
    temp,
    chance,
    tg: TG[tgBA],
    feel: FEEL[grp],
    relLine: TG_REL[tgBA],
    pull,
    signals,
    pace,
    caution,
    flow,
    contact: contact.map(c => ({ iso: c.iso, label: `${parseISO(c.iso).m}월 ${parseISO(c.iso).d}일 (${WEEK[weekdayOf(c.iso)]})` })),
    confess: { label: `${bp.m}월 ${bp.d}일 (${WEEK[weekdayOf(best.iso)]})`, time: fortuneOf(p, best.iso).luckyTime, place: PLACE[B.meE][0] },
    topics: [TOPIC[B.meE], p.mbti[1] === 'N' ? '"만약에 ~라면?" 같은 상상 질문' : '직접 겪은 구체적인 경험담'],
    messages: [
      p.mbti[2] === 'F' ? '"오늘 ○○ 보다가 생각나서 연락했어요 :)"' : '"지난번에 말한 ○○, 이번 주에 같이 가 볼래요?"',
      p.mbti[0] === 'E' ? '"이번 주말에 ○○ 가는데, 같이 갈래요?"' : '"요즘 어떻게 지내요? 지난번 얘기가 계속 궁금했어요"',
    ],
    dos: [
      p.mbti[2] === 'F' ? '진심이 담긴 짧은 메시지가 마음을 움직여요' : '구체적인 약속 제안이 더 잘 통해요',
      p.mbti[0] === 'E' ? '여럿이 함께하는 자리에서 자연스럽게 다가가세요' : '둘이 조용히 대화할 시간을 만들어 보세요',
      `그 사람의 강점인 '${theirMbti.strength}'을 알아봐 주고 칭찬해 주세요`,
    ],
    donts: [`${theirMbti.nickname} 성향은 '${theirMbti.watch}' 경향이 있어 재촉하면 멀어질 수 있어요`, '답장 속도로 마음을 판단하지 마세요', p.mbti[3] === 'J' ? '약속 시간·계획을 자주 바꾸지 마세요' : '처음부터 너무 빽빽한 계획은 부담스러워해요'],
    oneLine: temp >= 85 ? '이미 마음이 꽤 열려 있어요. 작은 용기면 충분해요.' : temp >= 72 ? '호감은 있지만 확신을 기다리는 중이에요.' : '아직은 탐색 단계예요. 천천히 거리를 좁혀 보세요.',
    today: d,
  };
}

