import React, { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import BottomSheet from '../../components/BottomSheet';
import OptionChip from '../../components/OptionChip';
import PrimaryButton from '../../components/PrimaryButton';
import { useApp } from '../../context/AppContext';
import { usePremium } from '../../context/PremiumContext';
import { RELATIONSHIPS } from '../../data/relationships';
import { txt } from '../../theme/typography';
import { Relationship } from '../../types';
import { shareInvite } from './linkShare';

/** 모든 초대 공유 진입점에서, 보낼 상대와의 관계를 먼저 고른다. */
export function useInviteShare() {
  const { user } = useApp();
  const { toast } = usePremium();
  const [visible, setVisible] = useState(false);
  const [relationship, setRelationship] = useState<Relationship | null>(null);
  const [busy, setBusy] = useState(false);
  const sending = useRef(false);
  const send = async () => {
    if (!user || !relationship || sending.current) return;
    sending.current = true;
    setBusy(true);
    try {
      const result = await shareInvite(user.nickname, relationship);
      if (result === 'failed') toast('초대 링크를 만들지 못했어요. 잠시 후 다시 시도해 주세요');
      else {
        if (result === 'copied') toast('초대 링크를 복사했어요. 상대에게 보내 보세요');
        if (result !== 'cancelled') setVisible(false);
      }
    } finally {
      sending.current = false;
      setBusy(false);
    }
  };
  return {
    sendInvite: () => { setRelationship(null); setVisible(true); },
    inviteShareSheet: (
      <BottomSheet visible={visible} onClose={() => { if (!sending.current) setVisible(false); }}>
        <Text style={[txt.h2, { textAlign: 'center' }]}>어떤 사이의 궁합을 볼까요?</Text>
        <Text style={[txt.small, { textAlign: 'center', marginTop: 6 }]}>선택한 관계로 초대 링크를 만들어요.</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 20 }}>
          {RELATIONSHIPS.map(item => (
            <OptionChip key={item.k} compact style={{ width: '48%' }} label={item.l} sub={item.hint}
              selected={relationship === item.k} onPress={() => { if (!sending.current) setRelationship(item.k); }} />
          ))}
        </View>
        <PrimaryButton label={busy ? '초대 링크 만드는 중…' : '초대 링크 공유하기'} onPress={send} disabled={!relationship || busy} />
        <Text style={[txt.caption, { textAlign: 'center', marginTop: 12 }]}>
          링크를 연 사람과 서로의 생년월일·태어난 시간·출생지·MBTI이 공개돼요.
        </Text>
      </BottomSheet>
    ),
  };
}
