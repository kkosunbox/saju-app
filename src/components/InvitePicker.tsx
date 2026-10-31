import React, { useState } from 'react';
import { Text, View } from 'react-native';
import PrimaryButton from './PrimaryButton';
import { useApp } from '../context/AppContext';
import { usePremium } from '../context/PremiumContext';
import { useNavigation } from '@/navigation/compat';
import { compatApi, compatKeys } from '../services/server/compatApi';
import { PendingInvite, clearPendingInvite } from '../services/share/linkShare';
import { queryClient } from '../api/query';
import { ApiError } from '../api/client';
import { RELATIONSHIP_INFO } from '../data/relationships';
import { txt } from '../theme/typography';

/**
 * 초대 링크에 저장된 관계로 궁합을 계산하고 결과 화면으로 간다.
 * 같은 결과가 초대한 사람의 궁합 탭에도 들어간다. 공개 링크면 궁합을 보는 게 서로의 프로필 공개 동의다
 * (초대한 사람은 링크를 보내며 공개했다). 공개 안내 전에 만든 링크는 예전처럼 서로 비공개.
 * onDone: 끝났거나(결과로 감) 더 쓸 수 없는 초대라 지웠을 때 · onDecline: 안 보기로 해 초대를 버렸을 때
 * replace: 이 화면을 결과 화면으로 바꾼다 (초대 화면)
 */
export default function InvitePicker({ invite, onDone, onDecline, replace }: { invite: PendingInvite; onDone(): void; onDecline(): void; replace?: boolean }) {
  const nav = useNavigation();
  const { user } = useApp();
  const { toast } = usePremium();
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    if (!user || busy) return;
    setBusy(true);
    try {
      const result = await compatApi.acceptInvite(user.id, invite.token);
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
      setBusy(false);
    }
  };
  const decline = async () => {
    if (busy) return;
    await clearPendingInvite();
    onDecline();
  };

  return (
    <View>
      <Text style={[txt.h2, { textAlign: 'center' }]}>{invite.inviterNickname}님과의 궁합을 볼까요?</Text>
      <Text style={[txt.small, { textAlign: 'center', marginTop: 6 }]}>{RELATIONSHIP_INFO[invite.relationship ?? 'lover'].label} 관계로 초대했어요. 둘의 궁합을 확인해 보세요.</Text>
      {invite.sharesProfile ? (
        <>
          <Text style={[txt.caption, { textAlign: 'center', marginTop: 20 }]}>
            궁합을 보면 {invite.inviterNickname}님과 서로의 생년월일·태어난 시간·출생지·MBTI이 공개되고,{'\n'}
            {invite.inviterNickname}님의 궁합 탭에도 둘의 궁합이 저장돼요.
          </Text>
          <PrimaryButton label={busy ? '궁합 보는 중…' : '공개에 동의하고 궁합 보기'} onPress={pick} disabled={busy} style={{ marginTop: 12 }} />
        </>
      ) : (
        <>
          <PrimaryButton label={busy ? '궁합 보는 중…' : '궁합 보기'} onPress={pick} disabled={busy} style={{ marginTop: 24 }} />
          <Text style={[txt.caption, { textAlign: 'center', marginTop: 12 }]}>
            {invite.inviterNickname}님에게도 내 이름과 둘의 궁합 결과가 보여요.{'\n'}서로의 생년월일은 보이지 않아요.
          </Text>
        </>
      )}
      <PrimaryButton label="안 볼래요" variant="text" onPress={decline} disabled={busy} style={{ marginTop: 4 }} />
    </View>
  );
}
