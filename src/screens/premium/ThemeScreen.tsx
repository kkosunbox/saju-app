import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@/navigation/compat';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Disclaimer from '../../components/Disclaimer';
import { BodyState, Bullet, DarkChip, HeadRow, LockGate, Hero, Para, SubHead, heroTxt, scoreColor } from '../../components/premium/Kit';
import { Image } from 'expo-image';
import { Closing, InfoRows, SajuIcon, SajuIconName } from '../../components/premium/SajuParts';
import { PartPending, ReadingBanner } from '../../components/premium/Reading';
import { useApp } from '../../context/AppContext';
import { RootStackParamList } from '../../navigation/types';
import { ITEMS, ThemeKind } from '../../services/premium/catalog';
import { pText } from '../../services/premium/helpers';
import { SajuFull, ThemeCareer, ThemeContent, ThemeLove, ThemeMoney, ThemePreview } from '../../types/premium';
import { Pillar } from '../../types/content';
import { ReadingView, ThemeReading } from '../../types/reading';
import { usePremiumContent, usePremiumPreview, useReading } from '../../services/server/premiumApi';
import { EL_LUCK } from '../../services/premium/data';
import { ELEMENT_INFO, STEMS } from '../../data/sajuData';
import { colors, isDark } from '../../theme/colors';
import { radius, sansW, txt } from '../../theme/typography';
import ShareCta, { ShareIconButton } from '../../components/ShareCta';
import { themeSpec } from '../../services/share/shareSpecs';

export default function ThemeScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'Theme'>>();
  const { user: u } = useApp();
  const kind = params.kind;
  const ref = { kind: 'theme', theme: kind } as const;
  const content = usePremiumContent<ThemeContent<ThemeKind> & { details: ThemeDetails }>(ref);
  const { reading, retry } = useReading<ThemeReading>(content);
  const preview = usePremiumPreview<ThemePreview>(ref, !content.open);
  if (!u?.natal) return null;
  const item = ITEMS.theme(kind);
  const data = content.data?.data; const F = content.data?.F;
  // 상단 요약(무료): 열람했으면 본문에서, 아니면 미리보기에서
  const top = (data ? { kind, ...data } : preview.data?.kind === kind ? preview.data : undefined) as (ThemePreview & Partial<ThemeLove & ThemeMoney & ThemeCareer>) | undefined;
  const spec = data ? themeSpec(u, kind, data) : null;
  let hero: React.ReactNode = <BodyState error={preview.isError} />;
  if (top?.kind === 'love') {
    hero = (
      <Hero>
        <Text style={heroTxt.eyebrow}>나의 연애 스타일</Text>
        <Text style={[heroTxt.summ, { fontSize: 20 }]}>{top.st}</Text>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.82)', marginTop: 6 }}>{u.bloodType}형답게 {top.blood}.</Text>
      </Hero>
    );
  } else if (top?.kind === 'money') {
    hero = (
      <Hero style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
        <Text style={{ fontSize: 40, color: colors.moon, fontWeight: '700' }}>{top.t.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={heroTxt.eyebrow}>나의 돈 성향</Text>
          <Text style={[heroTxt.summ, { fontSize: 20 }]}>{top.t.name}</Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.82)', marginTop: 4 }}>{top.t.desc}</Text>
        </View>
      </Hero>
    );
  } else if (top?.kind === 'career') {
    hero = (
      <Hero>
        <Text style={heroTxt.eyebrow}>나에게 맞는 일</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>{top.jobs.map((j, i) => <DarkChip key={j} gold={i < 2}>{j}</DarkChip>)}</View>
      </Hero>
    );
  }

  return (
    <Screen title="테마 운세" back right={<ShareIconButton item={item} spec={spec} />}>
      <HeadRow item={item} caption={`${pText(u.natal.chart.day)}일주 · ${u.mbti} · ${u.bloodType}형`} />
      {hero}
      {!content.open ? <LockGate key={item.key} item={item} />
        : data && F ? <ThemeBody key={item.key} kind={kind} D={data.details} F={F} reading={reading} onRetry={retry} />
        : <BodyState error={content.isError} onRetry={() => content.refetch()} />}
      <ShareCta item={item} spec={spec} banner style={{ marginTop: 16 }} />
      <Disclaimer compact mt={24} />
    </Screen>
  );
}

interface ThemeDetails {
  years: { year: number; pillar: Pillar; group: string; score: number }[];
  months: { y: number; m: number; score: number }[];
  periods: { age: number; pillar: Pillar; group: string; score: number }[];
  love?: { partnerStem: number; goodAnimals: string[]; types: string[] };
  money?: { typeName: string; typeDesc: string; wealthCount: number; jeongjae: number; pyeonjae: number };
  career?: { type: string; typeDesc: string; leadership: string; jobs: string[]; yongsinJobs: string[] };
}

const THEME_COLOR: Record<ThemeKind, [string, string, SajuIconName]> = {
  love: [colors.love, colors.loveBg, 'heart'], money: [colors.money, colors.moneyBg, 'database'], career: [colors.work, colors.workBg, 'work'],
};

// 용신 업종 칩 — 칩마다 다른 파스텔 바탕 (Figma Ticker)
const TICKER_BG = ['#E7F0FF', '#DEF4FF', '#E4F6F2', '#F2E7FF', '#DEE5FF'];
function Ticker({ children, i }: { children: React.ReactNode; i: number }) {
  return <View style={[s.ticker, { backgroundColor: isDark ? colors.surface : TICKER_BG[i % TICKER_BG.length] }]}><Text style={s.tickerText}>{children}</Text></View>;
}

// 대운 칸 아이콘 — 테마 색으로 칠한 16px (Figma)
const PERIOD_ICON: Partial<Record<ThemeKind, number>> = {
  love: require('../../../assets/figma/theme/heart.svg'), money: require('../../../assets/figma/theme/database.svg'),
};

/** 점수·시기·유형은 서버 계산값, 글은 AI 풀이 */
function ThemeBody({ kind, D, F, reading, onRetry }: { kind: ThemeKind; D: ThemeDetails; F: SajuFull; reading: ReadingView<ThemeReading> | null; onRetry(): void }) {
  const writing = reading?.status === 'writing';
  const P = reading?.parts ?? {};
  const core = P.core; const timing = P.timing;
  const [color, bg, icon] = THEME_COLOR[kind];
  const name = { love: '연애', money: '재물', career: '커리어' }[kind];
  const pending = (lines = 3) => <PartPending writing={writing} lines={lines} />;
  let n = 0; const no = () => String(++n).padStart(2, '0');

  return (
    <>
      <ReadingBanner reading={reading} onRetry={onRetry} />
      <Card style={{ marginTop: 16 }}>
        {core ? (<><Text style={txt.h3}>{core.headline}</Text><Para>{core.summary}</Para></>) : pending(4)}
      </Card>

      {kind === 'love' ? (
        <>
          <SubHead title={`${no()} · 연애 패턴`} caption="시작할 때 · 깊어질 때 · 다툴 때 · 회복할 때" />
          {P.core?.pattern ? (
            <View style={{ gap: 10 }}>
              {P.core.pattern.map((x, i) => (
                <Card key={i}>
                  <Text style={[txt.caption, { color }]}>{['시작할 때', '깊어질 때', '다툴 때', '회복할 때'][i]}</Text>
                  <Text style={[txt.h3, { marginTop: 4 }]}>{x.title}</Text>
                  <Para>{x.text}</Para>
                </Card>
              ))}
            </View>
          ) : <Card>{pending(6)}</Card>}
          <SubHead title={`${no()} · 매력 포인트`} />
          <Card>{P.core?.charms ? P.core.charms.map((t, i) => <Bullet key={i} color={colors.love}>{t}</Bullet>) : pending()}</Card>
          <SubHead title={`${no()} · 잘 맞는 사람`} caption="사주 · 띠 · MBTI로 본 인연의 결" />
          {D.love ? (
            <View style={s.grid3}>
              {([['끌리는 일간', `${STEMS[D.love.partnerStem].ko}(${STEMS[D.love.partnerStem].hanja})`], ['잘 맞는 띠', D.love.goodAnimals.join('·')], ['잘 맞는 MBTI', D.love.types.join(' ')]] as const).map(([l, v]) => (
                <Card key={l} style={s.cell3}><Text style={txt.caption}>{l}</Text><Text style={{ fontSize: 14, fontWeight: '700', marginTop: 6, color: colors.ink, textAlign: 'center' }}>{v}</Text></Card>
              ))}
            </View>
          ) : null}
          {P.match ? (
            <View style={{ gap: 10, marginTop: 12 }}>
              {P.match.match.map((x, i) => <Card key={i}><Text style={txt.h3}>{x.title}</Text><Para>{x.text}</Para></Card>)}
              <Card>
                <Text style={[txt.caption, { color: colors.thai }]}>부딪히기 쉬운 사람</Text>
                <Text style={[txt.h3, { marginTop: 4 }]}>{P.match.clash.title}</Text>
                <Para>{P.match.clash.text}</Para>
              </Card>
              <Card>
                <Text style={s.label}>내가 호감 있을 때 보이는 신호</Text>
                {P.match.signals.map((t, i) => <Bullet key={i} color={colors.love}>{t}</Bullet>)}
              </Card>
            </View>
          ) : <Card style={{ marginTop: 12 }}>{pending(5)}</Card>}
          <SubHead title={`${no()} · 연애할 때 조심할 점`} />
          <Card>{P.core?.cautions ? P.core.cautions.map((t, i) => <Bullet key={i} color={colors.love}>{t}</Bullet>) : pending()}</Card>
        </>
      ) : null}

      {kind === 'money' ? (
        <>
          <SubHead title={`${no()} · 돈 버는 방식`} caption={D.money ? `재성 ${D.money.wealthCount}개 · 정재 ${D.money.jeongjae} · 편재 ${D.money.pyeonjae}` : undefined} />
          {P.core?.earn ? (
            <>
              <Card><Para mt={0}>{P.core.earn.text}</Para></Card>
              <View style={{ gap: 10, marginTop: 10 }}>{P.core.earn.ways.map((x, i) => <Card key={i}><Text style={txt.h3}>{x.title}</Text><Para>{x.text}</Para></Card>)}</View>
            </>
          ) : <Card>{pending(5)}</Card>}
          <SubHead title={`${no()} · 돈 쓰는 습관`} />
          <Card>
            {P.core?.spend ? (<><Para mt={0}>{P.core.spend.text}</Para><Text style={[s.label, { marginTop: 12 }]}>돈이 새기 쉬운 곳</Text>{P.core.spend.leaks.map((t, i) => <Bullet key={i} color={colors.money}>{t}</Bullet>)}</>) : pending(4)}
          </Card>
          <SubHead title={`${no()} · 맞춤 관리법`} />
          <Card>
            {P.core?.manage ? (<><Para mt={0}>{P.core.manage.text}</Para><Text style={[s.label, { marginTop: 12 }]}>재물 습관</Text>{P.core.manage.habits.map((t, i) => <Bullet key={i} color={colors.money}>{t}</Bullet>)}</>) : pending(4)}
          </Card>
        </>
      ) : null}

      {kind === 'career' && D.career ? (
        <>
          <SubHead title={`${no()} · 직업 유형`} />
          <Card>
            <Text style={txt.h3}>{D.career.type}</Text>
            <Text style={[txt.small, { marginTop: 2 }]}>{D.career.typeDesc}</Text>
            {P.core ? <Para mt={10}>{P.core.type}</Para> : pending()}
          </Card>
          <SubHead title={`${no()} · 잘 맞는 일`} caption="위의 기질별 직군과 용신 업종에서" />
          <Text style={s.tickerLabel}>용신 {ELEMENT_INFO[F.yong].ko}({ELEMENT_INFO[F.yong].hanja})의 업종</Text>
          <View style={s.chips}>{D.career.yongsinJobs.map((j, i) => <Ticker key={j} i={i}>{j}</Ticker>)}</View>
          {P.core ? <View style={{ gap: 10, marginTop: 12 }}>{P.core.jobs.map((x, i) => <Card key={i}><Text style={txt.h3}>{x.title}</Text><Para>{x.text}</Para></Card>)}</View> : <Card style={{ marginTop: 12 }}>{pending(5)}</Card>}
          <SubHead title={`${no()} · 일하는 방식`} />
          <Card>
            {P.core ? (
              <>
                <Para mt={0}>{P.core.style}</Para>
                <Text style={[s.label, { marginTop: 14 }]}>리더십 · {D.career.leadership}</Text>
                <Para mt={4}>{P.core.leadership}</Para>
                <Text style={[s.label, { marginTop: 14 }]}>맞는 환경</Text>
                <Para mt={4}>{P.core.environment}</Para>
              </>
            ) : pending(6)}
          </Card>
          <SubHead title={`${no()} · 강점과 보완점`} />
          <Card>
            {P.core ? (
              <>
                <Text style={[s.label, { color: colors.success }]}>강점</Text>
                {P.core.strengths.map((t, i) => <Bullet key={i} color={colors.success}>{t}</Bullet>)}
                <Text style={[s.label, { color: colors.thai, marginTop: 12 }]}>보완점</Text>
                {P.core.weaknesses.map((t, i) => <Bullet key={i} color="#C27A2C">{t}</Bullet>)}
              </>
            ) : pending(5)}
          </Card>
        </>
      ) : null}

      <SubHead title={`${no()} · 앞으로 5년 ${name} 흐름`} />
      <Card style={{ paddingVertical: 4, paddingHorizontal: 16 }}>
        {D.years.map((x, i) => {
          const t = timing?.years[i];
          return (
            <View key={x.year} style={[s.yrow, i ? s.topLine : null]}>
              <View style={s.between}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink }}>{x.year}년 <Text style={[txt.caption, { fontWeight: '500' }]}>{pText(x.pillar)} · {x.group}</Text></Text>
                <Text style={{ fontSize: 15, fontWeight: '700', color: scoreColor(x.score) }}>{x.score}</Text>
              </View>
              <View style={s.track}><View style={[s.fill, { width: `${Math.max(0, Math.min(100, (x.score - 40) / 0.59))}%`, backgroundColor: color }]} /></View>
              {t ? <Text style={[txt.bodyStrong, { marginTop: 6 }]}>{t.title}</Text> : null}
              {t ? <Text style={[txt.small, { marginTop: 2 }]}>{t.text}</Text> : <PartPending writing={writing} lines={1} />}
            </View>
          );
        })}
      </Card>

      <SubHead title={`${no()} · ${name}운이 좋은 달`} caption="앞으로 1년 안에서" />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {D.months.map(x => (
          <View key={`${x.y}-${x.m}`} style={[s.mtile, { backgroundColor: bg }]}>
            <Text style={txt.caption}>{x.y}년</Text>
            <Text style={{ fontSize: 22, fontWeight: '700', color }}>{x.m}월</Text>
            <Text style={txt.small}>{x.score}점</Text>
          </View>
        ))}
      </View>
      {timing ? <Card style={{ marginTop: 10 }}>{timing.months.map((t, i) => <Bullet key={i} color={color}>{t}</Bullet>)}</Card> : writing ? <Card style={{ marginTop: 10 }}>{pending()}</Card> : null}

      <SubHead title={`${no()} · ${name}에 힘이 실리는 대운`} caption="10년 대운 기준" />
      {D.periods.length ? (
        <View style={{ gap: 10 }}>
          {D.periods.map((p, i) => (
            <Card key={p.age}>
              <View style={s.between}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={s.iconBox}>{PERIOD_ICON[kind] ? <Image source={PERIOD_ICON[kind]} style={{ width: 16, height: 16 }} contentFit="contain" /> : <SajuIcon name={icon} />}</View>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>{p.age}~{p.age + 9}세 <Text style={[txt.caption, { fontWeight: '500' }]}>{pText(p.pillar)} · {p.group}</Text></Text>
                </View>
                <Text style={{ fontWeight: '700', color: scoreColor(p.score) }}>{p.score}</Text>
              </View>
              {timing?.periods[i] ? <Para>{timing.periods[i]}</Para> : pending(2)}
            </Card>
          ))}
        </View>
      ) : <Card><Para mt={0}>앞으로의 대운은 {name}이 한꺼번에 몰리기보다 고르게 흐르는 편이에요. 해마다의 흐름을 참고해 꾸준히 쌓아 가세요.</Para></Card>}

      <SubHead title={`${no()} · 지금 할 일`} />
      <Card>{timing ? <Para mt={0}>{timing.now}</Para> : pending()}</Card>
      {kind === 'career' ? (
        <>
          <SubHead title={`${no()} · 이직·승진·창업 타이밍`} />
          <Card>{timing?.move ? <Para mt={0}>{timing.move}</Para> : pending()}</Card>
        </>
      ) : null}
      {kind === 'money' ? (
        <>
          <SubHead title={`${no()} · 재물 개운법`} />
          <InfoRows rows={[['luck-color-gold', '지갑 · 소품 색', EL_LUCK[F.yong].color], ['luck-direction-gold', '돈이 들어오는 방향', EL_LUCK[F.yong].dir], ['luck-number-gold', '행운의 숫자', EL_LUCK[F.yong].num]]} />
          {timing?.luck ? <Card style={{ marginTop: 10 }}><Para mt={0}>{timing.luck}</Para></Card> : null}
          <Text style={s.moneyNote}>투자·대출 등 금전 결정은 운세가 아닌 전문가 상담을 바탕으로 해주세요.</Text>
        </>
      ) : null}
      {core ? <Closing title="마지막 한마디" top={3} style={{ marginTop: kind === 'career' ? 32 : 16 }}>{core.closing}</Closing> : null}
    </>
  );
}

const s = StyleSheet.create({
  mtile: { flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 6, borderRadius: radius.lg },
  topLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
  // 용신 업종: 섹션 왼쪽 끝에서 6 들여 놓는다 (Figma x 30)
  chips: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 8, paddingHorizontal: 6 },
  tickerLabel: { ...sansW('600'), fontSize: 12, lineHeight: 17, letterSpacing: -0.48, color: isDark ? colors.ink : '#000000', marginBottom: 8, paddingHorizontal: 6 },
  ticker: { height: 32, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 30 },
  tickerText: { ...sansW('600'), fontSize: 13, color: isDark ? colors.ink : '#000000', opacity: 0.8 },
  iconBox: { width: 31, height: 31, borderRadius: 6, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  grid3: { flexDirection: 'row', gap: 8 },
  cell3: { flex: 1, paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center' },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  label: { fontSize: 12, fontWeight: '700', color: colors.inkSub },
  moneyNote: { ...sansW('700'), fontSize: 12, lineHeight: 17, letterSpacing: -0.48, color: isDark ? colors.inkMute : '#838383', textAlign: 'center', marginTop: 16 },
  yrow: { paddingVertical: 12 },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.line, overflow: 'hidden', marginTop: 8 },
  fill: { height: 6, borderRadius: 3 },
});
