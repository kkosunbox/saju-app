import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from '../components/PrimaryButton';
import { compatApi } from '../services/server/compatApi';
import { savePendingInvite } from '../services/share/linkShare';
import { colors } from '../theme/colors';
import { fonts, txt } from '../theme/typography';

/**
 * 친구 궁합 초대 링크 (/invite/{token}).
 * 서버에서 초대한 사람의 이름만 받아 대기 중인 초대로 저장하고 홈으로 보낸다.
 * 프로필이 없으면 온보딩·프로필 입력을 거쳐 홈에서 "궁합 보기"를 누르면 서버가 계산한다.
 */
export default function InviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [state, setState] = useState<'loading' | 'ready' | 'gone'>(token ? 'loading' : 'gone');
  const [who, setWho] = useState('');

  useEffect(() => {
    if (!token) return;
    compatApi.previewInvite(token)
      .then(async preview => {
        setWho(preview.inviterNickname);
        await savePendingInvite({ token, inviterNickname: preview.inviterNickname });
        setState('ready');
      })
      .catch(() => setState('gone'));
  }, [token]);

  return (
    <SafeAreaView style={s.page}>
      {state === 'loading' ? <ActivityIndicator color={colors.purple} /> : (
        <View style={s.box}>
          <Text style={s.seal}>和</Text>
          <Text style={[txt.title, { textAlign: 'center' }]}>
            {state === 'ready' ? `${who}님이\n궁합을 신청했어요` : '초대 링크가 만료됐거나\n꺼졌어요'}
          </Text>
          <Text style={[txt.small, { textAlign: 'center', marginTop: 8 }]}>
            {state === 'ready' ? '내 생일만 넣으면 둘의 궁합이 바로 나와요.' : '보낸 사람에게 새 링크를 받아 주세요.'}
          </Text>
          <PrimaryButton label={state === 'ready' ? '궁합 보러 가기' : '운Pick 둘러보기'} onPress={() => router.replace('/')} style={{ marginTop: 28, alignSelf: 'stretch' }} />
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  box: { width: '100%', paddingHorizontal: 24, alignItems: 'center' },
  seal: { fontFamily: fonts.serif, fontSize: 44, color: colors.seal, marginBottom: 16 },
});
