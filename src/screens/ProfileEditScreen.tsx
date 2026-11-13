import React from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../context/AppContext';
import { usePremium } from '../context/PremiumContext';
import ProfileForm from '../components/profile/ProfileForm';
import PrimaryButton from '../components/PrimaryButton';
import { colors } from '../theme/colors';
import { txt } from '../theme/typography';

/** 열려 있는 확인 창 (웹은 confirm) */
function confirm(title: string, message: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n${message}`));
  return new Promise(resolve => Alert.alert(title, message, [
    { text: '취소', style: 'cancel', onPress: () => resolve(false) },
    { text: '확인', style: 'destructive', onPress: () => resolve(true) },
  ]));
}

/**
 * 프로필 수정. /profile-edit 는 대표 프로필, /profiles/{id} 는 그 프로필.
 * 이미 열어 본 콘텐츠는 그때 정보 그대로 남고, 생년월일 · 시간 · 성별 · MBTI를 바꾸면 같은 콘텐츠를 새 정보로 다시 열 수 있다.
 */
export default function ProfileEditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user, profiles, saveUser, saveProfile, setPrimaryProfile, removeProfile } = useApp();
  const { toast } = usePremium();
  const profile = id ? profiles.find(p => String(p.profileId) === id) ?? null : user;
  if (!profile) return null;
  const back = () => (!id ? router.dismissTo('/my') : router.canGoBack() ? router.back() : router.replace('/my'));
  const others = profiles.length > 1;

  return (
    <ProfileForm
      key={profile.profileId}
      initial={profile}
      title={profile.isPrimary && !id ? '프로필을 확인해 주세요' : `${profile.nickname}님 프로필`}
      hint="바꿀 항목은 눌러서 고칠 수 있어요. 이미 본 콘텐츠는 그때 정보 그대로 남아요."
      relationship={others || id ? profile.relationship ?? 'self' : undefined}
      onSubmit={async input => {
        if (!id) await saveUser(input);
        else await saveProfile(input, profile.profileId);
        toast('프로필을 저장했어요');
        back();
      }}
      onClose={back}
      footer={id ? (
        <View style={s.footer}>
          {!profile.isPrimary ? (
            <>
              <PrimaryButton label="대표 프로필로 정하기" variant="soft" onPress={async () => {
                await setPrimaryProfile(profile.profileId!);
                toast(`${profile.nickname}님이 대표 프로필이 됐어요`);
                back();
              }} />
              <Text style={[txt.caption, s.note]}>오늘의 운세와 새로 시작하는 운알톡이 이 프로필로 바뀌어요</Text>
              <PrimaryButton label="프로필 지우기" variant="text" labelStyle={{ color: colors.danger }} onPress={async () => {
                if (!(await confirm('프로필을 지울까요?', '이 프로필로 연 풀이도 함께 지워지고 되돌릴 수 없어요.'))) return;
                await removeProfile(profile.profileId!);
                toast('프로필을 지웠어요');
                back();
              }} style={{ marginTop: 8 }} />
            </>
          ) : <Text style={[txt.caption, s.note]}>대표 프로필은 오늘의 운세와 운알톡의 기준이에요</Text>}
        </View>
      ) : null}
    />
  );
}

const s = StyleSheet.create({
  footer: { marginTop: 24 },
  note: { textAlign: 'center', marginTop: 8 },
});
