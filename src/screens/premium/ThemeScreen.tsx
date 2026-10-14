import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@/navigation/compat';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Segmented from '../../components/Segmented';
import Disclaimer from '../../components/Disclaimer';
import ReportArea from '../../components/premium/Report';
import { ActRow, Bullet, DarkChip, HeadRow, Hero, InfoRows, Para, Pill, Seal, SubHead, Tip, ViewsCard, heroTxt } from '../../components/premium/Kit';
import { useApp } from '../../context/AppContext';
import { RootStackParamList } from '../../navigation/types';
import { ITEMS, ThemeKind } from '../../services/premium/catalog';
import {
  BRANCH_GOOD, ageNow, daeun, elName, mainStem, pFrom, pText, sajuFull, tenGod, tenName, tgGroup, thaiDay, themeCareer, themeLove, themeMoney,
} from '../../services/premium/engine';
import { BRANCH_SEAT, EL_JOB, EL_LUCK, FIELD, GROUP_KO, STAGE12, STAGE_FIELD, STEM_HAP, STEM_PERSONA, TG, TG_INFO } from '../../services/premium/data';
import { BRANCHES, STEMS } from '../../data/sajuData';
import { THAI_DAYS } from '../../data/thaiData';
import { MBTI_INFO } from '../../data/mbtiData';
import { BLOOD_INFO } from '../../data/bloodData';
import { BloodType } from '../../types';
import { colors } from '../../theme/colors';
import { radius, txt } from '../../theme/typography';
import ShareCta, { ShareIconButton } from '../../components/ShareCta';
import { themeSpec } from '../../services/share/shareSpecs';

const TABS: { key: ThemeKind; label: string }[] = [{ key: 'love', label: '연애·결혼' }, { key: 'money', label: '재물' }, { key: 'career', label: '직업·적성' }];

function MonthTiles({ ms, k, color, bg }: { ms: { y: number; m: number; love: number; money: number }[]; k: 'love' | 'money'; color: string; bg: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {ms.map(x => (
        <View key={`${x.y}-${x.m}`} style={[s.mtile, { backgroundColor: bg }]}>
          <Text style={txt.caption}>{x.y}년</Text>
          <Text style={{ fontSize: 22, fontWeight: '700', color }}>{x.m}월</Text>
          <Text style={txt.small}>{x[k]}점</Text>
        </View>
      ))}
    </View>
  );
}

function SealRows({ rows, bg, ch, color }: { rows: { key: string; title: string; sub: string }[]; bg: string; ch: string; color: string }) {
  return (
    <>
      {rows.map((r, i) => (
        <View key={r.key} style={[s.lrow, i ? s.topLine : null]}>
          <Seal ch={ch} bg={bg} color={color} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>{r.title}</Text>
            <Text style={txt.small}>{r.sub}</Text>
          </View>
        </View>
      ))}
    </>
  );
}

const Empty = ({ children }: { children: string }) => <Text style={[txt.body, { paddingVertical: 14 }]}>{children}</Text>;

export default function ThemeScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'Theme'>>();
  const { user: u, today } = useApp();
  const [kind, setKind] = useState<ThemeKind>(params.kind);
  if (!u) return null;
  const item = ITEMS.theme(kind);
  const F = sajuFull(u); const g = F.grp; const ch = F.ch; const cy = Number(today.slice(0, 4)); const dae = daeun(u); const now = ageNow(u, today);
  let hero: React.ReactNode = null, basis: React.ReactNode = null;

  if (kind === 'love') {
    const L = themeLove(u, today); const seat = BRANCH_SEAT[ch.day.branch]; const spouseN = g[F.spouseGrp];
    const hap = STEM_HAP.find(p => p.includes(F.ds))!; const partnerStem = hap[0] === F.ds ? hap[1] : hap[0];
    const goodAnimals = BRANCH_GOOD(ch.year.branch).map(b => BRANCHES[b].animal);
    const daeLove = dae.list.filter(d => d.age + 9 >= now && (tgGroup(tenGod(F.ds, d.p.stem)) === F.spouseGrp || tgGroup(tenGod(F.ds, mainStem(d.p.branch))) === F.spouseGrp)).slice(0, 2);
    const mb = u.mbti;
    const pattern = [mb[0] === 'E' ? '마음에 들면 먼저 다가가 분위기를 이끄는 편이에요.' : '호감이 생겨도 상대를 충분히 지켜본 뒤 천천히 다가가요.', mb[2] === 'F' ? '말과 표현으로 사랑을 확인받고 싶어 해요. 작은 기념일과 다정한 말이 중요해요.' : '말보다 행동으로 마음을 보여줘요. 문제를 해결해 주는 것이 나만의 애정 표현이에요.', mb[3] === 'J' ? '관계의 방향이 분명할 때 안정감을 느껴요.' : '정해진 틀보다 자연스럽게 흘러가는 관계를 좋아해요.'];
    const bloodLove: Record<BloodType, string> = { A: '상대를 세심하게 챙기며 신뢰를 쌓아요. 서운함을 혼자 삼키지 않는 연습이 필요해요', B: '좋으면 솔직하게 직진해요. 상대의 속도도 한 번 확인해 주세요', O: '든든하게 이끌어 주는 편이에요. 가끔은 상대에게 결정을 맡겨 보세요', AB: '적당한 거리를 지킬 줄 알아요. 마음을 말로 표현해 주면 상대가 안심해요' };
    const spTG = tenGod(F.ds, mainStem(ch.day.branch));
    hero = (
      <Hero>
        <Text style={heroTxt.eyebrow}>나의 연애 스타일</Text>
        <Text style={[heroTxt.summ, { fontSize: 20 }]}>{L.st}</Text>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.82)', marginTop: 6 }}>{u.bloodType}형답게 {L.blood}.</Text>
      </Hero>
    );
    basis = (
      <>
        <SubHead title="01 · 배우자 자리 (일지)" caption={`${BRANCHES[ch.day.branch].ko}(${BRANCHES[ch.day.branch].hanja}) · ${STAGE12[F.dayStage]}`} />
        <Card>
          <Para mt={0}>사주에서 일지는 나의 속마음이자 배우자의 자리예요. {seat[0]} 그래서 {seat[1]}와 함께할 때 가장 편안해요.</Para>
          <Para mt={10}>배우자 자리의 기운은 {TG[spTG]}이에요. {TG_INFO[spTG].trait}</Para>
        </Card>
        <SubHead title="02 · 배우자의 별" caption={`${u.gender === 'female' ? '관성' : '재성'} ${spouseN}개`} />
        <Card><Para mt={0}>{spouseN === 0 ? '원국에 배우자의 별이 드러나 있지 않아요. 연애보다 내 일과 성장에 집중하는 시간이 길 수 있지만, 대운·세운에서 이 기운이 들어올 때 인연이 강하게 찾아와요. 오히려 늦게 만난 인연이 오래가는 사주예요.' : spouseN >= 3 ? '배우자의 별이 많아 인연이 자주 찾아와요. 선택지가 많은 만큼 "나에게 맞는 사람"의 기준을 분명히 할수록 행복해져요.' : '배우자의 별이 안정적으로 자리 잡아 좋은 인연을 알아보는 눈이 있어요. 서두르지 않아도 때가 되면 자연스럽게 인연이 이어져요.'}</Para></Card>
        <SubHead title="03 · 연애 패턴" caption="MBTI · 혈액형으로 본 나의 사랑 방식" />
        <Card>
          {pattern.map((t, i) => <Bullet key={i}>{t}</Bullet>)}
          <Bullet>{u.bloodType}형은 연애할 때 {bloodLove[u.bloodType]}.</Bullet>
        </Card>
        <SubHead title="04 · 잘 맞는 사람" caption="4가지 관점으로 본 인연의 결" />
        <ViewsCard views={L.views} />
        <View style={[s.grid2, { marginTop: 12 }]}>
          <Card style={s.cell2}>
            <Text style={txt.caption}>천간합 · 끌리는 일간</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 4, color: colors.ink }}>{STEMS[partnerStem].ko}({STEMS[partnerStem].hanja})일간</Text>
            <Text style={[txt.small, { marginTop: 4 }]}>{STEMS[F.ds].hanja}{STEMS[partnerStem].hanja}합 — 서로 강하게 끌리는 조합이에요</Text>
          </Card>
          <Card style={s.cell2}>
            <Text style={txt.caption}>잘 맞는 띠</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 4, color: colors.ink }}>{goodAnimals.join(' · ')}띠</Text>
            <Text style={[txt.small, { marginTop: 4 }]}>{BRANCHES[ch.year.branch].animal}띠와 합을 이루는 띠예요</Text>
          </Card>
        </View>
        <SubHead title="05 · 매력 포인트" />
        <Card>{[STEM_PERSONA[F.ds].str[0], F.sinsal.includes('dohwa') ? '도화가 있어 처음 보는 사람에게도 매력이 잘 전달돼요' : `${MBTI_INFO[u.mbti].strength}이 상대를 끌어당겨요`, `${THAI_DAYS[thaiDay(u)].trait}의 분위기`].map((t, i) => <Bullet key={i} color={colors.love}>{t}</Bullet>)}</Card>
        <SubHead title="06 · 연애운이 강한 달" caption="앞으로 1년 안에서" />
        <MonthTiles ms={L.ms} k="love" color={colors.love} bg={colors.loveBg} />
        <SubHead title="07 · 인연 흐름이 강해지는 해" caption="앞으로 10년 중에서" />
        <Card style={{ paddingVertical: 4, paddingHorizontal: 18 }}>
          {L.yrs.length ? <SealRows ch="緣" bg={colors.loveBg} color={colors.love} rows={L.yrs.map(x => ({ key: String(x.yy), title: `${x.yy}년`, sub: x.why }))} /> : <Empty>앞으로 10년은 고르게 흘러요. 지금의 인연에 집중해 보세요.</Empty>}
        </Card>
        <SubHead title="08 · 결혼 흐름" caption="대운으로 본 가정의 시기" />
        <Card><Para mt={0}>{daeLove.length ? `배우자의 별이 대운으로 들어오는 시기는 ${daeLove.map(d => d.age + '~' + (d.age + 9) + '세').join(', ')}예요. 이 구간에서 진지한 만남이나 결혼 이야기가 오가기 쉬워요.` : '앞으로의 대운에서 배우자의 별이 크게 들어오지는 않아요. 운의 흐름보다 마음이 맞는 사람을 알아보는 내 기준이 더 중요한 사주예요.'}</Para></Card>
        <SubHead title="09 · 연애할 때 조심할 점" />
        <Card>{[STEM_PERSONA[F.ds].watch, F.topTG.length ? TG_INFO[F.topTG[0].i].care : '', u.mbti[2] === 'T' ? '해결책보다 공감을 먼저 건네 주세요' : '서운함을 쌓아두지 말고 그때그때 말해 주세요'].filter(Boolean).map((t, i) => <Bullet key={i} color="#C27A2C">{t}</Bullet>)}</Card>
      </>
    );
  }

  if (kind === 'money') {
    const M = themeMoney(u, today);
    const daeMoney = dae.list.filter(d => d.age + 9 >= now && ['wealth', 'output'].includes(d.rel)).slice(0, 3);
    const seun = Array.from({ length: 5 }, (_, i) => { const y = cy + i; const yp = pFrom(y - 4); return { y, yp, gG: tgGroup(tenGod(F.ds, yp.stem)) }; });
    hero = (
      <Hero style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
        <Text style={{ fontSize: 40, color: colors.moon, fontWeight: '700' }}>{M.t.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={heroTxt.eyebrow}>나의 돈 성향</Text>
          <Text style={[heroTxt.summ, { fontSize: 20 }]}>{M.t.name}</Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.82)', marginTop: 4 }}>{M.t.desc}</Text>
        </View>
      </Hero>
    );
    basis = (
      <>
        <SubHead title="01 · 재물 그릇" caption={`재성 ${g.wealth}개 · 정재 ${F.tgc[5]} · 편재 ${F.tgc[4]}`} />
        <Card>
          <Para mt={0}>{g.wealth === 0 ? '재성이 드러나 있지 않아 돈을 직접 쫓기보다, 실력과 이름값이 돈을 끌어오는 구조예요. 전문성이 쌓일수록 재물 그릇이 커져요.' : g.wealth <= 2 ? '재성이 적당해 꾸준히 벌고 모으는 힘이 있어요. 안정적인 흐름을 만드는 것이 가장 큰 재테크예요.' : '재성이 많아 돈 냄새를 잘 맡아요. 기회가 많은 만큼 관리 시스템을 갖추는 것이 핵심이에요.'}</Para>
          <Para mt={10}>{F.tgc[5] >= F.tgc[4] ? '정재 쪽이 강해 월급·적금·고정 수입처럼 예측 가능한 돈과 인연이 깊어요.' : '편재 쪽이 강해 사업·영업·인센티브처럼 움직이는 돈에 강해요. 수입 기복에 대비한 비상금이 필수예요.'}</Para>
          {F.strength === '신약' && g.wealth >= 3 ? <Para mt={10}>다만 신약한데 재성이 많은 "재다신약" 구조라, 큰돈을 혼자 감당하기보다 믿을 만한 파트너·시스템과 함께할 때 지킬 수 있어요.</Para> : null}
        </Card>
        <SubHead title="02 · 돈 버는 방식" />
        <Card>{[g.output >= 2 ? '재능과 아이디어가 그대로 돈이 되는 타입이에요. 부업·콘텐츠·기술 판매가 잘 맞아요.' : '', g.officer >= 2 ? '조직 안에서 직급과 함께 수입이 오르는 타입이에요.' : '', g.resource >= 2 ? '자격·전문성으로 몸값을 올리는 타입이에요.' : '', g.peer >= 2 ? '사람과 함께 벌 때 판이 커져요. 다만 수익 배분은 처음부터 분명히.' : '', `용신 ${elName(F.yong)} 업종(${EL_JOB[F.yong].slice(0, 3).join(', ')})과 연결될 때 수입이 안정돼요.`].filter(Boolean).map((t, i) => <Bullet key={i}>{t}</Bullet>)}</Card>
        <SubHead title="03 · 돈 쓰는 습관" />
        <Card>{[u.mbti[3] === 'J' ? '계획형이라 예산을 세우면 잘 지켜요. 대신 계획에 없던 좋은 기회를 놓칠 수 있어요.' : '탐색형이라 새로운 기회에 빠르지만, 예산이 느슨해지기 쉬워요.', u.mbti[2] === 'F' ? '사람과 경험에 쓰는 돈을 아끼지 않아요.' : '가성비와 효율을 따져 합리적으로 써요.', ({ A: '예산표를 써두면 마음이 편해지는 타입이에요.', B: '꽂히면 아낌없이 쓰는 타입이에요.', O: '사람에게 쓰는 돈은 아깝지 않은 타입이에요.', AB: '가성비를 꼼꼼히 따지는 타입이에요.' } as Record<BloodType, string>)[u.bloodType], g.peer >= 3 ? '비겁이 많아 지인 관련 지출(경조사·모임·빌려준 돈)이 커지기 쉬워요.' : ''].filter(Boolean).map((t, i) => <Bullet key={i}>{t}</Bullet>)}</Card>
        <SubHead title="04 · 맞춤 관리법" />
        <Card style={{ gap: 10 }}>
          <ActRow>{M.t.str}</ActRow>
          <ActRow ok={false}>{M.t.watch}</ActRow>
          <Tip title="추천 습관" style={{ marginTop: 2 }}>{M.t.tip}</Tip>
        </Card>
        <SubHead title="05 · 4가지 관점으로 본 재물운" />
        <ViewsCard views={M.views} />
        <SubHead title="06 · 재물이 모이는 시기" caption="10년 대운 기준" />
        <Card style={{ paddingVertical: 4, paddingHorizontal: 18 }}>
          {daeMoney.length ? <SealRows ch="財" bg={colors.moneyBg} color={colors.money} rows={daeMoney.map(d => ({ key: String(d.age), title: `${d.age}~${d.age + 9}세`, sub: `${pText(d.p)} · ${tenName(d.rel)} — ${STAGE_FIELD[d.rel].money}` }))} /> : <Empty>앞으로의 대운은 재물이 한꺼번에 몰리기보다 고르게 흐르는 편이에요. 꾸준한 저축과 실력 쌓기가 가장 확실한 길이에요.</Empty>}
        </Card>
        <SubHead title="07 · 앞으로 5년 재물 흐름" />
        <Card style={{ paddingVertical: 2, paddingHorizontal: 16 }}>
          {seun.map((x, i) => (
            <View key={x.y} style={[s.drow, i ? s.topLine : null]}>
              <View style={s.dd}><Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink }}>{x.y}</Text><Text style={{ fontSize: 11, color: colors.inkMute }}>{BRANCHES[x.yp.branch].animal}</Text></View>
              <Text style={{ flex: 1, fontSize: 14, lineHeight: 20, color: colors.ink }}>{FIELD[x.gG].money}</Text>
            </View>
          ))}
        </Card>
        <SubHead title="08 · 재물 흐름이 좋은 달" caption="앞으로 1년 안에서" />
        <MonthTiles ms={M.ms} k="money" color={colors.money} bg={colors.moneyBg} />
        <SubHead title="09 · 재물 개운법" />
        <InfoRows rows={[['財', '지갑·소품 색', EL_LUCK[F.yong].color], ['愼', '돈이 들어오는 방향', EL_LUCK[F.yong].dir], ['數', '행운의 숫자', EL_LUCK[F.yong].num], ['行', '재물 습관', EL_LUCK[F.yong].act]]} />
        <Text style={[txt.caption, { marginTop: 12, textAlign: 'center' }]}>투자·대출 등 금전 결정은 운세가 아닌 전문가 상담을 바탕으로 해주세요.</Text>
      </>
    );
  }

  if (kind === 'career') {
    const C = themeCareer(u, today);
    const type = g.officer >= 2 && g.resource >= 1 ? ['組', '조직형 리더', '체계 안에서 인정받으며 올라가는 타입'] : g.output >= 2 && g.wealth >= 1 ? ['創', '사업·프리랜서형', '내 아이디어로 판을 벌일 때 빛나는 타입'] : g.resource >= 2 || F.tgc[2] >= 2 ? ['專', '전문가형', '한 분야를 깊게 파서 대체 불가능해지는 타입'] : F.tgc[3] >= 2 ? ['色', '창작·기획형', '틀을 깨는 창의력이 무기인 타입'] : ['均', '균형형', '어느 환경에서도 적응하는 타입'];
    const lead = F.tgc[6] >= 1 ? '위기에 앞장서는 돌파형 리더' : F.tgc[7] >= 1 ? '원칙과 신뢰로 이끄는 관리형 리더' : g.output >= 2 ? '아이디어로 사람을 모으는 비전형 리더' : g.resource >= 2 ? '가르치고 키워주는 멘토형 리더' : '함께 뛰는 동료형 리더';
    const seun = Array.from({ length: 5 }, (_, i) => { const y = cy + i; const yp = pFrom(y - 4); return { y, yp, gG: tgGroup(tenGod(F.ds, yp.stem)) }; });
    const yearsOf = (k: string) => seun.filter(x => x.gG === k).map(x => x.y).join(', ') || '—';
    const goodY = seun.filter(x => ['output', 'officer', 'wealth'].includes(x.gG));
    hero = (
      <Hero>
        <Text style={heroTxt.eyebrow}>나에게 맞는 일</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>{C.jobs.map((j, i) => <DarkChip key={j} gold={i < 2}>{j}</DarkChip>)}</View>
      </Hero>
    );
    basis = (
      <>
        <SubHead title="01 · 직업 유형" />
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Text style={{ fontSize: 32, fontWeight: '700', color: colors.purpleSoft }}>{type[0]}</Text>
          <View style={{ flex: 1 }}><Text style={txt.h3}>{type[1]}</Text><Text style={[txt.small, { marginTop: 2 }]}>{type[2]}</Text></View>
        </Card>
        <Card style={{ marginTop: 10 }}>
          <Para mt={0}>관성 {g.officer} · 식상 {g.output} · 인성 {g.resource} · 재성 {g.wealth} · 비겁 {g.peer}. {g.officer >= 2 ? '관성이 강해 조직의 룰 안에서 신뢰를 쌓는 데 능해요. ' : ''}{g.output >= 2 ? '식상이 강해 만들고 표현하는 일에서 성취감을 느껴요. ' : ''}{g.resource >= 2 ? '인성이 강해 배우고 가르치는 일과 잘 맞아요. ' : ''}{g.wealth >= 2 ? '재성이 강해 성과가 숫자로 보이는 일에 동기부여가 돼요. ' : ''}</Para>
        </Card>
        <SubHead title="02 · 용신으로 본 업종" caption={`${elName(F.yong)} 기운의 일`} />
        <Card>
          <View style={s.chips}>{EL_JOB[F.yong].map(j => <Pill key={j}>{j}</Pill>)}</View>
          <Para mt={12}>나에게 부족한 기운을 채워주는 업종이라 오래 일해도 덜 지치고, 운의 흐름이 안정돼요. 희신 {elName(F.hee).split('(')[0]} 업종({EL_JOB[F.hee].slice(0, 2).join(', ')})도 좋아요.</Para>
        </Card>
        <SubHead title="03 · 일하는 스타일" />
        <Card>
          {C.style.map(t => <Bullet key={t}>{t}</Bullet>)}
          <Bullet>{BLOOD_INFO[u.bloodType].trait}이라 {({ A: '꼼꼼한 마무리로 신뢰를 얻어요', B: '몰입할 때 폭발적인 성과를 내요', O: '팀을 하나로 묶는 역할을 해요', AB: '남다른 해결책을 찾아내요' } as Record<BloodType, string>)[u.bloodType]}.</Bullet>
        </Card>
        <SubHead title="04 · 리더십 유형" />
        <Card><Text style={txt.h3}>{lead}</Text>{F.topTG.length ? <Para>{TG_INFO[F.topTG[0].i].trait}</Para> : null}</Card>
        <SubHead title="05 · 일할 때 강점과 약점" />
        <Card>
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.success }}>강점</Text>
          {F.topTG.slice(0, 3).map(x => <Bullet key={x.i} color={colors.success}>{TG_INFO[x.i].talent}에 재능</Bullet>)}
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.thai, marginTop: 12 }}>보완점</Text>
          {F.topTG.slice(0, 2).map(x => <Bullet key={x.i} color="#C27A2C">{TG_INFO[x.i].care}</Bullet>)}
        </Card>
        <SubHead title="06 · 4가지 관점으로 본 적성" />
        <ViewsCard views={C.views} />
        <SubHead title="07 · 커리어 상승기" caption="10년 대운 기준" />
        <Card style={{ paddingVertical: 4, paddingHorizontal: 18 }}>
          {C.ups.length ? <SealRows ch="昇" bg={colors.workBg} color={colors.work} rows={C.ups.map(d => ({ key: String(d.age), title: `${d.age}~${d.age + 9}세`, sub: `${pText(d.p)} · ${tenName(d.rel)} — ${STAGE_FIELD[d.rel].work}` }))} /> : <Empty>앞으로는 쌓아온 것을 다지는 흐름이에요. 전문성을 깊게 파는 것이 가장 큰 무기예요.</Empty>}
        </Card>
        <SubHead title="08 · 앞으로 5년 커리어 흐름" />
        <Card style={{ paddingVertical: 2, paddingHorizontal: 16 }}>
          {seun.map((x, i) => (
            <View key={x.y} style={[s.drow, i ? s.topLine : null]}>
              <View style={s.dd}><Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink }}>{x.y}</Text><Text style={{ fontSize: 11, color: colors.inkMute }}>{GROUP_KO[x.gG]}</Text></View>
              <Text style={{ flex: 1, fontSize: 14, lineHeight: 20, color: colors.ink }}>{FIELD[x.gG].work}</Text>
            </View>
          ))}
        </Card>
        <SubHead title="09 · 이직·창업 타이밍" />
        <Card>
          {[goodY.length ? `이직·승진에 힘이 실리는 해: ${yearsOf('officer')}` : '', `새 도전·창업에 힘이 실리는 해: ${yearsOf('output')}`, `성과·수입이 오르는 해: ${yearsOf('wealth')}`, `준비·공부에 좋은 해: ${yearsOf('resource')}`].filter(Boolean).map((t, i) => <Bullet key={i}>{t}</Bullet>)}
        </Card>
      </>
    );
  }

  return (
    <Screen title="테마 운세" back right={<ShareIconButton item={item} spec={themeSpec(u, today, kind)} />}>
      <HeadRow item={item} caption={`${pText(F.ch.day)}일주 · ${u.mbti} · ${u.bloodType}형`} />
      <View style={{ marginTop: 12 }}><Segmented<ThemeKind> options={TABS} value={kind} onChange={setKind} /></View>
      {hero}
      <ReportArea key={item.key} rk={{ key: item.key, kind: `theme-${kind}`, user: u, today }} item={item} basis={basis} />
      <ShareCta item={item} spec={themeSpec(u, today, kind)} />
      <Disclaimer compact />
    </Screen>
  );
}

const s = StyleSheet.create({
  grid2: { flexDirection: 'row', gap: 12 },
  cell2: { flex: 1, padding: 16 },
  mtile: { flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 6, borderRadius: radius.lg },
  lrow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  topLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
  drow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  dd: { width: 40, alignItems: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
