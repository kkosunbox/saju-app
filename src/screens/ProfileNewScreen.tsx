import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import PressableScale from '../components/PressableScale';
import ProfileRequestSheet from '../components/profile/ProfileRequestSheet';
import { colors } from '../theme/colors';
import { radius, txt } from '../theme/typography';
import { useApp } from '../context/AppContext';
import { usePremium } from '../context/PremiumContext';
import ProfileForm from '../components/profile/ProfileForm';

/** 프로필 추가 — 가족 · 친구 등 다른 사람의 정보를 직접 넣거나, 링크를 보내 받은 사람이 넣게 한다 */
/** 돌아갈 화면이 없으면(주소로 바로 연 경우) 마이 화면으로 */
const leave = () => (router.canGoBack() ? router.back() : router.replace('/my'));

export default function ProfileNewScreen() {
  const { saveProfile } = useApp();
  const { toast } = usePremium();
  const [asking, setAsking] = useState(false);
  return (
    <>
    <ProfileForm
      title="프로필 추가"
      hint="운세를 함께 볼 사람의 정보를 넣어 주세요. 모르는 항목은 비워 둬도 돼요."
      submitLabel="추가하기"
      relationship="other"
      onSubmit={async input => {
        const saved = await saveProfile(input);
        toast(`${saved.nickname}님 프로필을 추가했어요`);
        leave();
      }}
      onClose={leave}
      header={(
        <PressableScale onPress={() => setAsking(true)} style={s.ask} scaleTo={0.98} accessibilityRole="button" accessibilityLabel="링크로 정보 요청하기">
          <Text style={s.askTitle}>생년월일을 모른다면, 링크로 물어보기</Text>
          <Text style={s.askSub}>받은 사람이 직접 넣으면 목록에 바로 추가돼요</Text>
        </PressableScale>
      )}
    />
    <ProfileRequestSheet visible={asking} onClose={() => setAsking(false)} onSent={() => router.replace('/my')} />
    </>
  );
}

const s = StyleSheet.create({
  ask: { marginBottom: 24, paddingVertical: 14, paddingHorizontal: 16, borderRadius: radius.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.lineStrong, alignItems: 'center' },
  askTitle: { ...txt.small, color: colors.ink },
  askSub: { ...txt.caption, marginTop: 2 },
});
