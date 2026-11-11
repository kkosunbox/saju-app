/**
 * AI 풀이 공통 조각: 쓰는 중·실패·쓸 수 없음 안내, 아직 쓰지 않은 파트 자리.
 * 서버가 파트별로 나눠 동시에 쓰므로, 다 쓴 파트부터 먼저 보여 준다.
 */
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Card from '../Card';
import PrimaryButton from '../PrimaryButton';
import SolidIcon from '../SolidIcon';
import { SkeletonBlock } from '../Skeleton';
import { colors } from '../../theme/colors';
import { txt } from '../../theme/typography';
import { ReadingView } from '../../types/reading';

/** 풀이 상태 안내. 다 썼으면 아무것도 그리지 않는다. */
export function ReadingBanner({ reading, onRetry }: { reading: ReadingView<unknown> | null; onRetry(): void }) {
  if (!reading || reading.status === 'done') return null;
  // 쓰는 중 안내는 로딩 화면(B) · 로딩 카드(C)가 맡는다
  if (reading.status === 'writing') return null;
  const [title, desc, action] = reading.status === 'failed'
    ? ['풀이 일부를 쓰지 못했어요', '다시 쓰기를 누르면 남은 부분을 마저 써요. 알은 더 들지 않아요.', '다시 쓰기']
    : ['지금은 풀이를 쓸 수 없어요', '계산 결과를 먼저 보여 드려요. 잠시 후 다시 열면 풀이를 써 드릴게요.', '다시 시도'];
  return (
    <Card style={[s.card, { padding: 12 }]}>
      <View style={s.alertRow}>
        {/* 피그마: 흰 원 32 안의 exclamation-circle(20칸, 원 16) — 원은 (16,16), 제목은 (60,12) */}
        <View style={s.alertIco}><SolidIcon name="alert" size={16} color={colors.love} /></View>
        <View style={{ flex: 1 }}>
          <Text style={s.alertTitle}>{title}</Text>
          <Text style={s.alertText}>{desc}</Text>
        </View>
      </View>
      <PrimaryButton label={action} small onPress={onRetry} style={{ marginTop: 12, alignSelf: 'stretch' }} />
    </Card>
  );
}

/** 진행 카드 — 도는 표시 · 제목 · 단계 수 · 막대 · 안내 한 줄 (풀이 쓰는 중, 반려동물 궁합 보는 중). */
export function ProgressCard({ title, done, total, note }: { title: string; done: number; total: number; note: string }) {
  const pct = Math.round((done / Math.max(total, 1)) * 100);
  return (
    <Card style={s.card} accessibilityLabel={`${title}. ${total}개 중 ${done}개 완료`}>
      <View style={s.row}>
        <ActivityIndicator color={colors.purple} />
        <Text style={[txt.h3, { flex: 1 }]}>{title}</Text>
        <Text style={s.count}>{done}/{total}</Text>
      </View>
      <View style={s.track}><View style={[s.fill, { width: `${Math.max(pct, 6)}%` }]} /></View>
      <Text style={[txt.small, { marginTop: 10 }]}>{note}</Text>
    </Card>
  );
}

/** 아직 쓰지 않은 파트 자리 (쓰는 중일 때만). */
export function PartPending({ lines = 4, writing }: { lines?: number; writing: boolean }) {
  if (!writing) return null;
  return (
    <View style={{ gap: 8, marginTop: 8 }} accessibilityLabel="풀이를 쓰는 중">
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonBlock key={i} style={{ height: 14, width: i === lines - 1 ? '62%' : '100%' }} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  card: { marginTop: 16 },
  alertRow: { flexDirection: 'row', gap: 12, paddingLeft: 4, paddingRight: 4 },
  alertIco: { width: 32, height: 32, marginTop: 4, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  alertTitle: { fontSize: 14, fontWeight: '700', letterSpacing: -0.56, color: colors.ink },
  alertText: { marginTop: 4, fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  count: { fontSize: 14, fontWeight: '700', color: colors.purple },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.line, overflow: 'hidden', marginTop: 12 },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.purple },
});
