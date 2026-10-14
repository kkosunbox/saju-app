import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Disclaimer from '../../components/Disclaimer';
import { ActRow, Bullet, DarkChip, HeadRow, Hero, LockGate, Para, Pill, Seal, SubHead, Tip, ViewsCard, heroTxt } from '../../components/premium/Kit';
import { useApp } from '../../context/AppContext';
import { ITEMS } from '../../services/premium/catalog';
import { spouseReport } from '../../services/content/premiumContent';
import { pText } from '../../services/premium/engine';
import { ELEMENT_INFO } from '../../data/sajuData';
import { MBTI_INFO } from '../../data/mbtiData';
import { colors } from '../../theme/colors';
import { fonts, radius, txt } from '../../theme/typography';
import ShareCta, { ShareIconButton } from '../../components/ShareCta';
import { spouseSpec } from '../../services/share/shareSpecs';
import FriendCompare from '../../components/FriendCompare';

/** 프리미엄: 미래 배우자 리포트 — 첫 화면은 무료로 보여주고 나머지는 잠금 */
export default function SpouseScreen() {
  const { user: u, today } = useApp();
  if (!u) return null;
  const item = ITEMS.spouse();
  const R = spouseReport(u, today);
  const el = ELEMENT_INFO[R.spouseEl];
  const thisYear = R.yearIdx[0];

  return (
    <Screen title="미래 배우자 리포트" back right={<ShareIconButton item={item} spec={spouseSpec(u, today)} />}>
      <FriendCompare route="Spouse" spec={spouseSpec(u, today)} />
      <HeadRow item={item} caption={`배우자의 별 · ${el.ko}(${el.hanja})`} />
      <Hero style={{ alignItems: 'center', paddingVertical: 26 }}>
        <Text style={heroTxt.eyebrow}>{u.nickname}님의 미래 배우자는</Text>
        <Text style={[heroTxt.summ, { fontSize: 22, lineHeight: 30, textAlign: 'center', marginTop: 8 }]}>{R.headline}</Text>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 16 }}>
          <DarkChip gold>{R.mbti[0]}</DarkChip>
          <DarkChip>{R.animals[0]}띠</DarkChip>
          <DarkChip>{R.ageGap}</DarkChip>
        </View>
        <View style={s.heroLine} />
        <View style={{ flexDirection: 'row', gap: 28 }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={s.heroNum}>{thisYear.v}</Text>
            <Text style={heroTxt.eyebrow}>올해 인연 지수</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={s.heroNum}>{R.bestYear.yy}</Text>
            <Text style={heroTxt.eyebrow}>인연이 가장 강한 해</Text>
          </View>
        </View>
      </Hero>

      <LockGate item={item}>
        <SubHead title="01 · 그 사람은 이런 사람" caption={`${el.ko}(${el.hanja})의 기운 · ${R.persona.img}`} />
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Seal ch={R.persona.hanja} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={txt.h3}>{R.persona.core}</Text>
              <Text style={txt.small}>{R.look}</Text>
            </View>
          </View>
          <View style={{ marginTop: 12 }}>{R.persona.str.map(p => <Bullet key={p}>{p}</Bullet>)}</View>
          <Text style={[txt.small, { marginTop: 8 }]}>이런 면은 이해해 주세요 · {R.persona.watch}</Text>
        </Card>

        <SubHead title="02 · 사랑하는 방식과 경제관" />
        <Card>
          <Text style={txt.h3}>緣 사랑을 표현하는 방식</Text>
          <Para>{R.loveStyle}</Para>
          <Text style={[txt.h3, { marginTop: 16 }]}>財 돈을 대하는 방식</Text>
          <Para>{R.moneyStyle}</Para>
          <Text style={[txt.caption, { marginTop: 16 }]}>이런 일을 하고 있을 가능성이 커요</Text>
          <View style={s.wrap}>{R.jobs.map(j => <Pill key={j}>{j}</Pill>)}</View>
        </Card>

        <SubHead title="03 · 이런 신호가 보이면 그 사람이에요" caption="처음 만났을 때 알아보는 법" />
        <Card style={{ gap: 10 }}>{R.signs.map(t => <ActRow key={t} icon="sparkle">{t}</ActRow>)}</Card>

        <SubHead title="04 · 찰떡 조건" caption="MBTI · 띠 · 나이" />
        <View style={s.grid}>
          <Card style={s.cell}><Text style={txt.caption}>MBTI</Text><Text style={s.big}>{R.mbti.join(' · ')}</Text><Text style={txt.caption}>{MBTI_INFO[R.mbti[0] as keyof typeof MBTI_INFO]?.nickname}</Text></Card>
          <Card style={s.cell}><Text style={txt.caption}>잘 맞는 띠</Text><Text style={s.big}>{R.animals.join(' · ')}</Text><Text style={txt.caption}>합을 이루는 띠</Text></Card>
        </View>
        <Card style={{ marginTop: 10 }}>
          <Text style={txt.h3}>{R.ageGap} 상대</Text>
          <Para>{R.ageWhy}</Para>
          <Para mt={8}>{R.mbti[0]}와는 {R.mbtiWhy}.</Para>
          <View style={s.avoid}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.ink }}>조금 더 노력이 필요한 상대</Text>
            <Text style={[txt.small, { marginTop: 4 }]}>{R.avoidMbti} 유형{R.avoidAnimals.length ? ` · ${R.avoidAnimals.join('·')}띠` : ''} — 나쁜 인연은 아니지만, 서로 맞춰 가는 데 시간이 더 걸려요.</Text>
          </View>
        </Card>

        <SubHead title="05 · 나의 배우자 운" caption={`배우자의 별 ${R.star.n}개${R.star.type ? ` · ${R.star.type[0]}` : ''}`} />
        <Card style={{ paddingVertical: 4, paddingHorizontal: 18 }}>
          <View style={s.lrow}>
            <Seal ch="星" />
            <View style={{ flex: 1 }}><Text style={txt.h3}>배우자의 별</Text><Text style={[txt.small, { marginTop: 2 }]}>{R.star.text}{R.star.type ? ` ${R.star.type[1]}` : ''}</Text></View>
          </View>
          <View style={[s.lrow, s.line]}>
            <Seal ch={R.seatNote[0]} />
            <View style={{ flex: 1 }}><Text style={txt.h3}>배우자 자리</Text><Text style={[txt.small, { marginTop: 2 }]}>{R.seatNote[1]}</Text></View>
          </View>
          <View style={[s.lrow, s.line]}>
            <Seal ch="家" />
            <View style={{ flex: 1 }}><Text style={txt.h3}>배우자 자리의 기운 · {R.stage[0]}</Text><Text style={[txt.small, { marginTop: 2 }]}>{R.stage[1]}</Text></View>
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
          <View style={s.bestBox}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.love }}>{R.bestYear.yy}년 · 인연이 가장 강한 해</Text>
            <Text style={[txt.small, { marginTop: 2 }]}>{R.bestYear.why.join(' · ')}</Text>
          </View>
        </Card>
        {R.daeLove.length ? (
          <Card style={{ marginTop: 10, paddingVertical: 4, paddingHorizontal: 18 }}>
            {R.daeLove.map((d, i) => (
              <View key={d.age} style={[s.lrow, i ? s.line : null]}>
                <Seal ch="緣" />
                <View style={{ flex: 1 }}><Text style={txt.h3}>{d.age}~{d.age + 9}세</Text><Text style={txt.small}>{pText(d.p)} 대운 · 배우자의 별이 들어오는 10년, {d.age < 42 ? '결혼하기 좋은 시기' : '부부의 정이 깊어지고 가정이 단단해지는 시기'}</Text></View>
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

        <SubHead title="07 · 어디서, 어떻게 만날까요?" />
        <Card>
          <Text style={txt.h3}>인연이 들어오는 길</Text>
          <Para>{R.meetWay}</Para>
          <View style={[s.wrap, { marginTop: 12 }]}>{R.places.map(p => <Pill key={p}>{p}</Pill>)}</View>
          <Text style={[txt.h3, { marginTop: 16 }]}>첫 만남</Text>
          <Para>{R.first}</Para>
        </Card>

        <SubHead title="08 · 결혼 생활 미리보기" />
        <Card>
          <Text style={txt.h3}>{R.home[0]}</Text>
          <Para>{R.home[1]}</Para>
        </Card>

        <SubHead title="09 · 내가 놓치기 쉬운 것" caption="좋은 인연을 붙잡으려면" />
        <Card style={{ gap: 10 }}>{R.blind.map(t => <ActRow key={t} ok={false}>{t}</ActRow>)}</Card>

        <SubHead title="10 · 4가지 관점으로 본 인연" />
        <ViewsCard views={R.views} />

        <SubHead title="11 · 인연을 끌어오는 법" />
        <Card>{R.advice.map(a => <Bullet key={a}>{a}</Bullet>)}</Card>
        <Tip title="기억해 두세요">운세는 흐름을 참고하는 콘텐츠예요. 좋은 인연은 결국 내가 알아보는 눈에서 시작돼요.</Tip>
      </LockGate>
      <ShareCta item={item} spec={spouseSpec(u, today)} />
      <Disclaimer compact />
    </Screen>
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
  bestBox: { marginTop: 16, padding: 12, borderRadius: radius.md, backgroundColor: colors.loveBg },
  month: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: radius.lg, backgroundColor: colors.loveBg },
});
