import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import BottomSheet from '../../components/BottomSheet';
import PrimaryButton from '../../components/PrimaryButton';
import PressableScale from '../../components/PressableScale';
import { Amount } from '../../components/Amount';
import { SOCIAL_PROVIDERS, SocialCircle } from '../../components/auth/AuthKit';
import { clearLoginIntent, subscribeLoginPrompt, type LoginPrompt } from '../../services/loginIntent';
import { trackAction } from '../../services/screenViews';
import { colors } from '../../theme/colors';
import { txt } from '../../theme/typography';

/** 막힌 이유에 맞춘 제목·설명 — 왜 지금 가입해야 하는지 한 줄로 */
function copyOf(p: LoginPrompt): { title: string; body: string } {
  const i = p.intent;
  if (i?.kind === 'consult') return { title: '가입하고 질문을 보내 볼까요?', body: '적어 둔 질문은 가입하면 운알이에게 바로 보내 드려요.' };
  if (i?.kind === 'unlock') return { title: '가입하고 이어서 볼까요?', body: `'${i.title}', 가입하면 바로 열어 볼 수 있어요.` };
  if (p.reason === 'charge') return { title: '가입하고 알을 충전해요', body: '충전한 알은 내 계정에 안전하게 쌓여요.' };
  if (p.reason === 'attend') return { title: '가입하고 출석 체크해요', body: '매일 출석하면 알이 차곡차곡 쌓여요.' };
  return { title: '가입이 필요해요', body: '가입하면 내 풀이와 알을 어디서든 이어 볼 수 있어요.' };
}

/**
 * 게스트가 막힌 순간(유료 콘텐츠·충전·출석·운알톡) 전체 로그인 화면 대신 띄우는 하단 시트.
 * 이유를 먼저 알려 주고, 소셜 가입 버튼을 바로 둬서 단계를 늘리지 않는다. 앱 맨 위에 하나만 둔다.
 */
export function LoginPromptHost() {
  const [prompt, setPrompt] = useState<LoginPrompt | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => subscribeLoginPrompt(p => {
    setPrompt(p);
    setOpen(true);
    trackAction(`login_prompt_shown_${p.intent?.kind ?? p.reason ?? 'default'}`);
  }), []);

  const go = (href: Parameters<typeof router.push>[0], action: string) => {
    trackAction(action);
    setOpen(false);
    router.push(href);
  };
  const later = () => {
    trackAction('login_prompt_later');
    clearLoginIntent();
    setOpen(false);
  };
  const c = prompt ? copyOf(prompt) : null;

  return (
    <BottomSheet visible={open} onClose={later}>
      {c ? (
        <View style={s.body}>
          <Text style={[txt.h2, s.center]} accessibilityRole="header">{c.title}</Text>
          <Text style={[txt.small, s.center, s.desc]}>{c.body}</Text>
          <View style={s.reward} accessible accessibilityLabel="SNS로 처음 가입하면 50알을 드려요">
            <Text style={s.rewardText}>SNS로 처음 가입하면</Text>
            <Amount value={50} after="을" size={14} style={s.rewardText} />
            <Text style={s.rewardText}>드려요</Text>
          </View>
          <View style={s.social}>
            {SOCIAL_PROVIDERS.map(provider => (
              <SocialCircle key={provider} provider={provider}
                onPress={() => go({ pathname: '/login/social/[provider]', params: { provider } }, `login_prompt_click_${provider}`)} />
            ))}
          </View>
          <PressableScale onPress={() => go('/login/email', 'login_prompt_click_email')} hitSlop={8} style={s.email}>
            <Text style={s.emailText}>이메일로 시작하기</Text>
          </PressableScale>
          <PrimaryButton label="나중에" variant="text" onPress={later} />
        </View>
      ) : null}
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  body: { alignItems: 'stretch' },
  center: { textAlign: 'center' },
  desc: { marginTop: 6 },
  reward: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', columnGap: 4, marginTop: 22 },
  rewardText: { fontSize: 14, lineHeight: 20, fontWeight: '700', color: colors.ink },
  social: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14, marginTop: 14 },
  email: { alignSelf: 'center', marginTop: 20, marginBottom: 6 },
  emailText: { fontSize: 14, fontWeight: '600', color: colors.inkSub, textDecorationLine: 'underline' },
});
