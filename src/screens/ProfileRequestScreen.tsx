/**
 * 프로필 요청 링크 (/p/{token}) — 링크를 받은 사람이 자기 정보를 넣는 화면.
 * 넣은 정보는 요청한 사람의 프로필 목록에 추가되고(그 뒤 서로 고쳐도 영향 없음),
 * 아직 프로필이 없으면 같은 정보로 내 프로필도 만들어져 바로 운Pick을 쓰기 시작한다 (계정이 없으면 게스트로).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../context/AppContext';
import { usePremium } from '../context/PremiumContext';
import ProfileForm from '../components/profile/ProfileForm';
import PrimaryButton from '../components/PrimaryButton';
import LinkStateLayout from '../components/LinkStateLayout';
import { ApiError } from '../api/client';
import { getTokens } from '../api/tokens';
import { authApi } from '../services/server/authApi';
import { ProfileRequestPreview, profileRequestApi } from '../services/server/profileRequestApi';
import { RELATIONSHIP_LABEL } from '../types';
import { colors } from '../theme/colors';
import { txt } from '../theme/typography';

type State = 'loading' | 'ready' | 'used' | 'gone' | 'error' | 'mine';

const stateOf = (e: unknown): State =>
  e instanceof ApiError
    ? e.code === 'INVITATION_ALREADY_ACCEPTED' ? 'used'
      : e.code === 'INVITATION_OWN' ? 'mine'
        : e.status === 404 || e.code === 'INVITATION_TOKEN_EXPIRED' ? 'gone' : 'error'
    : 'error';

export default function ProfileRequestScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { user, onboarded, completeOnboarding, reloadSession } = useApp();
  const { toast } = usePremium();
  const [state, setState] = useState<State>(token ? 'loading' : 'gone');
  const [request, setRequest] = useState<ProfileRequestPreview | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    profileRequestApi.preview(token)
      .then(r => { setRequest(r); setState('ready'); })
      .catch(e => setState(stateOf(e)));
  }, [token]);
  useEffect(load, [load]);

  if (state === 'loading') {
    return <SafeAreaView style={s.page}><ActivityIndicator color={colors.purple} /></SafeAreaView>;
  }
  if (state === 'ready' && request) {
    const who = request.requesterNickname;
    return (
      <ProfileForm
        initial={user && !request.nickname ? user : null}
        initialNickname={request.nickname ?? undefined}
        title={`${who}님이 정보를 물어봐요`}
        hint={`넣은 정보는 ${who}님의 운Pick에 ${RELATIONSHIP_LABEL[request.relationship] === '기타' ? '' : `'${RELATIONSHIP_LABEL[request.relationship]}'(으)로 `}추가돼요. ${user ? '' : '나도 같은 정보로 내 운세를 바로 볼 수 있어요.'}`}
        submitLabel={`${who}님에게 보내기`}
        onSubmit={async input => {
          try {
            if (!(await getTokens())) await authApi.startGuest();
            const me = await authApi.me();
            const r = await profileRequestApi.answer(me.id, token!, input);
            if (!onboarded) await completeOnboarding();
            await reloadSession();
            toast(r.createdOwn ? `${who}님에게 보냈어요. 이제 내 운세도 볼 수 있어요` : `${who}님에게 보냈어요`);
            router.replace('/');
          } catch (e) {
            const next = stateOf(e);
            if (next !== 'error') { setState(next); return; }
            throw e;
          }
        }}
        onClose={() => router.replace('/')}
      />
    );
  }

  const body = (() => {
    switch (state) {
      case 'used':
        return (
          <>
            <Text accessibilityRole="header" style={s.title}>이미 정보를{'\n'}보낸 링크예요</Text>
            <Text style={s.description}>링크는 한 번만 쓸 수 있어요. 다시 보내려면 새 링크를 받아 주세요.</Text>
          </>
        );
      case 'mine':
        return (
          <>
            <Text accessibilityRole="header" style={s.title}>내가 보낸{'\n'}요청 링크예요</Text>
            <Text style={s.description}>받은 사람이 정보를 넣으면 프로필 목록에 추가돼요.</Text>
          </>
        );
      case 'error':
        return (
          <>
            <Text accessibilityRole="header" style={s.title}>요청을{'\n'}불러오지 못했어요</Text>
            <Text style={s.description}>인터넷 연결을 확인하고 다시 시도해 주세요.</Text>
            <PrimaryButton label="다시 시도" onPress={() => { setState('loading'); load(); }} style={s.cta} />
          </>
        );
      default:
        return (
          <>
            <Text accessibilityRole="header" style={s.title}>이 링크는 지금{'\n'}쓸 수 없어요</Text>
            <Text style={s.description}>링크가 만료되었거나 공유가 종료됐어요.{'\n'}보낸 사람에게 새 링크를 부탁해 주세요.</Text>
          </>
        );
    }
  })();

  return (
    <LinkStateLayout>
      {body}
      <PrimaryButton label="운Pick 둘러보기" variant={state === 'error' ? 'soft' : 'solid'} onPress={() => router.replace('/')} style={s.cta} />
    </LinkStateLayout>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  title: { ...txt.title, fontSize: 26, lineHeight: 36, textAlign: 'center' },
  description: { ...txt.body, textAlign: 'center', marginTop: 12, lineHeight: 22 },
  cta: { marginTop: 28, alignSelf: 'stretch' },
});
