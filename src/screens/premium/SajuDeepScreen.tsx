import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Disclaimer from '../../components/Disclaimer';
import { BodyState, HeadRow, LockGate, Hero, Pill, heroTxt } from '../../components/premium/Kit';
import { Bullet, Closing, InfoRows, Para, SajuHeading, SourceMark, SubHead, Tip, ViewRow } from '../../components/premium/SajuParts';
import { PartPending, ReadingBanner } from '../../components/premium/Reading';
import { useApp } from '../../context/AppContext';
import { ITEMS } from '../../services/premium/catalog';
import { ELS, axisVerdict, elName, mainStem, stage12, strength3, tenGod, thaiDay } from '../../services/premium/helpers';
import { CrossAxis, Daeun, DaeunTable, SajuFull, SajuPreview, SrcKey } from '../../types/premium';
import { Period, ReadingView, SajuReading, Titled } from '../../types/reading';
import { usePremiumContent, usePremiumPreview, useReading } from '../../services/server/premiumApi';
import { User } from '../../types';
import {
  EL_LUCK, GROUP_DESC, GROUP_KO, HIDDEN, SINSAL, STAGE12, STEM_PERSONA, TG,
} from '../../services/premium/data';
import { BRANCHES, ELEMENT_INFO, STEMS, TenGodGroup } from '../../data/sajuData';
import { THAI_DAYS } from '../../data/thaiData';
import { MBTI_INFO } from '../../data/mbtiData';
import { BLOOD_INFO } from '../../data/bloodData';
import { analysisTheme, colors, isDark } from '../../theme/colors';
import { fonts, sansW, txt } from '../../theme/typography';
import { Pillar } from '../../types/content';
import ShareCta, { ShareIconButton } from '../../components/ShareCta';
import { sajuDeepSpec } from '../../services/share/shareSpecs';

// Separate tile and chart palettes, as in the design; calculations still use element keys.
const TILE_HEX = { wood: '#5FB8A8', fire: '#E54D4D', earth: '#FCBD51', metal: '#91CBE9', water: '#3D79D4' };
const EL_HEX = { wood: '#5FB884', fire: '#E54D4D', earth: '#FE8828', metal: '#2885FE', water: '#1E53A2' };
const EK = (e: keyof typeof ELEMENT_INFO) => ELEMENT_INFO[e].ko;
// 강점 · 보완 제목 색 (디자인 값, 다크 모드는 테마 색)
const STRENGTH_HEX = isDark ? colors.success : '#35A05F';
const CAUTION_HEX = isDark ? colors.thai : '#BA6F28';

interface SajuData { profile: unknown; axes: CrossAxis[]; daeun: DaeunTable }

function Cell({ p, stem }: { p: Pillar | null; stem: boolean }) {
  if (!p) return <View style={[s.pc, { backgroundColor: colors.line }]}><Text style={{ fontSize: 18, fontWeight: '700', color: colors.inkMute }}>?</Text></View>;
  const o = stem ? STEMS[p.stem] : BRANCHES[p.branch];
  return (
    <View style={[s.pc, { backgroundColor: TILE_HEX[o.element] }]}>
      <Text style={s.pcBig}>{o.hanja}</Text>
      <Text style={s.pcSmall}>{o.ko}{stem ? '' : ' · ' + (o as typeof BRANCHES[number]).animal}</Text>
    </View>
  );
}

/** 오행 · 십성 막대 */
function Meter({ label, color, value, max, labelW = 34, h = 9 }: { label: string; color: string; value: number; max: number; labelW?: number; h?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Text style={{ width: labelW, fontSize: 13, fontWeight: '700', color }}>{label}</Text>
      <View style={{ flex: 1, height: h, borderRadius: h / 2, backgroundColor: colors.line, overflow: 'hidden' }}>
        <View style={{ width: `${Math.min(100, Math.max(0, value / Math.max(max, 1) * 100))}%`, height: h, borderRadius: h / 2, backgroundColor: color }} />
      </View>
      <Text style={{ width: 18, textAlign: 'right', fontWeight: '700', color: colors.ink }}>{value}</Text>
    </View>
  );
}

export default function SajuDeepScreen() {
  const { user: u, today } = useApp();
  const content = usePremiumContent<SajuData>({ kind: 'saju' });
  const { reading, retry } = useReading<SajuReading>(content);
  const preview = usePremiumPreview<SajuPreview>({ kind: 'saju' }, !content.open);
  if (!u?.natal) return null;
  const item = ITEMS.sajuDeep();
  const F = content.data?.F ?? null;
  // 원국표·일주는 프로필의 원국으로(무료), 신강약·용신은 본문 또는 미리보기에서
  const ch = u.natal.chart; const ds = ch.day.stem; const me = STEMS[ds]; const per = STEM_PERSONA[ds];
  const pillars: [string, Pillar | null][] = [['시주', ch.hour], ['일주', ch.day], ['월주', ch.month], ['년주', ch.year]];
  const dayName = `${me.ko}${BRANCHES[ch.day.branch].ko}일주`;
  const strength = F ? F.strength : preview.data ? strength3(preview.data.strength) : null;
  const yong = F?.yong ?? preview.data?.yongsin;
  const spec = F ? sajuDeepSpec(u, F) : null;

  return (
    <Screen title="상세사주 해석" back right={<ShareIconButton item={item} spec={spec} />}>
      <HeadRow item={item} caption={`양력 ${u.birthDate.replace(/-/g, '.')} ${u.birthTime || '(시간 모름)'}`} />
      <Text style={s.profileTitle}>{u.nickname}님은{'\n'}{per.img} 같은 사람이에요</Text>
      <Text style={s.profileMeta}>{dayName}{strength ? ` · ${strength}` : ''}{yong ? ` · 용신 ${elName(yong)}` : ''}</Text>
      <Card style={{ marginTop: 16, paddingVertical: 14, paddingHorizontal: 6 }}>
        <View style={s.pgrid}>
          {pillars.map(([l, p]) => {
            const isMe = l === '일주';
            return (
              <View key={l} style={[s.pcol, isMe && s.pcolMe]}>
                <Text style={[s.pl, isMe && { color: colors.purple }]}>{l}{isMe ? ' · 나' : ''}</Text>
                <Text style={s.tgl}>{p ? (isMe ? '일간' : TG[tenGod(ds, p.stem)]) : '-'}</Text>
                <View style={{ gap: 4 }}>
                  <Cell p={p} stem />
                  <Cell p={p} stem={false} />
                </View>
                <Text style={s.tgl}>{p ? TG[tenGod(ds, mainStem(p.branch))] : '-'}</Text>
                <Text style={s.hid}>{p ? HIDDEN[p.branch].map(x => STEMS[x].hanja).join(' ') : ''}</Text>
                <Text style={s.st12}>{p ? STAGE12[stage12(ds, p.branch)] : ''}</Text>
              </View>
            );
          })}
        </View>
        <View style={s.legend}><Text style={s.legendT}>위·아래 작은 글씨: 십성</Text><Text style={s.legendT}>회색: 지장간</Text><Text style={s.legendT}>보라: 12운성</Text></View>
      </Card>
      {!content.open ? <LockGate item={item} />
        : F && content.data ? (
          <SajuBody u={u} F={F} data={content.data.data} reading={reading} onRetry={retry} today={today} />
        ) : <BodyState error={content.isError} onRetry={() => content.refetch()} />}
      <ShareCta item={item} spec={spec} />
      <Disclaimer compact mt={24} />
    </Screen>
  );
}

/** 계산 결과를 그대로 그리는 부분은 서버값, 글은 AI 풀이(파트별로 다 쓴 것부터) */
function SajuBody({ u, F, data, reading, onRetry, today }: {
  u: User; F: SajuFull; data: SajuData; reading: ReadingView<SajuReading> | null; onRetry(): void; today: string;
}) {
  const ch = F.ch; const me = STEMS[F.ds]; const per = STEM_PERSONA[F.ds]; const g = F.grp;
  const mx = Math.max(...ELS.map(e => F.elc[e]), 1); const gmx = Math.max(...Object.values(g), 1);
  const dayName = `${me.ko}${BRANCHES[ch.day.branch].ko}일주`;
  const gk = Object.keys(g) as TenGodGroup[];
  const L = EL_LUCK[F.yong];
  const writing = reading?.status === 'writing';
  const { core, structure, fields, flow } = reading?.parts ?? {};
  const age = ageOn(u.birthDate, today);
  const nowIdx = data.daeun.list.reduce((found, d, i) => (age >= d.age ? i : found), -1);
  const periods: [string, Daeun | undefined, Period | null | undefined][] = [
    ['지금의 10년', data.daeun.list[nowIdx], flow?.daeunNow],
    ['다음 10년', data.daeun.list[nowIdx + 1], flow?.daeunNext],
  ];

  return (
    <>
      <ReadingBanner reading={reading} onRetry={onRetry} />

      <Hero style={{ padding: 18 }}>
        <Text style={heroTxt.eyebrow}>{dayName} · {per.img}</Text>
        {core ? (
          <>
            <Text style={[heroTxt.summ, { fontSize: 18 }]}>{core.headline}</Text>
            <Text style={[heroTxt.body, s.heroBody]}>{core.summary}</Text>
          </>
        ) : (
          <>
            <Text style={[heroTxt.summ, { fontSize: 18 }]}>{per.core}</Text>
            {writing ? <View style={{ marginTop: 10, opacity: 0.6 }}><PartPending writing lines={3} /></View> : null}
          </>
        )}
      </Hero>

      <SubHead title="01 · 타고난 성품" caption="겉모습과 속마음, 일주가 그리는 나" />
      {core ? (
        <>
          <Card>
            <SajuHeading title="겉모습" icon="user" />
            <Para mt={7}>{core.outer}</Para>
          </Card>
          <Card style={{ marginTop: 16 }}>
            <SajuHeading title="속마음" icon="heart" />
            <Para mt={7}>{core.inner}</Para>
          </Card>
          <Card style={{ marginTop: 16 }}>
            <SajuHeading title={`${dayName} (${me.hanja}${BRANCHES[ch.day.branch].hanja}) · ${STAGE12[F.dayStage]}`} icon="puzzle" />
            <Para mt={7}>{core.dayPillar}</Para>
          </Card>
          <Card style={{ marginTop: 16 }}>
            <Text style={[s.label, { color: STRENGTH_HEX }]}>강점</Text>
            {core.strengths.map((t, i) => <TitledRow key={i} t={t} color={colors.success} />)}
            <Text style={[s.label, { color: CAUTION_HEX, marginTop: 16 }]}>보완하면 좋은 점</Text>
            {core.cautions.map((t, i) => <TitledRow key={i} t={t} color="#C27A2C" />)}
          </Card>
        </>
      ) : <Card><PartPending writing={writing} lines={6} /></Card>}

      <SubHead title="02 · 오행의 균형" caption="타고난 다섯 기운" />
      <Card>
        <View style={{ gap: 10 }}>{ELS.map(e => <Meter key={e} label={elName(e)} color={EL_HEX[e]} value={F.elc[e]} max={mx} />)}</View>
        {structure ? (
          <>
            <Para mt={14}>{structure.elements.text}</Para>
            <Text style={[s.label, { marginTop: 20 }]}>기운을 채우는 생활습관</Text>
            {structure.elements.balance.map((t, i) => <Bullet key={i}>{t}</Bullet>)}
          </>
        ) : <PartPending writing={writing} />}
      </Card>

      <SubHead title="03 · 신강·신약과 용신" caption="나를 돕는 기운과 가장 필요한 기운" />
      <Card>
        <LinearGradient colors={['#9FB0CF', '#D8CFBF', '#D3A08E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.gauge}><View style={[s.gaugeDot, { left: `${Math.min(97, Math.max(3, Math.round(F.ratio * 100)))}%` }]} /></LinearGradient>
        <View style={[s.between, { marginTop: 6 }]}><Text style={txt.caption}>신약</Text><Text style={txt.caption}>중화</Text><Text style={txt.caption}>신강</Text></View>
        <Text style={[s.cardTitle, { marginTop: 12 }]}>{F.strength} · 나를 돕는 힘 {Math.round(F.ratio * 100)}%</Text>
        <View style={[s.grid3, { marginTop: 14 }]}>
          {([['용신', '가장 필요한 기운', F.yong], ['희신', '용신을 돕는 기운', F.hee], ['기신', '조심할 기운', F.gi]] as const).map(([l, d, e]) => (
            <View key={l} style={s.cell3}>
              <Text style={txt.caption}>{l}</Text>
              <View style={[s.eld, { backgroundColor: EL_HEX[e] }]}><Text style={{ fontFamily: fonts.serif, color: colors.white, fontWeight: '600', fontSize: 18 }}>{ELEMENT_INFO[e].hanja}</Text></View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>{elName(e)}</Text>
              <Text style={[txt.caption, { marginTop: 2, textAlign: 'center' }]}>{d}</Text>
            </View>
          ))}
        </View>
        {structure ? <Para mt={14}>{structure.strength}</Para> : <PartPending writing={writing} />}
      </Card>

      <SubHead title="04 · 십성과 재능" caption="열 가지 관계로 본 삶의 방식" />
      <Card>
        <View style={{ gap: 10 }}>
          {gk.map(k => (
            <View key={k}>
              <View style={s.between}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.ink, flex: 1 }}>{GROUP_KO[k]} <Text style={[s.smallCaption, { fontWeight: '500' }]}>{GROUP_DESC[k]}</Text></Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.purple }}>{g[k]}</Text>
              </View>
              <View style={s.track}><View style={[s.fill, { width: `${(g[k] / gmx) * 100}%` }]} /></View>
            </View>
          ))}
        </View>
        {structure ? <Para mt={14}>{structure.tenGods.text}</Para> : <PartPending writing={writing} />}
      </Card>
      {structure ? (
        <View style={{ gap: 10, marginTop: 12 }}>
          {structure.tenGods.talents.map((t, i) => (
            <Card key={i}>
              <Text style={s.cardTitle}>{t.title}</Text>
              <Para>{t.text}</Para>
            </Card>
          ))}
        </View>
      ) : null}

      <SubHead title="05 · 신살" caption="사주에 깃든 특별한 별" />
      {F.sinsal.length ? (
        <View style={{ gap: 10 }}>
          {F.sinsal.map(k => {
            const v = SINSAL[k];
            const text = structure?.sinsal.find(x => x.key === k)?.text;
            return (
              <Card key={k}>
                <View style={s.between}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>{v.name} <Text style={txt.caption}>{v.h}</Text></Text>
                  <Pill tone={v.tone === 'good' ? 'ok' : v.tone === 'care' ? 'care' : 'default'}>{({ good: '길신', mix: '양면', care: '주의' } as Record<string, string>)[v.tone]}</Pill>
                </View>
                {text ? <Para>{text}</Para> : writing ? <PartPending writing lines={2} /> : <Para>{v.desc}</Para>}
              </Card>
            );
          })}
        </View>
      ) : <Card><Para mt={0}>두드러진 신살이 없는 담백한 사주예요. 특정 기운에 휘둘리지 않고 노력한 만큼 결과가 정직하게 돌아와요.</Para></Card>}

      <SubHead title="06 · 분야별 타고난 운" caption="연애 · 재물 · 일 · 관계 · 건강" />
      {fields ? (
        <View style={{ gap: 16 }}>
          {FIELD_ORDER.map(([k, label, icon]) => (
            <Card key={k}>
              <View style={s.fieldHead}><SajuHeading title={label} icon={icon} small /></View>
              <Text style={[s.cardTitle, { marginTop: 8, lineHeight: 19 }]}>{fields[k].headline}</Text>
              <Para mt={12}>{fields[k].text}</Para>
              <Tip title="이렇게 해 보세요" style={{ marginTop: 12 }}>{fields[k].tip}</Tip>
            </Card>
          ))}
          <Text style={[txt.caption, { textAlign: 'center' }]}>건강은 전통 오행 이론의 생활 습관 이야기예요. 불편한 증상은 의료 전문가와 상담해 주세요.</Text>
        </View>
      ) : <Card><PartPending writing={writing} lines={6} /></Card>}

      <SubHead title="07 · 대운의 흐름" caption={`10년마다 바뀌는 큰 운 · ${data.daeun.fwd ? '순행' : '역행'} ${data.daeun.start}세 시작`} />
      <View style={{ gap: 10 }}>
        {periods.map(([label, d, text]) => d ? (
          <Card key={label}>
            <View style={s.between}>
              <Text style={s.label}>{label} · {d.age}~{d.age + 9}세</Text>
              <Pill>{`${STEMS[d.p.stem].ko}${BRANCHES[d.p.branch].ko}(${STEMS[d.p.stem].hanja}${BRANCHES[d.p.branch].hanja})`}</Pill>
            </View>
            {text ? (
              <>
                <Text style={[s.cardTitle, { marginTop: 8 }]}>{text.title}</Text>
                <Para>{text.text}</Para>
              </>
            ) : <PartPending writing={writing} lines={3} />}
          </Card>
        ) : null)}
      </View>

      <SubHead title="08 · 개운법" caption={`용신 ${elName(F.yong)}의 기운을 생활 속으로`} />
      <InfoRows rows={[['luck-color', '행운의 색', L.color], ['luck-number', '행운의 숫자', L.num], ['luck-direction', '좋은 방향', L.dir], ['luck-season', '기운이 오르는 계절', L.season], ['luck-food', '추천 음식', L.food], ['luck-items', '곁에 두면 좋은 물건', L.items], ['luck-activity', '추천 활동', L.act]]} />
      {flow ? (
        <Card style={{ marginTop: 12 }}>
          <Para mt={0}>{flow.luck.text}</Para>
          <Text style={[s.label, { marginTop: 14 }]}>운을 키우는 습관</Text>
          {flow.luck.habits.map((t, i) => <Bullet key={i}>{t}</Bullet>)}
          <Text style={[s.label, { marginTop: 14 }]}>곁에 두면 좋은 사람</Text>
          <Para mt={4}>{flow.luck.people}</Para>
        </Card>
      ) : writing ? <Card style={{ marginTop: 12 }}><PartPending writing /></Card> : null}

      <SubHead title="09 · 네 관점 교차 분석" caption="사주 · 점성술 · MBTI · 혈액형이 같은 말을 할 때" />
      <Card style={{ gap: 16 }}>
        {data.axes.map(a => {
          const { pos, neg, verdict } = axisVerdict(a);
          return (
            <View key={a.name}>
              <View style={s.between}>
                <Text style={s.axName}>{a.name}</Text>
                <Text style={s.verdict}>{verdict + (verdict !== '균형' ? ' · ' + Math.max(pos, neg) + '/4' : '')}</Text>
              </View>
              <View style={s.axrow}>
                <Text style={s.axEnd}>{a.neg}</Text>
                <View style={s.axline}>
                  {(['saju', 'thai', 'mbti', 'blood'] as SrcKey[]).map((k, ki) => (
                    <View key={k} style={[s.axdot, { left: `${Math.min(88, Math.max(12, 50 + a.v[k] * 34 + (ki - 1.5) * 7))}%` }]} accessibilityLabel={analysisTheme[k].label}>
                      <SourceMark source={k} />
                    </View>
                  ))}
                </View>
                <Text style={s.axEnd}>{a.pos}</Text>
              </View>
            </View>
          );
        })}
      </Card>
      {structure ? <Para mt={16} style={{ lineHeight: 20 }}>{structure.crossView}</Para> : <PartPending writing={writing} lines={3} />}
      <Card style={{ marginTop: 16, paddingVertical: 0, paddingHorizontal: 10 }}>
        {([['saju', `${per.core} (${me.ko}${EK(me.element)})`], ['thai', THAI_DAYS[thaiDay(u)].trait], ['mbti', `${MBTI_INFO[u.mbti].nickname} · ${MBTI_INFO[u.mbti].strength}`], ['blood', BLOOD_INFO[u.bloodType].trait]] as [SrcKey, string][]).map(([k, t], i) => (
          <View key={k} style={i ? s.topLine : null}><ViewRow k={k}>{t}</ViewRow></View>
        ))}
      </Card>
      {core ? <Closing>{core.closing}</Closing> : null}
    </>
  );
}

const FIELD_ORDER: [keyof SajuReading['fields'], string, 'heart' | 'database' | 'work' | 'people' | 'health'][] = [
  ['love', '연애 · 결혼', 'heart'], ['money', '재물', 'database'], ['work', '일 · 적성', 'work'], ['people', '인간관계', 'people'], ['health', '건강', 'health'],
];

function TitledRow({ t, color }: { t: Titled; color: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
      <View style={[s.dot, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle}>{t.title}</Text>
        <Para mt={2} style={{ color: colors.inkSub }}>{t.text}</Para>
      </View>
    </View>
  );
}

/** 만 나이 */
function ageOn(birthDate: string, today: string): number {
  const [by, bm, bd] = birthDate.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  return ty - by - (tm < bm || (tm === bm && td < bd) ? 1 : 0);
}

const s = StyleSheet.create({
  profileTitle: { ...sansW('800'), fontSize: 22, lineHeight: 28, letterSpacing: -1.1, color: colors.ink, marginTop: 10 },
  profileMeta: { ...sansW('500'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.inkSub, marginTop: 6 },
  cardTitle: { ...sansW('600'), fontSize: 16, lineHeight: 22, letterSpacing: -0.8, color: colors.ink },
  rowTitle: { ...sansW('700'), fontSize: 14, lineHeight: 20, letterSpacing: -0.7, color: colors.ink },
  smallCaption: { ...sansW('400'), fontSize: 11, color: colors.inkMute, letterSpacing: -0.55 },
  verdict: { ...sansW('600'), fontSize: 12, color: colors.ink, letterSpacing: -0.6 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  pgrid: { flexDirection: 'row', gap: 9 },
  pcol: { flex: 1, gap: 6, paddingVertical: 6, paddingHorizontal: 4, borderRadius: 14 },
  pcolMe: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.lavender, paddingHorizontal: 3, paddingVertical: 5 },
  pl: { fontSize: 11, fontWeight: '700', color: colors.inkMute, textAlign: 'center' },
  tgl: { fontSize: 11, fontWeight: '700', color: colors.inkSub, textAlign: 'center' },
  hid: { fontSize: 11, color: colors.inkMute, textAlign: 'center', letterSpacing: 1 },
  st12: { fontSize: 11, fontWeight: '700', color: colors.purpleSoft, textAlign: 'center' },
  pc: { borderRadius: 12, alignItems: 'center', justifyContent: 'center', height: 60 },
  pcBig: { ...sansW('700'), fontSize: 24, lineHeight: 26, letterSpacing: -0.96, color: colors.white },
  pcSmall: { ...sansW('500'), fontSize: 12, lineHeight: 17, letterSpacing: -0.48, color: colors.white },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 12, rowGap: 4, marginTop: 10 },
  legendT: { fontSize: 11.5, color: colors.inkMute },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.line, overflow: 'hidden', marginTop: 6 },
  fill: { height: 6, borderRadius: 3, backgroundColor: '#4392F7' },
  gauge: { height: 10, borderRadius: 5, marginTop: 6 },
  gaugeDot: { position: 'absolute', top: -5, width: 20, height: 20, marginLeft: -10, borderRadius: 10, backgroundColor: colors.card, borderWidth: 3, borderColor: colors.navy },
  grid3: { flexDirection: 'row', gap: 8 },
  cell3: { flex: 1, paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center' },
  eld: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  label: { ...sansW('600'), fontSize: 16, lineHeight: 22, letterSpacing: -0.8, color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  axName: { ...sansW('600'), fontSize: 14, letterSpacing: -0.7, color: colors.ink },
  axEnd: { ...sansW('500'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.inkMute },
  axrow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  axline: { flex: 1, height: 30, borderRadius: 15, backgroundColor: colors.cream },
  // 34 ring on the 30 track, as in the design
  axdot: { position: 'absolute', top: -2, width: 34, height: 34, marginLeft: -17, alignItems: 'center', justifyContent: 'center' },
  topLine: { borderTopWidth: 1, borderTopColor: isDark ? colors.lineStrong : '#E8E8E8' },
  heroBody: { fontSize: 13, lineHeight: 20, marginTop: 10 },
  fieldHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
});

