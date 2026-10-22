import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import OptionChip from './OptionChip';
import { useApp } from '../context/AppContext';
import { usePremium } from '../context/PremiumContext';
import { useNavigation } from '@/navigation/compat';
import { compatApi, compatKeys } from '../services/server/compatApi';
import { PendingInvite, clearPendingInvite } from '../services/share/linkShare';
import { queryClient } from '../api/query';
import { ApiError } from '../api/client';
import { RELATIONSHIPS } from '../data/relationships';
import { Relationship } from '../types';
import { txt } from '../theme/typography';

/**
 * 초대 링크로 들어온 친구가 관계를 고르면 서버가 궁합을 계산하고 결과 화면으로 간다.
 * 같은 결과가 초대한 사람의 궁합 탭에도 들어간다 (서로의 생년월일은 보이지 않는다).
 * onDone: 끝났거나(결과로 감) 더 쓸 수 없는 초대라 지웠을 때 · replace: 이 화면을 결과 화면으로 바꾼다 (초대 화면)
 */
export default function InvitePicker({ invite, onDone, replace }: { invite: PendingInvite; onDone(): void; replace?: boolean }) {
  const nav = useNavigation();
  const { user } = useApp();
  const { toast } = usePremium();
  const [busy, setBusy] = useState<Relationship | null>(null);

  const pick = async (relationship: Relationship) => {
    if (!user || busy) return;
    setBusy(relationship);
    try {
      const result = await compatApi.acceptInvite(user.id, invite.token, relationship);
      await clearPendingInvite();
      queryClient.invalidateQueries({ queryKey: compatKeys.list });
      onDone();
      (replace ? nav.replace : nav.navigate)('Tabs', { screen: 'Compatibility', params: { result } });
    } catch (e) {
      const code = e instanceof ApiError ? e.code : '';
      const gone = ['INVITATION_NOT_FOUND', 'INVITATION_TOKEN_EXPIRED', 'INVITATION_OWN'].includes(code);
      if (gone) { await clearPendingInvite(); onDone(); }
      toast(code === 'INVITATION_OWN' ? '내가 보낸 초대 링크예요. 상대가 열면 결과가 궁합 탭에 들어와요'
        : gone ? '초대 링크가 만료됐거나 꺼졌어요'
          : '궁합을 불러오지 못했어요. 잠시 후 다시 시도해 주세요');
    } finally {
      setBusy(null);
    }
  };

  return (
    <View>
      <Text style={[txt.h2, { textAlign: 'center' }]}>{invite.inviterNickname}님과 어떤 사이인가요?</Text>
      <Text style={[txt.small, { textAlign: 'center', marginTop: 6 }]}>고르면 관계에 맞는 궁합이 바로 나와요</Text>
      <View style={s.grid}>
        {RELATIONSHIPS.map(x => (
          <OptionChip key={x.k} compact style={s.cell} label={busy === x.k ? '궁합 보는 중…' : x.l} sub={x.hint} selected={busy === x.k} onPress={() => pick(x.k)} />
        ))}
      </View>
      <Text style={[txt.caption, { textAlign: 'center', marginTop: 12 }]}>
        {invite.inviterNickname}님에게도 내 이름과 둘의 궁합 결과가 보여요.{'\n'}서로의 생년월일은 보이지 않아요.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 18 },
  cell: { width: '48.9%' },
});
