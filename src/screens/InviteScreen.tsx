import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from '../components/PrimaryButton';
import InvitePicker from '../components/InvitePicker';
import { useApp } from '../context/AppContext';
import { compatApi } from '../services/server/compatApi';
import { savePendingInvite } from '../services/share/linkShare';
import { ApiError } from '../api/client';
import { colors } from '../theme/colors';
import { fonts, txt } from '../theme/typography';
import { Relationship } from '../types';

type State = 'loading' | 'ready' | 'mine' | 'gone' | 'error';

/** 초대한 사람 이름과 이 링크를 어떻게 보여 줄지. 쓸 수 있는 초대면 대기 중인 초대로 저장한다. */
async function readInvite(token: string, hasProfile: boolean): Promise<{ who: string; state: State; relationship?: Relationship; sharesProfile?: boolean }> {
  try {
    const preview = await compatApi.previewInvite(token);
    const mine = hasProfile ? await compatApi.myInviteToken(preview.relationship).catch(() => null) : null;
    const who = preview.inviterNickname;
    if (mine === token) return { who, state: 'mine' };
    await savePendingInvite({ token, inviterNickname: who, relationship: preview.relationship, sharesProfile: preview.sharesProfile, auto: !hasProfile });
    return { who, state: 'ready', relationship: preview.relationship, sharesProfile: preview.sharesProfile };
  } catch (e) {
    const gone = e instanceof ApiError && ['INVITATION_NOT_FOUND', 'INVITATION_TOKEN_EXPIRED'].includes(e.code);
    return { who: '', state: gone ? 'gone' : 'error' };
  }
}

/**
 * 친구 궁합 초대 링크 (/invite/{token}). 서버에서 초대한 사람의 이름과 선택한 관계를 받는다.
 * - 프로필이 있으면 여기서 궁합 보기 버튼으로 결과로 간다.
 * - 없으면 대기 중인 초대로 저장하고 프로필 입력으로 간다 — 다 넣고 홈에 오면 궁합 보기 안내가 열린다.
 * - 내가 보낸 링크면 결과가 내 궁합 탭에 들어온다고 알려 준다.
 */
export default function InviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { user, editingProfile, onboarded, completeOnboarding } = useApp();
  const hasProfile = !!user && !editingProfile;
  const [state, setState] = useState<State>(token ? 'loading' : 'gone');
  const [who, setWho] = useState('');
  const [relationship, setRelationship] = useState<Relationship>();
  const [sharesProfile, setSharesProfile] = useState(false);

  const load = useCallback(() => {
    if (!token) return;
    readInvite(token, hasProfile).then(r => { setWho(r.who); setRelationship(r.relationship); setSharesProfile(!!r.sharesProfile); setState(r.state); });
  }, [token, hasProfile]);
  useEffect(load, [load]);
  const retry = () => { setState('loading'); load(); };

  /** 프로필이 없으면 웹 랜딩·온보딩 슬라이드를 건너뛰고 바로 내 정보 입력으로 */
  const enterProfile = async () => {
    if (!onboarded) await completeOnboarding();
    router.replace('/profile-setup');
  };

  if (state === 'loading') {
    return <SafeAreaView style={s.page}><ActivityIndicator color={colors.purple} /></SafeAreaView>;
  }

  const body = (() => {
    switch (state) {
      case 'ready':
        return hasProfile ? (
          <>
            <Text style={[txt.title, s.center]}>{who}님이{'\n'}궁합을 신청했어요</Text>
            <View style={s.picker}>
              <InvitePicker invite={{ token: token!, inviterNickname: who, relationship, sharesProfile }} onDone={() => {}} onDecline={() => router.replace('/')} replace />
            </View>
          </>
        ) : (
          <>
            <Text style={[txt.title, s.center]}>{who}님이{'\n'}궁합을 신청했어요</Text>
            <Text style={[txt.small, s.center, { marginTop: 8 }]}>내 생년월일만 넣으면 둘의 궁합이 바로 나와요.{'\n'}{who}님에게도 같은 결과가 전해져요.</Text>
            <PrimaryButton label="내 정보 넣고 궁합 보기" onPress={enterProfile} style={s.cta} />
          </>
        );
      case 'mine':
        return (
          <>
            <Text style={[txt.title, s.center]}>내가 보낸{'\n'}궁합 초대 링크예요</Text>
            <Text style={[txt.small, s.center, { marginTop: 8 }]}>상대가 이 링크를 열고 생년월일을 넣으면{'\n'}둘의 궁합 결과가 내 궁합 탭에 들어와요.</Text>
            <PrimaryButton label="궁합 탭으로 가기" onPress={() => router.replace('/compatibility')} style={s.cta} />
          </>
        );
      case 'error':
        return (
          <>
            <Text style={[txt.title, s.center]}>초대 링크를{'\n'}불러오지 못했어요</Text>
            <Text style={[txt.small, s.center, { marginTop: 8 }]}>인터넷 연결을 확인하고 다시 시도해 주세요.</Text>
            <PrimaryButton label="다시 시도" onPress={retry} style={s.cta} />
          </>
        );
      default:
        return (
          <>
            <Text style={[txt.title, s.center]}>초대 링크가 만료됐거나{'\n'}꺼졌어요</Text>
            <Text style={[txt.small, s.center, { marginTop: 8 }]}>보낸 사람에게 새 링크를 받아 주세요.</Text>
            <PrimaryButton label="운Pick 둘러보기" onPress={() => router.replace('/')} style={s.cta} />
          </>
        );
    }
  })();

  return (
    <SafeAreaView style={s.page}>
      <ScrollView contentContainerStyle={s.box}>
        <Text style={s.seal}>和</Text>
        {body}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  box: { flexGrow: 1, width: '100%', paddingHorizontal: 24, paddingVertical: 32, alignItems: 'center', justifyContent: 'center' },
  seal: { fontFamily: fonts.serif, fontSize: 44, color: colors.seal, marginBottom: 16 },
  center: { textAlign: 'center' },
  picker: { alignSelf: 'stretch', marginTop: 28 },
  cta: { marginTop: 28, alignSelf: 'stretch' },
});
