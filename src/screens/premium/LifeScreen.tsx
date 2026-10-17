import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@/navigation/compat';
import Svg, { Circle, Defs, Line, LinearGradient as SvgGrad, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import PressableScale from '../../components/PressableScale';
import Disclaimer from '../../components/Disclaimer';
import { BodyState, Bullet, HeadRow, Hero, LockGate, Para, SubHead, Tip, heroTxt, scoreColor } from '../../components/premium/Kit';
import { PartPending, ReadingBanner } from '../../components/premium/Reading';
import { useApp } from '../../context/AppContext';
import { ITEMS } from '../../services/premium/catalog';
import { ageNow, currentDaeun, mainStem, pText, stage12, stageKeyOfAge, strength3, tenGod, tenName } from '../../services/premium/helpers';
import { DaeunTable, LifePreview, LifeStage } from '../../types/premium';
import { Pillar } from '../../types/content';
import { LifeReading, ReadingView } from '../../types/reading';
import { usePremiumContent, usePremiumPreview, useReading } from '../../services/server/premiumApi';
import { User } from '../../types';
import { STAGE12, TG } from '../../services/premium/data';
import { BRANCHES, STEMS } from '../../data/sajuData';
import { colors } from '../../theme/colors';
import { fonts, radius, txt } from '../../theme/typography';
import ShareCta, { ShareIconButton } from '../../components/ShareCta';
import { lifeSpec } from '../../services/share/shareSpecs';

function LifeChart({ pts, now }: { pts: { a: number; v: number }[]; now: number }) {
  const W = 320, H = 150;
  const X = (a: number) => 14 + ((a - 5) / 80) * (W - 28), Y = (v: number) => 12 + (1 - (v - 60) / 40) * (H - 40);
  let path = '';
  pts.forEach((p, i) => {
    if (!i) { path = `M${X(p.a)},${Y(p.v)}`; return; }
    const q = pts[i - 1]; const cx = (X(q.a) + X(p.a)) / 2;
    path += ` C${cx},${Y(q.v)} ${cx},${Y(p.v)} ${X(p.a)},${Y(p.v)}`;
  });
  const peak = pts.reduce((a, b) => (b.v > a.v ? b : a));
  return (
    <View>
      <Svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ aspectRatio: W / H }} accessibilityLabel="인생 흐름 그래프">
        <Defs>
          <SvgGrad id="lifeg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.purpleSoft} stopOpacity={0.35} />
            <Stop offset="1" stopColor={colors.purpleSoft} stopOpacity={0} />
          </SvgGrad>
        </Defs>
        <Rect x={X(5)} y={4} width={X(30) - X(5)} height={H - 28} rx={8} fill={colors.lavenderSoft} />
        <Rect x={X(55)} y={4} width={X(85) - X(55)} height={H - 28} rx={8} fill={colors.lavenderSoft} />
        {([['초년', 17], ['중년', 42], ['말년', 70]] as const).map(([l, a]) => (
          <SvgText key={l} x={X(a)} y={18} textAnchor="middle" fill={colors.purpleSoft} fontSize={10} fontWeight="700">{l}</SvgText>
        ))}
        <Path d={`${path} L${X(85)},${H - 24} L${X(5)},${H - 24}Z`} fill="url(#lifeg)" />
        <Path d={path} fill="none" stroke={colors.purpleSoft} strokeWidth={2.5} strokeLinecap="round" />
        {now >= 5 && now <= 85 ? (
          <>
            <Line x1={X(now)} x2={X(now)} y1={8} y2={H - 24} stroke={colors.seal} strokeWidth={1.5} strokeDasharray="3 3" />
            <Rect x={X(now) - 15} y={H - 22} width={30} height={15} rx={4} fill={colors.seal} />
            <SvgText x={X(now)} y={H - 11} textAnchor="middle" fill="#fff" fontSize={9} fontWeight="700">지금</SvgText>
          </>
        ) : null}
        <Circle cx={X(peak.a)} cy={Y(peak.v)} r={5} fill="#D9B872" stroke={colors.purpleSoft} strokeWidth={2} />
        {[10, 20, 30, 40, 50, 60, 70, 80].map(a => <SvgText key={a} x={X(a)} y={H - 2} textAnchor="middle" fill={colors.inkMute} fontSize={9}>{a}</SvgText>)}
      </Svg>
      <Text style={[txt.small, { marginTop: 8, textAlign: 'center' }]}>노란 점이 흐름이 가장 높게 오르는 구간({peak.a - 5}~{peak.a + 4}세)이에요</Text>
    </View>
  );
}

interface LifeData { stages: LifeStage[]; daeun: DaeunTable; chart: { a: number; v: number }[]; seun: SeunYear[] }

export default function LifeScreen() {
  const { user: u, today } = useApp();
  const content = usePremiumContent<LifeData>({ kind: 'life' });
  const { reading, retry } = useReading<LifeReading>(content);
  const preview = usePremiumPreview<LifePreview>({ kind: 'life' }, !content.open);
  if (!u?.natal) return null;
  const item = ITEMS.life();
  const L = content.data?.data; const F = content.data?.F;
  const now = ageNow(u, today);
  const chart = L?.chart ?? preview.data?.chart;
  const strength = F ? F.strength : preview.data ? strength3(preview.data.strength) : null;
  const spec = L ? lifeSpec(u, L.stages, L.daeun, now) : null;

  return (
    <Screen title="평생운" back right={<ShareIconButton item={item} spec={spec} />}>
      <HeadRow item={item} caption={`만 ${now}세 · ${pText(u.natal.chart.day)}일주${strength ? ' · ' + strength : ''}`} />
      <Text style={[txt.title, { marginTop: 10 }]}>{u.nickname}님의{'\n'}인생 지도</Text>
      <Card style={{ marginTop: 20, paddingVertical: 16, paddingHorizontal: 14 }}>
        {chart ? <LifeChart pts={chart} now={now} /> : <BodyState error={preview.isError} />}
      </Card>
      {!content.open ? <LockGate item={item} />
        : L && F ? <LifeBody u={u} L={L} reading={reading} onRetry={retry} />
        : <BodyState error={content.isError} onRetry={() => content.refetch()} />}
      <ShareCta item={item} spec={spec} />
      <Disclaimer compact />
    </Screen>
  );
}

/** 점수·나이·간지는 서버 계산값, 글은 AI 풀이 */
function LifeBody({ u, L, reading, onRetry }: { u: User; L: LifeData; reading: ReadingView<LifeReading> | null; onRetry(): void }) {
  const nav = useNavigation();
  const { today } = useApp();
  const now = ageNow(u, today);
  const dae = L.daeun;
  const curD = currentDaeun(dae.list, now); const cy = Number(today.slice(0, 4));
  // 황금기·숨 고르기는 지금부터 남은 대운에서 (서버 풀이와 같은 기준)
  const ahead = dae.list.filter(d => d.age + 9 >= now);
  const sorted = [...(ahead.length >= 2 ? ahead : dae.list)].sort((a, b) => b.score - a.score);
  const gold = sorted.slice(0, 2).sort((a, b) => a.age - b.age), rest = sorted[sorted.length - 1];
  const curKey = stageKeyOfAge(now);
  const nextD = curD ? dae.list[dae.list.indexOf(curD) + 1] : undefined;
  const writing = reading?.status === 'writing';
  const { overview, daeun, years } = reading?.parts ?? {};

  return (
    <>
      <ReadingBanner reading={reading} onRetry={onRetry} />
      <Hero>
        <Text style={heroTxt.eyebrow}>인생의 곡선</Text>
        {overview ? (
          <>
            <Text style={[heroTxt.summ, { fontSize: 20 }]}>{overview.headline}</Text>
            <Text style={[heroTxt.body, s.heroBody]}>{overview.summary}</Text>
          </>
        ) : <View style={{ marginTop: 6, opacity: 0.6 }}><PartPending writing={writing} lines={4} /></View>}
      </Hero>

      <SubHead title="01 · 초년 · 중년 · 말년" caption="시기마다 맡는 기둥과 그 흐름" />
      <View style={{ gap: 14 }}>
        {L.stages.map((x, i) => {
          const cur = x.key === curKey;
          const t = overview?.stages[i];
          const color = cur ? colors.white : colors.purple;
          return (
            <Card key={x.key} style={{ padding: 0, overflow: 'hidden' }}>
              <View style={[s.stageHead, { backgroundColor: cur ? colors.heroBg : colors.lavenderSoft }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', opacity: 0.8, color }}>{x.label} · {x.range}{cur ? ' · 지금' : ''}</Text>
                  <Text style={{ fontSize: 18, fontWeight: '800', marginTop: 2, color }}>{t?.title ?? x.headline}</Text>
                </View>
                <Text style={{ fontSize: 26, fontWeight: '800', color }}>{x.score}</Text>
              </View>
              <View style={{ paddingVertical: 16, paddingHorizontal: 18 }}>
                {t ? (
                  <>
                    <Para mt={0}>{t.text}</Para>
                    <Tip title="이 시기를 잘 보내는 법" style={{ marginTop: 12 }}>{t.advice}</Tip>
                  </>
                ) : writing ? <PartPending writing lines={3} /> : <Para mt={0}>{x.desc}</Para>}
              </View>
            </Card>
          );
        })}
      </View>

      <SubHead title="02 · 앞으로의 황금기" caption="남은 대운 중 흐름이 가장 높은 구간" />
      <View style={s.grid2}>
        {gold.map(d => (
          <View key={d.age} style={s.goldCard}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.money }}>吉 황금기</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', marginTop: 4, color: colors.ink }}>{d.age}~{d.age + 9}세</Text>
            <Text style={[txt.small, { marginTop: 2 }]}>{pText(d.p)} · {tenName(d.rel)} · {d.score}점</Text>
          </View>
        ))}
      </View>
      {overview ? (
        <Card style={{ marginTop: 10 }}>
          <Text style={txt.h3}>{overview.golden.title}</Text>
          <Para>{overview.golden.text}</Para>
        </Card>
      ) : writing ? <Card style={{ marginTop: 10 }}><PartPending writing lines={3} /></Card> : null}
      <Card style={{ marginTop: 10 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.thai }}>愼 숨 고르기 구간 · {rest.age}~{rest.age + 9}세 · {pText(rest.p)}</Text>
        {overview ? (
          <>
            <Text style={[txt.h3, { marginTop: 6 }]}>{overview.rest.title}</Text>
            <Para>{overview.rest.text}</Para>
          </>
        ) : <PartPending writing={writing} lines={2} />}
      </Card>

      <SubHead title="03 · 10년 대운 전체" caption={`${dae.fwd ? '순행' : '역행'} · ${dae.start}세 시작 · ${dae.list.length}개 대운`} />
      <View style={{ gap: 10 }}>
        {dae.list.map((d, i) => {
          const cur = !!curD && d.age === curD.age;
          const t = daeun?.periods[i];
          return (
            <Card key={d.age} style={cur ? { borderWidth: 1.5, borderColor: colors.purpleSoft } : null}>
              <View style={s.between}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <View style={s.dp}><Text style={{ fontFamily: fonts.serif, fontSize: 16, color: colors.purple, fontWeight: '600' }}>{STEMS[d.p.stem].hanja}{BRANCHES[d.p.branch].hanja}</Text></View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>{d.age}~{d.age + 9}세</Text>
                      {cur ? <View style={s.nowTag}><Text style={s.nowText}>지금</Text></View> : null}
                    </View>
                    <Text style={txt.caption}>{cy - now + d.age}~{cy - now + d.age + 9}년 · {TG[tenGod(u.natal!.chart.day.stem, d.p.stem)]} / {TG[tenGod(u.natal!.chart.day.stem, mainStem(d.p.branch))]} · {STAGE12[stage12(u.natal!.chart.day.stem, d.p.branch)]}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 18, fontWeight: '800', color: scoreColor(d.score) }}>{d.score}</Text>
              </View>
              {t ? (
                <>
                  <Text style={[txt.h3, { marginTop: 10 }]}>{t.title}</Text>
                  <Para>{t.text}</Para>
                </>
              ) : <PartPending writing={writing} lines={2} />}
            </Card>
          );
        })}
      </View>

      {curD ? (
        <>
          <SubHead title="04 · 지금의 대운" caption={`${curD.age}~${curD.age + 9}세 · ${pText(curD.p)} · ${now - curD.age + 1}년째 / 10년`} />
          <Hero style={{ marginTop: 0 }}>
            {daeun?.now ? (
              <>
                <Text style={[heroTxt.body, { fontSize: 14.5, lineHeight: 23 }]}>{daeun.now.text}</Text>
                <View style={{ marginTop: 12, gap: 6 }}>
                  {daeun.now.focus.map((t, i) => <Text key={i} style={s.focus}>{i + 1}. {t}</Text>)}
                </View>
              </>
            ) : <View style={{ opacity: 0.6 }}><PartPending writing={writing} lines={4} /></View>}
            {nextD ? <Text style={{ fontSize: 13, color: colors.moon, marginTop: 12 }}>다음 대운 {nextD.age}세부터 · {pText(nextD.p)} · {nextD.score}점</Text> : null}
          </Hero>
        </>
      ) : null}

      <SubHead title="05 · 앞으로 10년" caption="해마다 들어오는 기운 (세운)" />
      <Card style={{ paddingVertical: 2, paddingHorizontal: 16 }}>
        {L.seun.map((x, i) => {
          const t = years?.years[i];
          return (
            <PressableScale key={x.year} disabled={i >= 2} onPress={() => nav.navigate('NewYear', { year: x.year })} style={[s.drow, i ? s.topLine : null]} scaleTo={0.98}>
              <View style={s.dd}><Text style={{ fontFamily: fonts.serif, fontSize: 14, fontWeight: '600', color: colors.ink }}>{x.year}</Text><Text style={{ fontSize: 11, color: colors.inkMute }}>{x.age}세</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.ink }}>{t?.title ?? `${pText(x.pillar)} · ${x.group}`}</Text>
                <Text style={txt.caption}>{pText(x.pillar)} · {x.group} · {x.animal}의 해</Text>
                {t ? <Text style={[txt.small, { marginTop: 4 }]}>{t.text}</Text> : null}
              </View>
              <Text style={{ fontWeight: '700', color: scoreColor(x.score) }}>{x.score}</Text>
            </PressableScale>
          );
        })}
      </Card>
      {!years && writing ? <PartPending writing lines={2} /> : null}

      <SubHead title="06 · 평생 조언" />
      {overview ? (
        <>
          <Card>{overview.lifeAdvice.map((t, i) => <Bullet key={i}>{t}</Bullet>)}</Card>
          <Tip title="마지막 한마디">{overview.closing}</Tip>
        </>
      ) : <Card><PartPending writing={writing} lines={3} /></Card>}
      <Text style={[txt.caption, { textAlign: 'center', marginTop: 16 }]}>인생의 흐름을 참고하는 콘텐츠이며 미래를 단정하지 않아요.</Text>
    </>
  );
}

interface SeunYear { year: number; age: number; pillar: Pillar; group: string; animal: string; score: number }

const s = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  stageHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 18 },
  fgrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  fcell: { width: '48%', flexGrow: 1, backgroundColor: colors.cream, borderRadius: radius.sm, paddingVertical: 10, paddingHorizontal: 12, gap: 3 },
  topLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
  grid2: { flexDirection: 'row', gap: 12 },
  goldCard: { flex: 1, padding: 16, backgroundColor: colors.moneyBg, borderRadius: radius.lg },
  dp: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.lavenderSoft, alignItems: 'center', justifyContent: 'center' },
  nowTag: { backgroundColor: colors.seal, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  nowText: { color: colors.white, fontSize: 10.5, fontWeight: '700' },
  drow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  dd: { width: 40, alignItems: 'center' },
  heroBody: { fontSize: 14.5, lineHeight: 23, marginTop: 10 },
  focus: { fontSize: 14, lineHeight: 21, color: 'rgba(255,255,255,0.92)' },
});
