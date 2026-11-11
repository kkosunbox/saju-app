import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Circle, Defs, Line, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Disclaimer from '../../components/Disclaimer';
import { BodyState, Bullet, HeadRow, LockGate, Para, SubHead, Tip } from '../../components/premium/Kit';
import { PartPending, ReadingBanner } from '../../components/premium/Reading';
import { PREVIEW_STEPS, PreviewMakingCard, PreviewReveal, usePreviewMaking } from '../../components/premium/PreviewMaking';
import { ReadingReveal, ReadingStepsScreen, useReadingGate } from '../../components/premium/ReadingGate';
import { ReadingView, SpouseReading } from '../../types/reading';
import { useApp } from '../../context/AppContext';
import { ITEMS } from '../../services/premium/catalog';
import { pText } from '../../services/premium/helpers';
import { SpousePreview, SpouseReport } from '../../types/premium';
import { usePremiumContent, usePremiumPreview, useReading } from '../../services/server/premiumApi';
import { ELEMENT_INFO } from '../../data/sajuData';
import { MBTI_INFO } from '../../data/mbtiData';
import { colors, isDark } from '../../theme/colors';
import { fonts, radius, sansW, txt } from '../../theme/typography';
import ShareCta, { ShareIconButton } from '../../components/ShareCta';
import { spouseSpec } from '../../services/share/shareSpecs';
import FriendCompare from '../../components/FriendCompare';
import LoadingScreen from '../../components/LoadingScreen';
import { Logo } from '../../components/Mascot';

/** 프리미엄: 미래 배우자 리포트 — 첫 화면은 무료로 보여주고 나머지는 잠금 */
export default function SpouseScreen() {
  const { user: u } = useApp();
  const content = usePremiumContent<SpouseReport>({ kind: 'spouse' });
  const { reading, retry } = useReading<SpouseReading>(content);
  const gate = useReadingGate(content.open ? reading : null, content);
  const preview = usePremiumPreview<SpousePreview>({ kind: 'spouse' }, !content.open);
  const making = usePreviewMaking('spouse', !!preview.data, !content.open && !preview.isError, PREVIEW_STEPS.spouse.length);
  // 카드는 Figma 327×168 비율을 지킨다 — 폭이 넓은 기기에서도 그림이 카드 전체를 채우게
  const [heroW, setHeroW] = React.useState(327);
  if (!u) return null;
  const item = ITEMS.spouse();
  if (content.open && gate.show) return <ReadingStepsScreen title="미래 배우자 리포트" kind="spouse" reading={reading} />;
  const R = content.data?.data;
  // 첫 화면(무료): 열람했으면 본문에서, 아니면 미리보기에서
  const sum: SpousePreview | undefined = R
    ? { spouseEl: R.spouseEl, headline: R.headline, mbti: R.mbti[0], animal: R.animals[0], ageGap: R.ageGap, thisYear: R.yearIdx[0].v, bestYear: R.bestYear.yy }
    : preview.data;
  if (making.making || (!sum && !content.open)) {
    return (
      <Screen title="미래 배우자 리포트" back>
        <HeadRow item={item} caption="배우자의 별을 찾는 중" />
        {preview.isError ? <BodyState error onRetry={() => preview.refetch()} />
          : <PreviewMakingCard gate={making} steps={PREVIEW_STEPS.spouse} title="미래 배우자를 그리고 있어요" />}
      </Screen>
    );
  }
  if (!sum) return <LoadingScreen />;
  const el = ELEMENT_INFO[sum.spouseEl];
  const spec = spouseSpec(u, sum);

  return (
    <Screen title="미래 배우자 리포트" back right={<ShareIconButton item={item} spec={spec} />}>
      <FriendCompare route="Spouse" spec={spec} />
      <HeadRow item={item} caption={`배우자의 별 · ${el.ko}(${el.hanja})`} />
      {/* Figma 운픽_22 히어로 — 그림 카드 위 로고 · 한 줄 · 칩, 아래 회색 지수 줄 */}
      <PreviewReveal gate={making}>
      <View style={[s.hero, { minHeight: Math.round((heroW * 168) / 327) }]} onLayout={(e) => setHeroW(e.nativeEvent.layout.width)}>
        <Image source={require('../../../assets/figma/spouse/hero.webp')} style={s.heroArt} contentFit="cover" contentPosition="right bottom" accessible={false} />
        <View style={s.heroTop}><Logo height={29} /></View>
        <Text style={s.eyebrow}>{u.nickname}님의 미래 배우자는</Text>
        <Text style={s.headline}>{sum.headline}</Text>
        <View style={s.chips}>
          <View style={[s.chip, { borderColor: GOLD }]}><Text style={[s.chipText, { color: GOLD, opacity: 1 }]}>{sum.mbti}</Text></View>
          <View style={s.chip}><Text style={s.chipText}>{sum.animal}띠</Text></View>
          <View style={s.chip}><Text style={s.chipText}>{sum.ageGap}</Text></View>
        </View>
      </View>
      <View style={s.stats}>
        <View style={s.stat}><Text style={s.statLabel}>올해 인연 지수</Text><Text style={s.statNum}>{sum.thisYear}</Text></View>
        <View style={s.stat}><Text style={s.statLabel}>인연이 가장 강한 해</Text><Text style={s.statNum}>{sum.bestYear}</Text></View>
      </View>
      </PreviewReveal>

      {!content.open ? <LockGate item={item} />
        : R ? <ReadingReveal on={gate.appeared}><SpouseBody R={R} reading={reading} onRetry={retry} /></ReadingReveal>
        : <BodyState error={content.isError} onRetry={() => content.refetch()} />}
      <ShareCta item={item} spec={spec} />
      <Disclaimer compact />
    </Screen>
  );
}

/** 지수·조건·시기는 서버 계산값, 글은 AI 풀이 */
function SpouseBody({ R, reading, onRetry }: { R: SpouseReport; reading: ReadingView<SpouseReading> | null; onRetry(): void }) {
  const el = ELEMENT_INFO[R.spouseEl];
  const writing = reading?.status === 'writing';
  const { portrait, mine, timing } = reading?.parts ?? {};
  const pending = (lines = 3) => <PartPending writing={writing} lines={lines} />;
  return (
    <>
        <ReadingBanner reading={reading} onRetry={onRetry} />
        <SubHead title="01 · 그 사람은 이런 사람" caption={`${el.ko}(${el.hanja})의 기운 · ${R.persona.img}`} />
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <IconBox icon="user" size={38} />
            <View style={{ flex: 1 }}><Text style={txt.h3}>{R.persona.core}</Text></View>
          </View>
          {portrait ? (
            <>
              <Text style={[txt.bodyStrong, { marginTop: 12 }]}>{portrait.headline}</Text>
              <Para mt={6}>{portrait.summary}</Para>
              <Text style={[s.label, { marginTop: 14 }]}>첫인상</Text>
              <Para mt={4}>{portrait.look}</Para>
            </>
          ) : pending(5)}
        </Card>
        {portrait ? <View style={{ gap: 10, marginTop: 10 }}>{portrait.traits.map((x, i) => <Card key={i}><Text style={txt.h3}>{x.title}</Text><Para>{x.text}</Para></Card>)}</View> : null}

        <SubHead title="02 · 사랑하는 방식과 경제관" />
        <Card>
          {portrait ? (
            <>
              <Heading icon="heart">사랑을 표현하는 방식</Heading>
              <Para>{portrait.love}</Para>
              <Heading icon="money" mt={16}>돈을 대하는 방식</Heading>
              <Para>{portrait.money}</Para>
              <Heading icon="work" mt={16}>일하는 모습</Heading>
              <Para>{portrait.work}</Para>
            </>
          ) : pending(6)}
          <Text style={[txt.caption, { marginTop: 16 }]}>이런 일을 하고 있을 가능성이 커요</Text>
          <View style={s.wrap}>{R.jobs.map(j => <View key={j} style={s.job}><Text style={s.jobText}>{j}</Text></View>)}</View>
        </Card>

        <SubHead title="03 · 이런 신호가 보이면 그 사람이에요" caption="처음 만났을 때 알아보는 법" />
        <Card style={{ gap: 10 }}>{portrait ? portrait.signs.map(t => <SignRow key={t}>{t}</SignRow>) : pending(5)}</Card>

        <SubHead title="04 · 찰떡 조건" caption="MBTI · 띠 · 나이" />
        <View style={s.grid}>
          <Card style={s.cell}><Text style={txt.caption}>MBTI</Text><Text style={s.big}>{R.mbti.join(' · ')}</Text><Text style={txt.caption}>{MBTI_INFO[R.mbti[0] as keyof typeof MBTI_INFO]?.nickname}</Text></Card>
          <Card style={s.cell}><Text style={txt.caption}>잘 맞는 띠</Text><Text style={s.big}>{R.animals.join(' · ')}</Text><Text style={txt.caption}>합을 이루는 띠</Text></Card>
        </View>
        <Card style={{ marginTop: 10 }}>
          <Text style={txt.h3}>{R.ageGap} 상대</Text>
          {portrait ? <Para>{portrait.match}</Para> : pending(3)}
          <View style={s.avoid}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.ink }}>조금 더 노력이 필요한 상대</Text>
            <Text style={[txt.small, { marginTop: 4 }]}>{R.avoidMbti} 유형{R.avoidAnimals.length ? ` · ${R.avoidAnimals.join('·')}띠` : ''}</Text>
          </View>
        </Card>

        <SubHead title="05 · 나의 배우자 운" caption={`배우자의 별 ${R.star.n}개${R.star.type ? ` · ${R.star.type[0]}` : ''}`} />
        <Card style={{ paddingVertical: 4, paddingHorizontal: 16 }}>
          <View style={s.lrow}>
            <IconBox icon="star" />
            <View style={{ flex: 1 }}><Text style={txt.h3}>배우자의 별</Text>{mine ? <Text style={[txt.small, { marginTop: 2 }]}>{mine.star}</Text> : pending(2)}</View>
          </View>
          <View style={[s.lrow, s.line]}>
            <IconBox icon="users" />
            <View style={{ flex: 1 }}><Text style={txt.h3}>배우자 자리 · {R.stage[0]}</Text>{mine ? <Text style={[txt.small, { marginTop: 2 }]}>{mine.seat}</Text> : pending(2)}</View>
          </View>
        </Card>

        <SubHead title="06 · 언제 만날까요?" caption="앞으로 6년 인연 지수" />
        <Card style={{ paddingTop: 13 }}>
          <YearChart data={R.yearIdx} best={R.bestYear.yy} />
          <View style={{ marginTop: 4 }}>
            {R.yearIdx.map((x, i) => {
              const t = timing?.years[i];
              return (
                <View key={x.yy} style={[s.yrow, i ? s.line : null]}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: x.yy === R.bestYear.yy ? colors.love : colors.ink }}>{x.yy}년 · {x.v}{t ? ` · ${t.title}` : ''}</Text>
                  {t ? <Text style={[txt.small, { marginTop: 2 }]}>{t.text}</Text> : <Text style={[txt.small, { marginTop: 2 }]}>{x.why.join(' · ')}</Text>}
                </View>
              );
            })}
          </View>
        </Card>
        {R.daeLove.length ? (
          <Card style={{ marginTop: 10, paddingVertical: 4, paddingHorizontal: 16 }}>
            {R.daeLove.map((d, i) => (
              <View key={d.age} style={[s.lrow, i ? s.line : null]}>
                <IconBox icon="heartBox" />
                <View style={{ flex: 1 }}>
                  <Text style={txt.h3}>{d.age}~{d.age + 9}세 · {pText(d.p)} 대운</Text>
                  {timing?.periods[i] ? <Text style={txt.small}>{timing.periods[i]}</Text> : <Text style={txt.small}>배우자의 별이 들어오는 10년</Text>}
                </View>
              </View>
            ))}
          </Card>
        ) : null}
        <Text style={[txt.caption, { marginTop: 14, marginBottom: 8 }]}>앞으로 1년 중 연애운이 강한 달</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {R.months.map(x => (
            <View key={`${x.y}-${x.m}`} style={s.month}><Text style={txt.caption}>{x.y}년</Text><Text style={{ fontFamily: fonts.serif, fontSize: 20, fontWeight: '600', color: colors.love }}>{x.m}월</Text></View>
          ))}
        </View>
        {timing ? <Card style={{ marginTop: 10 }}>{timing.months.map((t, i) => <Bullet key={i} color={colors.love}>{t}</Bullet>)}</Card> : null}

        <SubHead title="07 · 어디서, 어떻게 만날까요?" />
        <Card>{timing ? <><Text style={txt.h3}>인연이 들어오는 길</Text><Para>{timing.meet.text}</Para></> : pending(3)}</Card>
        {timing ? <View style={{ gap: 10, marginTop: 10 }}>{timing.meet.places.map((x, i) => <Card key={i}><Text style={txt.h3}>{x.title}</Text><Para>{x.text}</Para></Card>)}</View> : null}

        <SubHead title="08 · 결혼 생활 미리보기" />
        <Card>
          {mine ? (
            <>
              <Text style={txt.h3}>{mine.married.title}</Text>
              <Para>{mine.married.text}</Para>
              <Text style={[s.label, { marginTop: 14 }]}>다투기 쉬운 지점과 푸는 법</Text>
              <Para mt={4}>{mine.conflict}</Para>
            </>
          ) : pending(5)}
        </Card>

        <SubHead title="09 · 내가 놓치기 쉬운 것" caption="좋은 인연을 붙잡으려면" />
        <Card style={{ gap: 10 }}>{mine ? mine.blind.map(t => <SignRow key={t} care>{t}</SignRow>) : pending(3)}</Card>

        <SubHead title="10 · 인연을 끌어오는 법" />
        <Card>{timing ? timing.advice.map(a => <Bullet key={a}>{a}</Bullet>) : pending(3)}</Card>
        <Tip title="기억해 두세요">{timing?.closing ?? '운세는 흐름을 참고하는 콘텐츠예요. 좋은 인연은 결국 내가 알아보는 눈에서 시작돼요.'}</Tip>
    </>
  );
}

// Figma 운픽_22 아이콘 — 01은 하늘색 선 아이콘, 02·05는 입체 그림(제목 옆 20 · 흰 네모 31 안)
const ICONS = {
  user: require('../../../assets/figma/saju/user.svg'),
  heart: require('../../../assets/figma/spouse/love3d.webp'),
  money: require('../../../assets/figma/spouse/money3d.webp'),
  work: require('../../../assets/figma/spouse/work3d.webp'),
  star: require('../../../assets/figma/spouse/star3d.webp'),
  users: require('../../../assets/figma/spouse/users3d.webp'),
  heartBox: require('../../../assets/figma/spouse/love3d.webp'),
};
type IconName = keyof typeof ICONS;
// 흰 네모 안 그림 크기 (Figma: 별·커플 17 · 하트 20, 나머지 20)
const INNER: Partial<Record<IconName, number>> = { star: 17, users: 17 };
const INK = isDark ? colors.ink : '#000000';
const TIGHT = Platform.OS === 'android' ? { includeFontPadding: false } : {};
const GOLD = '#FFE54A';
// 06 꺾은선 — Figma 빨강 · 연분홍
const RED = isDark ? colors.love : '#E5363B';
const PINK = isDark ? colors.loveBg : '#FDE5E9';

/** 흰 바탕 둥근 네모 + 아이콘 (회색 카드 위) */
function IconBox({ icon, size = 31 }: { icon: IconName; size?: number }) {
  const inner = INNER[icon] ?? 20;
  return (
    <View style={[s.iconBox, { width: size, height: size }]}>
      <Image source={ICONS[icon]} style={{ width: inner, height: inner }} contentFit="contain" accessible={false} />
    </View>
  );
}

// 흰 칸 124 높이 안 위치 (Figma 297×135 그림을 칸 기준으로 옮긴 값)
const CH = { h: 124, pad: 12, top: 30, bottom: 71, base: 99, year: 110, grid: [22, 59, 78] };

/** 06 · 앞으로 6년 인연 지수 — 흰 칸 위 빨간 꺾은선, 가장 높은 해는 말풍선 + 분홍 알약 */
function YearChart({ data, best }: { data: { yy: number; v: number }[]; best: number }) {
  const [w, setW] = React.useState(295);
  const col = (w - CH.pad * 2) / data.length;
  const vs = data.map(d => d.v);
  const lo = Math.min(...vs);
  const hi = Math.max(...vs);
  const pts = data.map((d, i) => ({
    x: CH.pad + col * (i + 0.5),
    y: hi === lo ? (CH.top + CH.bottom) / 2 : CH.bottom - ((d.v - lo) / (hi - lo)) * (CH.bottom - CH.top),
  }));
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = pts.length ? `${line} L${pts[pts.length - 1].x.toFixed(1)} ${CH.base} L${pts[0].x.toFixed(1)} ${CH.base} Z` : '';
  return (
    <View style={s.chart} onLayout={(e) => setW(e.nativeEvent.layout.width)} accessibilityLabel={data.map(d => `${d.yy}년 ${d.v}`).join(', ')}>
      <Svg width={w} height={CH.h} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgGradient id="spouseArea" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={RED} stopOpacity={0.14} />
            <Stop offset="1" stopColor={RED} stopOpacity={0} />
          </SvgGradient>
        </Defs>
        {CH.grid.map(y => <Line key={y} x1={CH.pad} x2={w - CH.pad} y1={y} y2={y} stroke={colors.line} strokeWidth={0.5} strokeDasharray="2 2" />)}
        <Line x1={CH.pad} x2={w - CH.pad} y1={CH.base} y2={CH.base} stroke={colors.line} strokeWidth={1} />
        <Path d={area} fill="url(#spouseArea)" />
        <Path d={line} stroke={RED} strokeWidth={1.3} fill="none" strokeLinejoin="round" />
        {pts.map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r={3.2} fill={colors.surface} stroke={RED} strokeWidth={1.3} />)}
      </Svg>
      {data.map((d, i) => {
        const top = d.yy === best;
        const p = pts[i];
        return (
          <React.Fragment key={d.yy}>
            {top ? (
              <View style={[s.bubble, { left: p.x - 20, top: p.y - 22 }]}>
                <View style={s.bubbleBody}><Text style={s.bubbleText}>{d.v}</Text></View>
                <View style={s.bubbleTail} />
              </View>
            ) : <Text style={[s.chartVal, { left: p.x - 20, top: p.y - 19 }]}>{d.v}</Text>}
            <View style={[s.yearPill, { left: p.x - 18, top: CH.year - 7.5 }, top && { backgroundColor: PINK }]}>
              <Text style={[s.yearText, top && { color: RED, ...sansW('700') }]}>{String(d.yy).slice(2)}년</Text>
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
}

function Heading({ icon, mt = 0, children }: { icon: IconName; mt?: number; children: string }) {
  return (
    <View style={[s.heading, { marginTop: mt }]}>
      <Image source={ICONS[icon]} style={{ width: 20, height: 20 }} contentFit="contain" accessible={false} />
      <Text style={s.headingText} accessibilityRole="header">{children}</Text>
    </View>
  );
}

/** 흰 동그라미 안 반짝이 + 한 줄 — 알아보는 신호(하늘색 20), 놓치기 쉬운 것(빨강 22) */
function SignRow({ care, children }: { care?: boolean; children: string }) {
  const size = care ? 22 : 20;
  return (
    <View style={s.sign}>
      <View style={[s.signMark, { width: size, height: size, borderRadius: size / 2, marginTop: (22 - size) / 2 }]}>
        <Image source={care ? require('../../../assets/figma/spouse/sparkle-red.svg') : require('../../../assets/figma/spouse/sparkle-blue.svg')} style={{ width: size, height: size }} contentFit="contain" accessible={false} />
      </View>
      <Text style={s.signText}>{children}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  // 카드 327×168 · 로고 12 · 한 줄 44 · 제목 70 · 칩 130 (폭에 맞춰 비율대로 커지고, 글이 길어지면 아래로 늘어도 그림은 카드를 꽉 채운 채 오른쪽 아래에 붙는다)
  hero: { marginTop: 12, borderRadius: 12, backgroundColor: '#122041', overflow: 'hidden', paddingHorizontal: 16, paddingTop: 11, paddingBottom: 19 },
  heroArt: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  heroTop: { height: 19, flexDirection: 'row', alignItems: 'flex-start' },
  eyebrow: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: '#DDDDDD', marginTop: 14, ...TIGHT },
  headline: { ...sansW('700'), fontSize: 20, lineHeight: 24, letterSpacing: -1, color: colors.white, marginTop: 8, maxWidth: 210, ...TIGHT },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, paddingLeft: 2 },
  chip: { borderWidth: 0.5, borderColor: colors.white, borderRadius: 5, paddingHorizontal: 4, paddingVertical: 2 },
  chipText: { ...sansW('600'), fontSize: 12, lineHeight: 14, color: colors.white, opacity: 0.8, ...TIGHT },
  // 회색 줄 327×45 · 좌우 20 · 이름표와 숫자 사이 8
  stats: { marginTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.card },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statLabel: { ...sansW('500'), fontSize: 12, lineHeight: 18, letterSpacing: -0.6, color: INK, ...TIGHT },
  statNum: { ...sansW('700'), fontSize: 24, lineHeight: 29, letterSpacing: -1.2, color: colors.accent, ...TIGHT },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  // Figma Ticker3 — 흰 바탕 · 4/8 여백 · 12 SemiBold 80%
  job: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 30, backgroundColor: colors.surface },
  jobText: { ...sansW('600'), fontSize: 12, lineHeight: 14, letterSpacing: 0, color: INK, opacity: 0.8, ...TIGHT },
  iconBox: { borderRadius: 6, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headingText: { ...sansW('600'), fontSize: 16, lineHeight: 20, letterSpacing: -0.8, color: INK, flexShrink: 1, ...TIGHT },
  sign: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  signMark: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  signText: { flex: 1, fontSize: 14, lineHeight: 22, color: colors.ink },
  grid: { flexDirection: 'row', gap: 12 },
  cell: { flex: 1, alignItems: 'center', gap: 4 },
  big: { fontFamily: fonts.serif, fontSize: 18, fontWeight: '600', color: colors.purple, textAlign: 'center' },
  avoid: { marginTop: 14, padding: 12, borderRadius: radius.md, backgroundColor: colors.cream },
  lrow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13 },
  line: { borderTopWidth: 1, borderTopColor: colors.line },
  // 꺾은선 흰 칸 — 카드 안 위 13 · 높이 124 · 반경 12
  chart: { height: CH.h, borderRadius: 12, backgroundColor: colors.surface, overflow: 'hidden' },
  chartVal: { position: 'absolute', width: 40, textAlign: 'center', ...sansW('600'), fontSize: 11, lineHeight: 13, color: INK, opacity: 0.8, ...TIGHT },
  bubble: { position: 'absolute', width: 40, alignItems: 'center' },
  bubbleBody: { minWidth: 27, height: 14, paddingHorizontal: 5, borderRadius: 7, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' },
  bubbleText: { ...sansW('700'), fontSize: 10, lineHeight: 12, color: colors.white, ...TIGHT },
  bubbleTail: { width: 0, height: 0, borderLeftWidth: 3, borderRightWidth: 3, borderTopWidth: 3, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: RED },
  yearPill: { position: 'absolute', width: 36, height: 15, borderRadius: 7.5, alignItems: 'center', justifyContent: 'center' },
  yearText: { ...sansW('500'), fontSize: 11, lineHeight: 13, color: colors.inkMute, ...TIGHT },
  month: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: radius.lg, backgroundColor: colors.loveBg },
  label: { fontSize: 12, fontWeight: '700', color: colors.inkSub },
  yrow: { paddingVertical: 10 },
});
