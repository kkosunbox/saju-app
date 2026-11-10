import React, { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import PressableScale from '../../components/PressableScale';
import SolidIcon, { SolidIconName } from '../../components/SolidIcon';
import Disclaimer from '../../components/Disclaimer';
import { BodyState, Bullet, HeadRow, LockGate, Para, Pill, Rank, SubHead } from '../../components/premium/Kit';
import { PartPending, ReadingBanner } from '../../components/premium/Reading';
import { PREVIEW_STEPS, PreviewMakingCard, PreviewReveal, usePreviewMaking } from '../../components/premium/PreviewMaking';
import { ReadingReveal, ReadingStepsScreen, useReadingGate } from '../../components/premium/ReadingGate';
import { LuckyReading, ReadingView } from '../../types/reading';
import { useApp } from '../../context/AppContext';
import { useSharedArg } from '../../context/SharedViewContext';
import { ITEMS } from '../../services/premium/catalog';
import { WEEK, pText } from '../../services/premium/helpers';
import { LuckyDay, LuckyDays, LuckyPreview, PurposeKey, SajuFull } from '../../types/premium';
import { usePremiumContent, usePremiumPreview, useReading } from '../../services/server/premiumApi';
import { EL_LUCK, PURPOSE, PURPOSE_TIPS, STAGE12, TG } from '../../services/premium/data';
import { dayNumber, parseISO, weekdayOf } from '../../utils/date';
import { colors, isDark } from '../../theme/colors';
import { radius, txt } from '../../theme/typography';
import Icon from '../../components/Icon';
import ShareCta, { ShareIconButton } from '../../components/ShareCta';
import { luckySpec } from '../../services/share/shareSpecs';

const dateLabel = (iso: string) => { const { m, d } = parseISO(iso); return `${m}월 ${d}일 ${WEEK[weekdayOf(iso)]}요일`; };
/** 점수는 순위를 가르려고 보너스를 더해 100을 넘기도 한다 — 화면에는 100점 만점으로 */
const score = (n: number) => Math.min(n, 100);

/** 목적 칸 아이콘 — Figma 20×20 틀 안의 그림 크기 */
const PURPOSE_ICON: Record<PurposeKey, [SolidIconName, number]> = {
  move: ['house', 16], contract: ['documentText', 16], confess: ['heartFill', 16], interview: ['work', 13], travel: ['globe', 16], start: ['sprout', 20],
};
const AVOID_RED = '#DD2828';
/** 피하면 좋은 날 카드 — Figma 운픽_24: 연분홍 바탕, 아이콘 원 #FBD8D8 */
const AVOID_BG = isDark ? '#33201F' : '#FFF2F2';
const AVOID_DOT = isDark ? '#5A2A2A' : '#FBD8D8';

export default function LuckyScreen() {
  const { user: u, today } = useApp();
  // 풀이 완성 알림을 눌러 오면 그 목적으로 연다
  const { purpose } = useLocalSearchParams<{ purpose?: string }>();
  // 공유 링크로 열면 공유된 목적만 (목적 고르기는 숨긴다)
  const sharedArg = useSharedArg();
  const want = sharedArg ?? purpose;
  const [pk, setPk] = useState<PurposeKey>(want && want in PURPOSE_ICON ? (want as PurposeKey) : 'move');
  const ref = { kind: 'lucky', purpose: pk } as const;
  const content = usePremiumContent<LuckyDays>(ref);
  const { reading, retry } = useReading<LuckyReading>(content);
  const gate = useReadingGate(content.open ? reading : null, content);
  const preview = usePremiumPreview<LuckyPreview>(ref, !content.open);
  const making = usePreviewMaking(pk, !!preview.data, !content.open && !preview.isError, PREVIEW_STEPS.lucky.length);
  if (!u) return null;
  const item = ITEMS.lucky(pk, today);
  if (content.open && gate.show) return <ReadingStepsScreen title="길일 찾기" kind="lucky" reading={reading} />;
  const L = content.data?.data;
  const top = L?.list[0];

  return (
    <Screen title="길일 찾기" back right={<ShareIconButton item={item} spec={L ? luckySpec(u, L) : null} />}>
      <HeadRow item={item} caption="앞으로 45일 중에서 골라요" />
      {sharedArg === null ? <>
      <Text style={[txt.title, { marginTop: 10 }]}>어떤 날을{'\n'}찾고 있나요?</Text>
      <View style={s.grid}>
        {PURPOSE.map(([k, , l]) => {
          const [icon, size] = PURPOSE_ICON[k as PurposeKey];
          return (
            <PressableScale key={k} onPress={() => setPk(k as PurposeKey)} haptic scaleTo={0.95} style={[s.cell, k === pk && s.cellOn]} accessibilityState={{ selected: k === pk }} accessibilityLabel={l}>
              <View style={s.cellIcon}><SolidIcon name={icon} size={size} color={k === pk ? colors.accent : '#999999'} /></View>
              <Text style={{ fontSize: 14, fontWeight: '700', marginTop: 8, color: k === pk ? colors.white : colors.ink }}>{l}</Text>
            </PressableScale>
          );
        })}
      </View>
      </> : null}

      {making.making ? <PreviewMakingCard gate={making} steps={PREVIEW_STEPS.lucky} title="좋은 날 TOP 5를 고르고 있어요" style={{ marginTop: 24 }} /> : <PreviewReveal gate={making}>{content.open ? (
        <Card style={[s.first, s.row]}>
          <View style={s.crown}><SolidIcon name="crown" size={16} color="#FCBD51" /></View>
          <View style={{ flex: 1 }}>
            <Text style={txt.caption}>{PURPOSE_LABEL[pk]}하기 가장 좋은 날</Text>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.ink }}>{top ? dateLabel(top.iso) : '…'}</Text>
          </View>
          <Text style={s.score}>{top ? `${score(top.s)}점` : ''}</Text>
        </Card>
      ) : <TopFivePreview p={preview.data} pk={pk} today={today} />}</PreviewReveal>}

      {!content.open ? <LockGate key={item.key} item={item} />
        : L && content.data?.F ? <ReadingReveal on={gate.appeared}><LuckyBody key={item.key} L={L} F={content.data.F} pk={pk} reading={reading} onRetry={retry} /></ReadingReveal>
        : <BodyState error={content.isError} onRetry={() => content.refetch()} />}
      <ShareCta item={item} spec={L ? luckySpec(u, L) : null} />
      <Disclaimer mt={24} />
    </Screen>
  );
}

const PURPOSE_LABEL = Object.fromEntries(PURPOSE.map(([k, , l]) => [k, l])) as Record<PurposeKey, string>;

/** 받침 있으면 '이에요', 없으면 '예요' */
const ieyo = (w: string) => { const c = w.charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c <= 11171 && c % 28 ? '이에요' : '예요'; };

/** 공개한 날을 고른 이유 — 서버가 준 근거 플래그로 짧게 (AI 풀이는 열람 후) */
function pickReasons(t: NonNullable<LuckyPreview['pick']>, label: string): string[] {
  const r: string[] = [];
  if (t.gw) r.push('천을귀인이 드는 날이라 도움을 받기 쉬워요');
  if (t.harmony) r.push('내 일지와 육합을 이뤄 일이 순하게 맞물려요');
  if (t.hit.length) r.push(`${label}에 필요한 ${t.hit.map(k => `'${k}'`).join('·')} 기운이 들어와요`);
  r.push(`${pText(t.dp)} 일진은 나에게 ${TG[t.tg]}, 에너지 단계는 ${STAGE12[t.st]}${ieyo(STAGE12[t.st])}`);
  return r.slice(0, 2);
}

/** 열기 전 TOP 5 카드: 1~4위는 점수만 보이고 날짜는 잠금, 마지막 순위 하루만 날짜·근거까지 공개 */
function TopFivePreview({ p, pk, today }: { p?: LuckyPreview; pk: PurposeKey; today: string }) {
  const label = PURPOSE_LABEL[pk];
  const t = p?.pick;
  const scores = p?.scores ?? [];
  const dday = t ? dayNumber(t.iso) - dayNumber(today) : null;
  return (
    <Card style={s.first}>
      <Text style={s.cardTitle}>{label}하기 좋은 날 TOP {scores.length || 5}</Text>
      <Text style={[txt.caption, { marginTop: 2 }]}>앞으로 45일 중에서 골랐어요 · {t ? `${t.rank}위` : '한 날'}만 미리 보여드려요</Text>

      <View style={{ marginTop: 10 }}>
        {scores.map((v, i) => {
          const open = t && i + 1 === t.rank;
          return (
            <View key={i} style={[s.topRow, i ? s.topLine : null]}>
              <View style={s.row}>
                <Rank n={i + 1} first={i === 0} />
                {open ? (
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink }}>{dateLabel(t.iso)}</Text>
                    <Text style={txt.caption}>{`${dday === 0 ? '오늘' : `D-${dday}`} · 행운의 시간 ${t.luckyTime}`}</Text>
                  </View>
                ) : (
                  <>
                    <View style={s.ghostDate} />
                    <View style={{ flex: 1 }} />
                    <Icon name="lock" size={14} color={colors.inkMute} strokeWidth={2} />
                  </>
                )}
                <Text style={[s.score, s.restScore, i === 0 && { color: colors.purple }]}>{score(v)}점</Text>
              </View>
              {open ? (
                <View style={s.pickBody}>
                  {t.gw ? <Pill tone="ok" style={{ alignSelf: 'flex-start', marginBottom: 6 }}>貴 귀인일</Pill> : null}
                  {pickReasons(t, label).map(w => <Bullet key={w} textStyle={txt.small}>{w}</Bullet>)}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      {t ? (
        <Text style={[txt.caption, s.topFoot]}>
          {`${t.rank > 1 ? `1~${t.rank - 1}위` : '나머지'} 날짜와 이유${p?.avoid ? `, 피하면 좋은 날 ${p.avoid}일` : ''}은 열면 볼 수 있어요`}
        </Text>
      ) : null}
    </Card>
  );
}

/** 열람한 본문: 날짜·점수는 서버 계산값, 이유와 팁은 AI 풀이 */
function LuckyBody({ L, F, pk, reading, onRetry }: { L: LuckyDays; F: SajuFull; pk: PurposeKey; reading: ReadingView<LuckyReading> | null; onRetry(): void }) {
  const { P, list, bad } = L;
  const writing = reading?.status === 'writing';
  const R = reading?.parts.days;
  const fallback = (x: LuckyDay) => [
    x.gw ? '천을귀인이 드는 날이라 도움을 받기 쉬워요' : '',
    `일진 ${pText(x.dp)}이 나에게 ${TG[x.tg]}이에요 · 에너지 단계 ${STAGE12[x.st]}`,
  ].filter(Boolean).join(' ');

  return (
    <>
        <ReadingBanner reading={reading} onRetry={onRetry} />
        {R ? <Card style={{ marginTop: 16 }}><Text style={txt.body}>{R.intro}</Text></Card> : null}
        <SubHead title={P[2] + '하기 좋은 날 TOP 5'} caption="사주 일진 · 귀인 · 4가지 관점 키워드를 함께 봤어요" />
        <View style={{ gap: 10 }}>
          {list.map((x, i) => {
            const t = R?.best[i];
            return (
              <Card key={x.iso}>
                <View style={s.row}>
                  <Rank n={i + 1} first={i === 0} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink }}>{dateLabel(x.iso)}</Text>
                    <Text style={txt.caption}>{pText(x.dp)}일 · {TG[x.tg]} · 행운의 시간 {x.c.luckyTime}</Text>
                  </View>
                  <Text style={[s.score, { color: i === 0 ? colors.purple : colors.purpleSoft }]}>{score(x.s)}점</Text>
                </View>
                {t ? (
                  <>
                    <Text style={s.dayText}>{t.why}</Text>
                    <Text style={[txt.small, { marginTop: 6, color: colors.purple }]}>이날 해 볼 것 · {t.tip}</Text>
                  </>
                ) : writing ? <PartPending writing lines={2} /> : <Text style={s.dayText}>{fallback(x)}</Text>}
                {x.gw ? <Pill tone="ok" style={{ marginTop: 8, alignSelf: 'flex-start' }}>貴 귀인일</Pill> : null}
              </Card>
            );
          })}
        </View>
        <SubHead title="피하면 좋은 날" />
        <View style={s.avoidBox}>
          {bad.map((x, i) => (
            <View key={x.iso} style={s.avoidRow}>
              <View style={s.avoid}><Icon name="close" size={12} strokeWidth={3} color={AVOID_RED} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.avoidDate}>{dateLabel(x.iso)}</Text>
                {R?.avoid[i] ? <Text style={txt.small}>{R.avoid[i]}</Text> : writing ? <PartPending writing lines={1} /> : <Text style={txt.small}>{x.clash ? '일지와 충(沖)하는 날이라 변수가 생기기 쉬워요' : '흐름이 잔잔해 큰일을 벌이기엔 아쉬운 날이에요'}</Text>}
              </View>
            </View>
          ))}
        </View>
        <SubHead title={P[2] + ' 당일 팁'} />
        <Card>
          {R ? R.tips.map(t => <Bullet key={t} textStyle={txt.body}>{t}</Bullet>) : writing ? <PartPending writing lines={3} /> : (
            <>
              {PURPOSE_TIPS[pk].map(t => <Bullet key={t} textStyle={txt.body}>{t}</Bullet>)}
              <Bullet textStyle={txt.body}>용신 색({EL_LUCK[F.yong].color})을 소품으로 활용해 보세요</Bullet>
            </>
          )}
        </Card>
        <Text style={[txt.caption, { textAlign: 'center', marginTop: 16 }]}>재미와 참고를 위한 추천이에요. 실제 일정은 상황에 맞게 정해 주세요.</Text>
    </>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  cell: { width: '31%', flexGrow: 1, minHeight: 72, borderRadius: radius.sm, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  cellOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  cellIcon: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  first: { marginTop: 24 },
  score: { fontSize: 18, fontWeight: '700', color: colors.purple },
  /** 반복 카드 본문 — 월별·신년 운세의 주차 카드와 같은 14/21 */
  dayText: { ...txt.body, marginTop: 8 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.ink },
  topRow: { paddingVertical: 10 },
  pickBody: { marginTop: 8, marginLeft: 42 },
  topFoot: { marginTop: 6, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: colors.lineStrong },
  ghostDate: { width: 104, height: 12, borderRadius: 6, backgroundColor: colors.line },
  restScore: { fontSize: 15, color: colors.purpleSoft, minWidth: 44, textAlign: 'right' },
  crown: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  avoid: { width: 18, height: 18, borderRadius: 9, backgroundColor: AVOID_DOT, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  avoidBox: { backgroundColor: AVOID_BG, borderRadius: 12, paddingVertical: 15, paddingLeft: 14, paddingRight: 16, gap: 16 },
  avoidRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  avoidDate: { fontSize: 15, lineHeight: 21, fontWeight: '700', color: colors.ink, marginBottom: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topLine: { borderTopWidth: 0.5, borderTopColor: colors.lineStrong },
});
