import React, { useCallback, useEffect, useState } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect, useNavigation } from '@/navigation/compat';
import PressableScale from '../../components/PressableScale';
import Mascot from '../../components/Mascot';
import Icon from '../../components/Icon';
import { useApp } from '../../context/AppContext';
import { compatApi, compatKeys } from '../../services/server/compatApi';
import { FriendResult, getFriendResult, markFriendSeen } from '../../services/share/linkShare';
import { openFriendRoute } from '../../navigation/premium';
import { colors } from '../../theme/colors';
import { radius, txt } from '../../theme/typography';

/**
 * 첫 화면 알림 두 가지 (예전 홈에 있던 것): 내 초대 링크로 상대가 궁합을 봤다 · 친구 결과 링크로 들어왔다(나도 해보기).
 * 둘 다 없으면 아무것도 그리지 않는다
 */
export default function HomeNotices({ style }: { style?: StyleProp<ViewStyle> }) {
  const nav = useNavigation();
  const { user } = useApp();
  const [friend, setFriend] = useState<FriendResult | null>(null);
  useEffect(() => { getFriendResult().then(f => setFriend(f && !f.seen ? f : null)); }, []);
  // 궁합 화면과 같은 캐시 — 열면 궁합 화면이 '봤음'으로 바꾼다
  const compat = useQuery({ queryKey: [...compatKeys.list, user?.id, user?.version], queryFn: () => compatApi.list(user!.id), enabled: !!user });
  const { refetch } = compat;
  useFocusEffect(useCallback(() => { if (user) refetch(); }, [user, refetch]));
  const arrived = compat.data?.filter(r => r.isNew) ?? [];
  if (!arrived.length && !friend) return null;

  return (
    <View style={[{ gap: 8, marginTop: 20 }, style]}>
      {arrived.length ? (
        <PressableScale onPress={() => nav.navigate('Compatibility', { result: arrived[0] })} style={s.notice} scaleTo={0.98} accessibilityLabel={`${arrived[0].target.nickname}님과의 궁합 결과 보기`}>
          <Mascot name="friends" size={30} />
          <View style={{ flex: 1 }}>
            <Text style={s.title} numberOfLines={1}>
              {arrived.length > 1 ? `${arrived[0].target.nickname}님 외 ${arrived.length - 1}명이` : `${arrived[0].target.nickname}님이`} 내 링크로 궁합을 봤어요
            </Text>
            <Text style={txt.small} numberOfLines={1}>둘의 궁합 {arrived[0].total}점 · 눌러서 결과 보기</Text>
          </View>
          <Icon name="chevronRight" size={18} color={colors.inkMute} />
        </PressableScale>
      ) : null}
      {friend ? (
        // 링크에는 친구 결과 한 줄만 담겨 있다 — 결과를 보여 주는 게 아니라 나도 해보도록 권한다
        <PressableScale onPress={() => { markFriendSeen(); setFriend(null); openFriendRoute(nav, friend.c); }} style={s.notice} scaleTo={0.98} accessibilityLabel={`${friend.n}님의 ${friend.k} 한 줄: ${friend.h}. 나도 해보기`}>
          <Mascot size={30} />
          <View style={{ flex: 1 }}>
            <Text style={s.title} numberOfLines={1}>{friend.n}님의 &apos;{friend.k}&apos;</Text>
            <Text style={txt.small} numberOfLines={1}>&ldquo;{friend.h}&rdquo;</Text>
          </View>
          <Text style={s.cta}>나도 해보기</Text>
          <Icon name="chevronRight" size={18} color={colors.inkMute} />
        </PressableScale>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.lg, backgroundColor: colors.card },
  title: { fontSize: 14, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 },
  cta: { fontSize: 12, fontWeight: '700', color: colors.accent },
});
