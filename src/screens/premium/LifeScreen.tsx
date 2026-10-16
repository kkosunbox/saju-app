import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@/navigation/compat';
import Svg, { Circle, Defs, Line, LinearGradient as SvgGrad, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import PressableScale from '../../components/PressableScale';
import Disclaimer from '../../components/Disclaimer';
import { BodyState, Bullet, HeadRow, Hero, LockGate, Para, SubHead, Tip, ViewRow, scoreColor } from '../../components/premium/Kit';
import { useApp } from '../../context/AppContext';
import { ITEMS } from '../../services/premium/catalog';
import { ageNow, currentDaeun, elName, mainStem, pFrom, pText, relation, stage12, stageKeyOfAge, strength3, tenGod, tenName } from '../../services/premium/helpers';
import { DaeunTable, LifePreview, LifeStage, SajuFull, SrcKey } from '../../types/premium';
import { usePremiumContent, usePremiumPreview } from '../../services/server/premiumApi';
import { User } from '../../types';
import { DAEUN_TEXT, EL_LUCK, PERIOD_TEXT, REL_SCORE, STAGE12, STAGE_FIELD, STEM_PERSONA, TG } from '../../services/premium/data';
import { BRANCHES, STEMS } from '../../data/sajuData';
import { seededRandom } from '../../utils/seed';
import { colors, gradients } from '../../theme/colors';
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

export default function LifeScreen() {
  const { user: u, today } = useApp();
  const content = usePremiumContent<{ stages: LifeStage[]; daeun: DaeunTable; chart: { a: number; v: number }[] }>({ kind: 'life' });
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
        : L && F ? <LifeBody u={u} st={L.stages} dae={L.daeun} F={F} />
        : <BodyState error={content.isError} onRetry={() => content.refetch()} />}
      <ShareCta item={item} spec={spec} />
      <Disclaimer compact />
    </Screen>
  );
}

/** 열람한 본문 (01~06) */
function LifeBody({ u, st, dae, F }: { u: User; st: LifeStage[]; dae: DaeunTable; F: SajuFull }) {
  const nav = useNavigation();
  const { today } = useApp();
  const now = ageNow(u, today);
  const curD = currentDaeun(dae.list, now); const cy = Number(today.slice(0, 4));
  const sorted = [...dae.list].sort((a, b) => b.score - a.score);
  const gold = sorted.slice(0, 2).sort((a, b) => a.age - b.age), care = sorted.slice(-1);
  const seun = Array.from({ length: 10 }, (_, i) => {
    const y = cy + i; const yp = pFrom(y - 4); const tg = tenGod(F.ds, yp.stem); const rel = relation(F.meE, STEMS[yp.stem].element);
    const r = seededRandom(u.id + '-seun-' + y);
    return { y, yp, tg, rel, sc: Math.round(REL_SCORE[rel] * 0.7 + (curD ? curD.score : 78) * 0.3 + (r() * 6 - 3)), age: now + i };
  });
  const curKey = stageKeyOfAge(now);
  const nextD = curD ? dae.list[dae.list.indexOf(curD) + 1] : undefined;

  return (
    <>
      <SubHead title="01 · 초년 · 중년 · 말년" caption="시기마다 4가지 관점이 말하는 이야기" />
      <View style={{ gap: 14 }}>
        {st.map(x => {
          const cur = x.key === curKey;
          const head = (
            <>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', opacity: 0.8, color: cur ? colors.white : colors.purple }}>{x.label} · {x.range}</Text>
                <Text style={{ fontSize: 18, fontWeight: '800', marginTop: 2, color: cur ? colors.white : colors.purple }}>{x.headline}</Text>
              </View>
              <Text style={{ fontSize: 26, fontWeight: '800', color: cur ? colors.white : colors.purple }}>{x.score}</Text>
            </>
          );
          return (
            <Card key={x.key} style={{ padding: 0, overflow: 'hidden' }}>
              {cur
                ? <View style={[s.stageHead, { backgroundColor: colors.heroBg }]}>{head}</View>
                : <View style={[s.stageHead, { backgroundColor: colors.lavenderSoft }]}>{head}</View>}
              <View style={{ paddingVertical: 16, paddingHorizontal: 18 }}>
                <Para mt={0}>{x.desc}</Para>
                <View style={s.fgrid}>
                  {([['財', '재물', STAGE_FIELD[x.rel].money], ['業', '일', STAGE_FIELD[x.rel].work], ['緣', '연애·가정', STAGE_FIELD[x.rel].love], ['康', '건강', STAGE_FIELD[x.rel].health]] as const).map(([e, l, t]) => (
                    <View key={l} style={s.fcell}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.ink }}>{e} {l}</Text>
                      <Text style={{ fontSize: 13, lineHeight: 18, color: colors.inkSub }}>{t}</Text>
                    </View>
                  ))}
                </View>
                <View style={{ marginTop: 8 }}>
                  {(['saju', 'thai', 'mbti', 'blood'] as SrcKey[]).map((k, i) => <View key={k} style={i ? s.topLine : null}><ViewRow k={k}>{x.views[k]}</ViewRow></View>)}
                </View>
                <Tip title="이 시기를 잘 보내는 법" style={{ marginTop: 8 }}>{x.advice}</Tip>
              </View>
            </Card>
          );
        })}
      </View>

      <SubHead title="02 · 인생의 황금기" caption="10년 대운 중 흐름이 가장 높은 구간" />
      <View style={s.grid2}>
        {gold.map((d, gi) => (
          <View key={d.age} style={[s.goldCard]}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.money }}>吉 황금기</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', marginTop: 4, color: colors.ink }}>{d.age}~{d.age + 9}세</Text>
            <Text style={[txt.small, { marginTop: 2 }]}>{pText(d.p)} · {tenName(d.rel)}</Text>
            <Text style={{ fontSize: 13, marginTop: 6, lineHeight: 19, color: colors.ink }}>{[STAGE_FIELD[d.rel].work, STAGE_FIELD[d.rel].money][gi]}</Text>
          </View>
        ))}
      </View>
      {care.map(d => (
        <Card key={d.age} style={{ marginTop: 10 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.thai }}>愼 숨 고르기 구간 · {d.age}~{d.age + 9}세</Text>
          <Para>{pText(d.p)} 대운은 상대적으로 흐름이 잔잔해요. {STAGE_FIELD[d.rel].health} 큰 확장보다 내실을 다지면 다음 대운에서 크게 도약해요.</Para>
        </Card>
      ))}

      <SubHead title="03 · 10년 대운 전체" caption={`${dae.fwd ? '순행' : '역행'} · ${dae.start}세 시작 · 8개 대운`} />
      <View style={{ gap: 10 }}>
        {dae.list.map(d => {
          const cur = !!curD && d.age === curD.age;
          const stg = tenGod(F.ds, d.p.stem), btg = tenGod(F.ds, mainStem(d.p.branch)), s12 = stage12(F.ds, d.p.branch);
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
                    <Text style={txt.caption}>{cy - now + d.age}~{cy - now + d.age + 9}년 · {TG[stg]} / {TG[btg]} · {STAGE12[s12]}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 18, fontWeight: '800', color: scoreColor(d.score) }}>{d.score}</Text>
              </View>
              <Para mt={10}>{DAEUN_TEXT[d.rel]}</Para>
              <Text style={[txt.small, { marginTop: 6 }]}>財 {STAGE_FIELD[d.rel].money}</Text>
            </Card>
          );
        })}
      </View>

      {curD ? (
        <>
          <SubHead title="04 · 지금의 대운" caption={`${curD.age}~${curD.age + 9}세 · ${pText(curD.p)}`} />
          <Hero style={{ marginTop: 0 }}>
            <Text style={{ fontSize: 14.5, lineHeight: 23, color: 'rgba(255,255,255,0.9)' }}>지금은 {tenName(curD.rel)} 대운이에요. {DAEUN_TEXT[curD.rel]} 이 10년 동안 {STAGE_FIELD[curD.rel].work} {STAGE_FIELD[curD.rel].love}</Text>
            <Text style={{ fontSize: 13, color: colors.moon, marginTop: 12 }}>남은 기간 약 {Math.max(0, curD.age + 10 - now)}년 · 다음 대운 {pText(nextD?.p ?? curD.p)}</Text>
          </Hero>
        </>
      ) : null}

      <SubHead title="05 · 앞으로 10년 세운" caption="해마다 들어오는 기운" />
      <Card style={{ paddingVertical: 2, paddingHorizontal: 16 }}>
        {seun.map((x, i) => (
          <PressableScale key={x.y} disabled={i >= 2} onPress={() => nav.navigate('NewYear', { year: x.y })} style={[s.drow, i ? s.topLine : null]} scaleTo={0.98}>
            <View style={s.dd}><Text style={{ fontFamily: fonts.serif, fontSize: 14, fontWeight: '600', color: colors.ink }}>{x.y}</Text><Text style={{ fontSize: 11, color: colors.inkMute }}>{x.age}세</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.ink }}>{PERIOD_TEXT.year[x.rel][0]}</Text>
              <Text style={txt.caption}>{pText(x.yp)} · {TG[x.tg]} · {BRANCHES[x.yp.branch].animal}의 해</Text>
            </View>
            <Text style={{ fontWeight: '700', color: scoreColor(x.sc) }}>{x.sc}</Text>
          </PressableScale>
        ))}
      </Card>

      <SubHead title="06 · 평생 조언" />
      <Card>
        {[
          `나의 용신은 ${elName(F.yong)}이에요. ${EL_LUCK[F.yong].act} 같은 습관이 평생의 운을 받쳐줘요.`,
          `${STEM_PERSONA[F.ds].core}이 가장 큰 무기예요. ${STEM_PERSONA[F.ds].watch}.`,
          `황금기(${gold.map(d => d.age + '~' + (d.age + 9) + '세').join(', ')})를 위해 지금 준비할 것: ${STAGE_FIELD[gold[0].rel].work}`,
        ].map((t, i) => <Bullet key={i}>{t}</Bullet>)}
      </Card>
      <Text style={[txt.caption, { textAlign: 'center', marginTop: 16 }]}>대운 시작 나이는 절입일 근사값으로 계산했어요. 인생의 흐름을 참고하는 콘텐츠이며 미래를 단정하지 않아요.</Text>
    </>
  );
}

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
});
