/**
 * 정보 요청 링크 보내기 시트 — 관계와 (선택) 이름을 고르면 링크를 만들어 보낸다.
 * 받은 사람이 직접 정보를 넣으면 내 프로필 목록에 추가된다. 마이 · 프로필 추가 화면이 함께 쓴다.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import BottomSheet from '../BottomSheet';
import OptionChip from '../OptionChip';
import PrimaryButton from '../PrimaryButton';
import { useApp } from '../../context/AppContext';
import { usePremium } from '../../context/PremiumContext';
import { profileRequestKeys, shareProfileRequest } from '../../services/server/profileRequestApi';
import { ProfileRelationship, RELATIONSHIP_LABEL } from '../../types';
import { colors } from '../../theme/colors';
import { radius, txt } from '../../theme/typography';

const REQUEST_RELATIONSHIPS: ProfileRelationship[] = ['lover', 'spouse', 'parent', 'child', 'sibling', 'friend', 'work', 'other'];

/** onSent: 링크를 보냈을 때 (시트는 스스로 닫힌다) */
export default function ProfileRequestSheet({ visible, onClose, onSent }: { visible: boolean; onClose(): void; onSent?(): void }) {
  const { user } = useApp();
  const { toast } = usePremium();
  const qc = useQueryClient();
  const [relationship, setRelationship] = useState<ProfileRelationship>('parent');
  const [name, setName] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    setSending(true);
    const r = await shareProfileRequest(user?.nickname ?? '', relationship, name.trim() || null);
    setSending(false);
    if (r === 'failed') return toast('링크를 만들지 못했어요. 잠시 후 다시 시도해 주세요');
    if (r === 'cancelled') return;
    setName('');
    onClose();
    void qc.invalidateQueries({ queryKey: profileRequestKeys.open });
    toast(r === 'copied' ? '링크를 복사했어요. 받은 사람이 입력하면 목록에 추가돼요' : '받은 사람이 입력하면 목록에 추가돼요');
    onSent?.();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View>
        <Text style={txt.h2}>누구에게 물어볼까요?</Text>
        <Text style={[txt.small, { marginTop: 4 }]}>링크를 보내면 받은 사람이 직접 정보를 넣어요.</Text>
        <View style={s.chips}>
          {REQUEST_RELATIONSHIPS.map(r => (
            <OptionChip key={r} compact style={s.chip} label={RELATIONSHIP_LABEL[r]} selected={relationship === r} onPress={() => setRelationship(r)} />
          ))}
        </View>
        <TextInput
          value={name}
          onChangeText={setName}
          maxLength={12}
          placeholder="받을 사람 이름 (선택)"
          placeholderTextColor={colors.inkMute}
          style={s.input}
          accessibilityLabel="받을 사람 이름"
        />
        <PrimaryButton label={sending ? '링크 만드는 중…' : '링크 보내기'} onPress={send} disabled={sending} style={{ marginTop: 16 }} />
        <PrimaryButton label="취소" variant="soft" onPress={onClose} style={{ marginTop: 8 }} />
      </View>
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  chip: { width: '31%' },
  input: { ...txt.body, color: colors.ink, marginTop: 16, height: 44, paddingHorizontal: 12, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line },
});
