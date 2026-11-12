/** 구독 결제 내역 — 최신순, 페이지 번호로 넘겨 본다 (구독 관리 화면은 최근 10건만) */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Screen from '../../components/Screen';
import Icon from '../../components/Icon';
import PressableScale from '../../components/PressableScale';
import { BodyState } from '../../components/premium/Kit';
import { useApp } from '../../context/AppContext';
import { Purchase, pointsApi, pointsKeys } from '../../services/server/pointsApi';
import { colors } from '../../theme/colors';
import { radius, sansW, txt } from '../../theme/typography';
import { kstDot, won } from './subscriptionText';

const PAGE = 20;
/** 페이지 번호는 지금 페이지 앞뒤로 이만큼 보여 준다 */
const SPAN = 2;
const PAYMENT_STATUS: Record<string, string> = { completed: '결제 완료', refunded: '환불됨', cancelled: '취소됨', failed: '결제 실패', pending: '결제 대기' };

/** 결제 한 줄씩 — 날짜 · 상태 · 금액 (환불·실패는 금액에 줄을 긋는다) */
export function PaymentRows({ rows }: { rows: Purchase[] }) {
  return (
    <View style={s.history}>
      {rows.map((p, i) => (
        <View key={p.id} style={[s.row, i > 0 && s.line]}>
          <Text style={s.date}>{kstDot(p.completedAt ?? p.createdAt)}</Text>
          <Text style={[s.status, p.status !== 'completed' && { color: colors.inkMute }]}>{PAYMENT_STATUS[p.status] ?? p.status}</Text>
          <Text style={[s.won, p.status !== 'completed' && s.strike]}>{won(p.amountKrw)}</Text>
        </View>
      ))}
    </View>
  );
}

export default function SubscriptionPaymentsScreen() {
  const { account } = useApp();
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: [...pointsKeys.subscriptionPayments, account?.id, page, PAGE],
    queryFn: () => pointsApi.subscriptionPayments(page, PAGE),
    enabled: !!account,
    placeholderData: keepPreviousData,
  });
  const total = q.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const from = Math.max(1, Math.min(page - SPAN, pages - SPAN * 2));
  const numbers = Array.from({ length: Math.min(pages, SPAN * 2 + 1) }, (_, i) => from + i);

  return (
    <Screen title="구독 결제 내역" back>
      <Text style={[txt.caption, { marginTop: 4, marginBottom: 10 }]}>전체 {total}건 · 최신순</Text>
      {q.isError ? <BodyState error onRetry={() => q.refetch()} />
        : q.data?.list.length ? <PaymentRows rows={q.data.list} />
        : q.isPending ? <BodyState /> : <Text style={[txt.body, { paddingVertical: 14 }]}>아직 결제 내역이 없어요.</Text>}
      {pages > 1 ? (
        <View style={s.pager}>
          <PageButton label={<Icon name="chevronLeft" size={16} color={colors.ink} strokeWidth={2} />} disabled={page === 1} onPress={() => setPage(page - 1)} a11y="이전 페이지" />
          {numbers.map(n => (
            <PageButton key={n} label={String(n)} on={n === page} onPress={() => setPage(n)} a11y={`${n}페이지`} />
          ))}
          <PageButton label={<Icon name="chevronRight" size={16} color={colors.ink} strokeWidth={2} />} disabled={page === pages} onPress={() => setPage(page + 1)} a11y="다음 페이지" />
        </View>
      ) : null}
    </Screen>
  );
}

function PageButton({ label, on, disabled, onPress, a11y }: { label: React.ReactNode; on?: boolean; disabled?: boolean; onPress(): void; a11y: string }) {
  return (
    <PressableScale onPress={onPress} disabled={disabled || on} scaleTo={0.92} style={[s.page, on && s.pageOn, disabled && { opacity: 0.3 }]} accessibilityLabel={a11y} accessibilityState={{ selected: on, disabled }}>
      {typeof label === 'string' ? <Text style={[s.pageText, on && { color: colors.white }]}>{label}</Text> : label}
    </PressableScale>
  );
}

const s = StyleSheet.create({
  history: { borderRadius: radius.lg, backgroundColor: colors.card, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  line: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
  date: { ...sansW('500'), fontSize: 13, color: colors.ink, flex: 1 },
  status: { ...sansW('500'), fontSize: 12, color: colors.ink },
  won: { ...sansW('700'), fontSize: 13, color: colors.ink, minWidth: 64, textAlign: 'right' },
  strike: { textDecorationLine: 'line-through', color: colors.inkMute },
  pager: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 20 },
  page: { minWidth: 32, height: 32, paddingHorizontal: 6, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  pageOn: { backgroundColor: colors.navy },
  pageText: { ...sansW('600'), fontSize: 13, color: colors.ink },
});
