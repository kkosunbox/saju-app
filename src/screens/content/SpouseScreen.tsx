import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Disclaimer from '../../components/Disclaimer';
import { ActRow, BodyState, Bullet, DarkChip, HeadRow, Hero, LockGate, Para, Pill, Seal, SubHead, Tip, heroTxt } from '../../components/premium/Kit';
import { PartPending, ReadingBanner } from '../../components/premium/Reading';
import { ReadingView, SpouseReading } from '../../types/reading';
import { useApp } from '../../context/AppContext';
import { ITEMS } from '../../services/premium/catalog';
import { pText } from '../../services/premium/helpers';
import { SpousePreview, SpouseReport } from '../../types/premium';
import { usePremiumContent, usePremiumPreview, useReading } from '../../services/server/premiumApi';
import { ELEMENT_INFO } from '../../data/sajuData';
import { MBTI_INFO } from '../../data/mbtiData';
import { colors } from '../../theme/colors';
import { fonts, radius, txt } from '../../theme/typography';
import ShareCta, { ShareIconButton } from '../../components/ShareCta';
import { spouseSpec } from '../../services/share/shareSpecs';
import FriendCompare from '../../components/FriendCompare';
import LoadingScreen from '../../components/LoadingScreen';

/** 프리미엄: 미래 배우자 리포트 — 첫 화면은 무료로 보여주고 나머지는 잠금 */
export default function SpouseScreen() {
  const { user: u } = useApp();
  const content = usePremiumContent<SpouseReport>({ kind: 'spouse' });
  const { reading, retry } = useReading<SpouseReading>(content);
  const preview = usePremiumPreview<SpousePreview>({ kind: 'spouse' }, !content.open);
  if (!u) return null;
  const item = ITEMS.spouse();
  const R = content.data?.data;
  // 첫 화면(무료): 열람했으면 본문에서, 아니면 미리보기에서
  const sum: SpousePreview | undefined = R
    ? { spouseEl: R.spouseEl, headline: R.headline, mbti: R.mbti[0], animal: R.animals[0], ageGap: R.ageGap, thisYear: R.yearIdx[0].v, bestYear: R.bestYear.yy }
    : preview.data;
  if (!sum) return <LoadingScreen />;
  const el = ELEMENT_INFO[sum.spouseEl];
  const spec = spouseSpec(u, sum);

  return (
    <Screen title="미래 배우자 리포트" back right={<ShareIconButton item={item} spec={spec} />}>
      <FriendCompare route="Spouse" spec={spec} />
      <HeadRow item={item} caption={`배우자의 별 · ${el.ko}(${el.hanja})`} />
      <Hero style={{ alignItems: 'center', paddingVertical: 26 }}>
        <Text style={heroTxt.eyebrow}>{u.nickname}님의 미래 배우자는</Text>
        <Text style={[heroTxt.summ, { fontSize: 22, lineHeight: 30, textAlign: 'center', marginTop: 8 }]}>{sum.headline}</Text>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 16 }}>
          <DarkChip gold>{sum.mbti}</DarkChip>
          <DarkChip>{sum.animal}띠</DarkChip>
          <DarkChip>{sum.ageGap}</DarkChip>
        </View>
        <View style={s.heroLine} />
        <View style={{ flexDirection: 'row', gap: 28 }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={s.heroNum}>{sum.thisYear}</Text>
            <Text style={heroTxt.eyebrow}>올해 인연 지수</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={s.heroNum}>{sum.bestYear}</Text>
            <Text style={heroTxt.eyebrow}>인연이 가장 강한 해</Text>
          </View>
        </View>
      </Hero>

      {!content.open ? <LockGate item={item} />
        : R ? <SpouseBody R={R} reading={reading} onRetry={retry} />
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Seal ch={R.persona.hanja} size={44} />
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
              <Text style={txt.h3}>緣 사랑을 표현하는 방식</Text>
              <Para>{portrait.love}</Para>
              <Text style={[txt.h3, { marginTop: 16 }]}>財 돈을 대하는 방식</Text>
              <Para>{portrait.money}</Para>
              <Text style={[txt.h3, { marginTop: 16 }]}>業 일하는 모습</Text>
              <Para>{portrait.work}</Para>
            </>
          ) : pending(6)}
          <Text style={[txt.caption, { marginTop: 16 }]}>이런 일을 하고 있을 가능성이 커요</Text>
          <View style={s.wrap}>{R.jobs.map(j => <Pill key={j}>{j}</Pill>)}</View>
        </Card>

        <SubHead title="03 · 이런 신호가 보이면 그 사람이에요" caption="처음 만났을 때 알아보는 법" />
        <Card style={{ gap: 10 }}>{portrait ? portrait.signs.map(t => <ActRow key={t} icon="sparkle">{t}</ActRow>) : pending(5)}</Card>

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
        <Card style={{ paddingVertical: 4, paddingHorizontal: 18 }}>
          <View style={s.lrow}>
            <Seal ch="星" />
            <View style={{ flex: 1 }}><Text style={txt.h3}>배우자의 별</Text>{mine ? <Text style={[txt.small, { marginTop: 2 }]}>{mine.star}</Text> : pending(2)}</View>
          </View>
          <View style={[s.lrow, s.line]}>
            <Seal ch={R.seatNote[0]} />
            <View style={{ flex: 1 }}><Text style={txt.h3}>배우자 자리 · {R.stage[0]}</Text>{mine ? <Text style={[txt.small, { marginTop: 2 }]}>{mine.seat}</Text> : pending(2)}</View>
          </View>
        </Card>

        <SubHead title="06 · 언제 만날까요?" caption="앞으로 6년 인연 지수" />
        <Card style={{ paddingTop: 20 }}>
          <View style={s.bars}>
            {R.yearIdx.map(x => {
              const top = x.yy === R.bestYear.yy;
              return (
                <View key={x.yy} style={s.barCol}>
                  <Text style={[s.barVal, top && { color: colors.love }]}>{x.v}</Text>
                  <View style={[s.bar, { height: Math.max(10, (x.v - 38) * 1.7), backgroundColor: top ? colors.love : colors.loveBg }]} />
                  <Text style={txt.caption}>{String(x.yy).slice(2)}년</Text>
                </View>
              );
            })}
          </View>
          <View style={{ marginTop: 14 }}>
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
          <Card style={{ marginTop: 10, paddingVertical: 4, paddingHorizontal: 18 }}>
            {R.daeLove.map((d, i) => (
              <View key={d.age} style={[s.lrow, i ? s.line : null]}>
                <Seal ch="緣" />
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
        <Card style={{ gap: 10 }}>{mine ? mine.blind.map(t => <ActRow key={t} ok={false}>{t}</ActRow>) : pending(3)}</Card>

        <SubHead title="10 · 인연을 끌어오는 법" />
        <Card>{timing ? timing.advice.map(a => <Bullet key={a}>{a}</Bullet>) : pending(3)}</Card>
        <Tip title="기억해 두세요">{timing?.closing ?? '운세는 흐름을 참고하는 콘텐츠예요. 좋은 인연은 결국 내가 알아보는 눈에서 시작돼요.'}</Tip>
    </>
  );
}

const s = StyleSheet.create({
  heroLine: { alignSelf: 'stretch', height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 18 },
  heroNum: { fontFamily: fonts.serif, fontSize: 26, fontWeight: '600', color: colors.moon },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  grid: { flexDirection: 'row', gap: 12 },
  cell: { flex: 1, alignItems: 'center', gap: 4 },
  big: { fontFamily: fonts.serif, fontSize: 18, fontWeight: '600', color: colors.purple, textAlign: 'center' },
  avoid: { marginTop: 14, padding: 12, borderRadius: radius.md, backgroundColor: colors.cream },
  lrow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  line: { borderTopWidth: 1, borderTopColor: colors.line },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 130 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  barVal: { fontFamily: fonts.serif, fontSize: 13, fontWeight: '600', color: colors.inkMute },
  bar: { width: '60%', borderRadius: 6 },
  month: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: radius.lg, backgroundColor: colors.loveBg },
  label: { fontSize: 12, fontWeight: '700', color: colors.inkSub },
  yrow: { paddingVertical: 10 },
});
