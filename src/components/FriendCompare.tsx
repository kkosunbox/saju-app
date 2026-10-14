import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import PressableScale from './PressableScale';
import Icon from './Icon';
import { FriendResult, clearFriendResult, getFriendResult } from '../services/share/linkShare';
import { ShareSpec } from '../services/share/shareSpecs';
import { useShare } from '../services/share/useShare';
import { colors } from '../theme/colors';
import { fonts, radius, txt } from '../theme/typography';

/**
 * 친구가 보낸 결과 링크로 들어왔을 때: 친구 결과와 내 결과를 나란히 보여주고
 * "내 결과 보내기"로 답장 공유를 이끈다 (공유 → 비교 → 답장 공유).
 */
export default function FriendCompare({ route, spec }: { route: string; spec: ShareSpec }) {
  const [fr, setFr] = useState<FriendResult | null>(null);
  const { sendLink } = useShare();
  useEffect(() => { getFriendResult().then(f => setFr(f && f.c === route ? f : null)); }, [route]);
  if (!fr) return null;
  const close = () => { clearFriendResult(); setFr(null); };
  return (
    <View style={s.box}>
      <View style={s.head}>
        <Text style={s.label}>{fr.n}님이 보낸 결과</Text>
        <PressableScale onPress={close} hitSlop={10} accessibilityLabel="닫기"><Icon name="close" size={16} color={colors.inkMute} /></PressableScale>
      </View>
      <View style={s.row}>
        <View style={s.cell}>
          <Text style={txt.caption}>{fr.n}님</Text>
          <Text style={[s.val, KEEP]} numberOfLines={2}>{fr.h}</Text>
        </View>
        <Text style={s.vs}>VS</Text>
        <View style={[s.cell, s.me]}>
          <Text style={[txt.caption, { color: colors.moon }]}>나</Text>
          <Text style={[s.val, { color: colors.white }, KEEP]} numberOfLines={2}>{spec.short}</Text>
        </View>
      </View>
      <PressableScale onPress={async () => { const r = await sendLink(spec); if (r !== 'cancelled') close(); }} style={s.reply} scaleTo={0.97} haptic>
        <Text style={s.replyText}>{fr.n}님에게 내 결과 보내기</Text>
      </PressableScale>
    </View>
  );
}

const KEEP = (Platform.OS === 'web' ? { wordBreak: 'keep-all' } : {}) as object;

const s = StyleSheet.create({
  box: { marginBottom: 16, padding: 16, borderRadius: radius.lg, backgroundColor: colors.loveBg, borderWidth: 1, borderColor: colors.love },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 13, fontWeight: '800', color: colors.love },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  cell: { flex: 1, padding: 12, borderRadius: radius.md, backgroundColor: colors.card, minHeight: 72 },
  me: { backgroundColor: colors.heroBg },
  val: { fontFamily: fonts.serif, fontSize: 16, lineHeight: 22, fontWeight: '700', color: colors.ink, marginTop: 4 },
  vs: { fontFamily: fonts.serif, fontSize: 14, fontWeight: '700', color: colors.love },
  reply: { marginTop: 12, height: 46, borderRadius: radius.md, backgroundColor: colors.love, alignItems: 'center', justifyContent: 'center' },
  replyText: { fontSize: 15, fontWeight: '700', color: colors.white },
});
