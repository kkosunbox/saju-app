import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, View } from 'react-native';
import Card from '../../components/Card';
import PressableScale from '../../components/PressableScale';
import { Para } from '../../components/premium/Kit';
import { ITEMS, Item } from '../../services/premium/catalog';
import { ConsultCat } from '../../services/content/consult';
import { HelpLine } from '../../services/server/consultApi';
import { colors } from '../../theme/colors';
import { fonts, radius, txt } from '../../theme/typography';

export const kstDate = (iso: string | null) => (iso ? new Date(Date.parse(iso) + 9 * 3600_000).toISOString().slice(0, 10).replace(/-/g, '.') : '');
export const kstTime = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(Date.parse(iso) + 9 * 3600_000);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
};

/** 위기 · 마음 건강 신호일 때: 운세보다 사람의 도움을 먼저 (탭하면 바로 전화) */
export function HelpLines({ lines, crisis }: { lines: HelpLine[]; crisis?: boolean }) {
  return (
    <Card style={s.crisis}>
      <Text style={[txt.h3, { color: colors.love }]}>{crisis ? '지금 많이 힘드시죠' : '마음이 많이 지칠 땐'}</Text>
      <Para>{crisis
        ? '이런 마음은 운세보다 사람의 도움이 먼저 필요해요. 혼자 견디지 말고 지금 바로 이야기해 주세요. 24시간 언제든 연결돼요.'
        : '혼자 견디기 어려울 땐 전문가와 이야기해 보세요. 24시간 언제든 연결돼요.'}</Para>
      <View style={{ gap: 8, marginTop: 12 }}>
        {lines.map(l => (
          <PressableScale key={l.phone} onPress={() => Linking.openURL(`tel:${l.phone.replace(/-/g, '')}`)} style={s.line} scaleTo={0.98} accessibilityLabel={`${l.name} ${l.phone}에 전화하기`}>
            <Text style={{ fontSize: 14, color: colors.ink }}>{l.name}</Text><Text style={{ fontSize: 17, fontWeight: '800', color: colors.love }}>{l.phone}</Text>
          </PressableScale>
        ))}
      </View>
    </Card>
  );
}

/** 내가 한 말 (오른쪽) */
export function MyBubble({ children }: { children: string }) {
  return (
    <View style={s.mine}>
      <Text style={s.mineText}>{children}</Text>
    </View>
  );
}

/** 상담가 이름표 */
export function CounselorTag() {
  return (
    <View style={s.tag}>
      <View style={s.tagSeal}><Text style={s.tagSealText}>談</Text></View>
      <Text style={txt.caption}>운Pick 상담가</Text>
    </View>
  );
}

/** 답을 쓰는 동안 보여 줄 단계 문구 (몇 초마다 넘어가고 마지막에서 멈춘다) */
export const STAGES = {
  first: ['고민을 읽고 있어요…', '사주를 펼쳐 보고 있어요…', '이번 달 기운을 살피는 중이에요…', '답을 정리하고 있어요…'],
  rest: ['사주로 본 나를 풀어 보고 있어요…', '앞으로 3개월 흐름을 보는 중이에요…', '행동하기 좋은 날을 고르고 있어요…', '거의 다 됐어요…'],
  reply: ['질문을 읽고 있어요…', '사주를 다시 보며 답을 쓰고 있어요…'],
};
const STAGE_MS = 3500;

function Typing({ stages }: { stages: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI(n => Math.min(n + 1, stages.length - 1)), STAGE_MS);
    return () => clearInterval(t);
  }, [stages]);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <ActivityIndicator size="small" color={colors.purple} />
      <Text style={[txt.small, { color: colors.inkSub }]} accessibilityLiveRegion="polite">{stages[i]}</Text>
    </View>
  );
}

/** 상담가의 답 (왼쪽) · typing이면 단계 문구를 보여 주며 쓰는 중 */
export function ReplyBubble({ children, typing }: { children?: string; typing?: string[] }) {
  return (
    <View style={s.reply}>
      {typing ? (
        <Typing stages={typing} />
      ) : (
        <Text style={s.replyText}>{children}</Text>
      )}
    </View>
  );
}

/** 이어 물어볼 질문 칩 */
export function SuggestionChips({ items, onPick, caption }: { items: string[]; onPick(q: string): void; caption?: string }) {
  if (!items.length) return null;
  return (
    <View style={s.chips}>
      {caption ? <Text style={txt.caption}>{caption}</Text> : null}
      {items.map(q => (
        <PressableScale key={q} onPress={() => onPick(q)} style={s.chip} scaleTo={0.97} accessibilityLabel={`${q} 물어보기`}>
          <Text style={s.chipText}>{q}</Text>
        </PressableScale>
      ))}
    </View>
  );
}

const CRUSH_ITEM: Item = { ...ITEMS.crush(0, ''), key: 'crush:preview', title: '그 사람의 속마음' };

/** 고민 주제에 맞는 다음 콘텐츠 (운세 탭에 있던 '약한 분야 추천'을 상담 안으로) */
export const TOPIC_REC: Record<ConsultCat, { key: string; title: string; desc: string; item: Item; to: [string, Record<string, unknown>?] }> = {
  love: { key: 'theme-love', title: '연애·결혼 운세로 더 깊이', desc: '연애 스타일 · 잘 맞는 사람 · 인연이 오는 해', item: ITEMS.theme('love'), to: ['Theme', { kind: 'love' }] },
  reunion: { key: 'crush', title: '그 사람의 속마음', desc: '궁합을 본 뒤 마음 온도 · 연락하기 좋은 날까지', item: CRUSH_ITEM, to: ['Tabs', { screen: 'Compatibility' }] },
  work: { key: 'theme-career', title: '직업·적성 운세로 더 깊이', desc: '맞는 일 · 커리어 상승기 · 이직 타이밍', item: ITEMS.theme('career'), to: ['Theme', { kind: 'career' }] },
  study: { key: 'theme-career', title: '직업·적성 운세로 더 깊이', desc: '맞는 일 · 커리어 상승기 · 진로 타이밍', item: ITEMS.theme('career'), to: ['Theme', { kind: 'career' }] },
  money: { key: 'theme-money', title: '재물 운세로 더 깊이', desc: '돈 버는 방식 · 재물이 모이는 시기', item: ITEMS.theme('money'), to: ['Theme', { kind: 'money' }] },
  people: { key: 'crush', title: '그 사람과의 궁합', desc: '생년월일만 넣으면 둘의 궁합 · 속마음까지', item: CRUSH_ITEM, to: ['Tabs', { screen: 'Compatibility' }] },
  family: { key: 'crush', title: '가족과의 궁합', desc: '생년월일만 넣으면 둘의 궁합과 잘 지내는 법', item: CRUSH_ITEM, to: ['Tabs', { screen: 'Compatibility' }] },
  crush: { key: 'crush', title: '그 사람의 속마음', desc: '궁합을 본 뒤 마음 온도 · 고백하기 좋은 날까지', item: CRUSH_ITEM, to: ['Tabs', { screen: 'Compatibility' }] },
  marriage: { key: 'spouse', title: '미래 배우자 리포트', desc: '어떤 사람을, 언제, 어디서 만나게 될까?', item: ITEMS.spouse(), to: ['Spouse'] },
  job: { key: 'lucky', title: '길일 찾기', desc: '면접 · 계약하기 좋은 날 TOP 5', item: ITEMS.lucky('interview', new Date().toISOString().slice(0, 10)), to: ['Lucky'] },
  business: { key: 'theme-money', title: '재물 운세로 더 깊이', desc: '돈 버는 방식 · 재물이 모이는 시기', item: ITEMS.theme('money'), to: ['Theme', { kind: 'money' }] },
  friend: { key: 'crush', title: '친구와의 궁합', desc: '생년월일만 넣으면 둘의 궁합과 잘 지내는 법', item: CRUSH_ITEM, to: ['Tabs', { screen: 'Compatibility' }] },
  children: { key: 'crush', title: '아이와의 궁합', desc: '생년월일만 넣으면 둘의 궁합과 잘 맞는 대화법', item: CRUSH_ITEM, to: ['Tabs', { screen: 'Compatibility' }] },
  decision: { key: 'lucky', title: '길일 찾기', desc: '이사 · 계약 · 시작하기 좋은 날 TOP 5', item: ITEMS.lucky('move', new Date().toISOString().slice(0, 10)), to: ['Lucky'] },
  self: { key: 'life', title: '평생운 · 10년 대운', desc: '인생 그래프 · 황금기와 위기 · 앞으로 10년', item: ITEMS.life(), to: ['Life'] },
};

const s = StyleSheet.create({
  crisis: { marginTop: 16, borderWidth: 1.5, borderColor: colors.love },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: radius.md, backgroundColor: colors.loveBg },
  mine: { alignSelf: 'flex-end', maxWidth: '86%', marginTop: 16, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 18, borderBottomRightRadius: 6, backgroundColor: colors.navy },
  mineText: { fontSize: 15, lineHeight: 22, color: colors.white },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, marginBottom: 6 },
  tagSeal: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.seal },
  tagSealText: { fontFamily: fonts.serif, fontSize: 12, fontWeight: '700', color: colors.white },
  reply: { alignSelf: 'flex-start', maxWidth: '92%', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 18, borderTopLeftRadius: 6, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  replyText: { fontSize: 15, lineHeight: 23, color: colors.ink },
  chips: { gap: 8, marginTop: 14, alignItems: 'flex-start' },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, backgroundColor: colors.lavenderSoft, borderWidth: 1, borderColor: colors.lavender },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.purple },
});
