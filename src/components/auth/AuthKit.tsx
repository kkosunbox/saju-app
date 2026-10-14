/** 로그인·회원가입 공용 UI — 소셜 버튼, 체크박스 행, 오류 문구, 구분선 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import PressableScale from '../PressableScale';
import Icon from '../Icon';
import { colors } from '../../theme/colors';
import { radius, txt } from '../../theme/typography';
import { SOCIAL_LABEL, SocialProvider } from '../../services/auth/authService';

/** 브랜드 심볼 */
export function Mark({ provider, size = 22 }: { provider: SocialProvider; size?: number }) {
  if (provider === 'kakao') return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 3.5c-5.25 0-9.5 3.33-9.5 7.44 0 2.66 1.78 5 4.46 6.31l-.98 3.6c-.09.32.27.58.55.39l4.27-2.84c.4.04.79.06 1.2.06 5.25 0 9.5-3.33 9.5-7.52S17.25 3.5 12 3.5z" fill="#191919" />
    </Svg>
  );
  if (provider === 'naver') return (
    <Svg width={size * 0.72} height={size * 0.72} viewBox="0 0 20 20">
      <Path d="M13.56 10.7 6.17 0H0v20h6.44V9.3L13.83 20H20V0h-6.44z" fill="#FFFFFF" />
    </Svg>
  );
  if (provider === 'apple') return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M16.37 12.6c-.02-2.16 1.77-3.2 1.85-3.25-1.01-1.47-2.58-1.68-3.13-1.7-1.33-.13-2.6.79-3.28.79-.68 0-1.72-.77-2.83-.75-1.45.02-2.8.85-3.55 2.15-1.52 2.63-.39 6.52 1.09 8.66.72 1.04 1.58 2.21 2.7 2.17 1.09-.04 1.5-.7 2.81-.7 1.31 0 1.68.7 2.83.68 1.17-.02 1.91-1.06 2.62-2.11.83-1.21 1.17-2.38 1.19-2.44-.03-.01-2.28-.87-2.3-3.46zM14.22 6.26c.6-.73 1-1.73.89-2.74-.86.04-1.9.57-2.52 1.3-.55.64-1.04 1.67-.91 2.65.96.07 1.94-.49 2.54-1.21z" fill="#FFFFFF" />
    </Svg>
  );
  return (
    <Svg width={size * 0.86} height={size * 0.86} viewBox="0 0 24 24">
      <Path d="M22.5 12.24c0-.77-.07-1.5-.2-2.2H12v4.17h5.9a5.05 5.05 0 0 1-2.19 3.31v2.75h3.54c2.07-1.91 3.25-4.72 3.25-8.03z" fill="#4285F4" />
      <Path d="M12 23c2.96 0 5.45-.98 7.26-2.66l-3.54-2.75c-.98.66-2.24 1.05-3.72 1.05-2.86 0-5.28-1.93-6.15-4.53H2.2v2.84A11 11 0 0 0 12 23z" fill="#34A853" />
      <Path d="M5.85 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.2a11 11 0 0 0 0 9.9l3.65-2.84z" fill="#FBBC05" />
      <Path d="M12 5.38c1.61 0 3.06.55 4.2 1.64l3.14-3.14A10.97 10.97 0 0 0 12 1 11 11 0 0 0 2.2 7.05l3.65 2.84C6.72 7.3 9.14 5.38 12 5.38z" fill="#EA4335" />
    </Svg>
  );
}

const BRAND: Record<SocialProvider, { bg: string; fg: string; border?: string }> = {
  kakao: { bg: '#FEE500', fg: 'rgba(0,0,0,0.85)' },
  naver: { bg: '#03C75A', fg: '#FFFFFF' },
  apple: { bg: '#000000', fg: '#FFFFFF' },
  google: { bg: '#FFFFFF', fg: '#1F1F1F', border: '#DADCE0' },
};

/** 원형 소셜 로그인 아이콘 버튼 (첫 화면) */
export function SocialCircle({ provider, onPress }: { provider: SocialProvider; onPress(): void }) {
  const b = BRAND[provider];
  return (
    <PressableScale onPress={onPress} scaleTo={0.92} style={[s.circle, { backgroundColor: b.bg }, b.border ? { borderWidth: 1, borderColor: b.border } : null]} accessibilityRole="button" accessibilityLabel={`${SOCIAL_LABEL[provider]}로 시작하기`}>
      <Mark provider={provider} size={24} />
    </PressableScale>
  );
}

/** 가로로 긴 소셜 버튼 (동의 화면) */
export function SocialButton({ provider, onPress, label }: { provider: SocialProvider; onPress(): void; label?: string }) {
  const b = BRAND[provider];
  const text = label ?? `${SOCIAL_LABEL[provider]}로 시작하기`;
  return (
    <PressableScale onPress={onPress} style={[s.social, { backgroundColor: b.bg }, b.border ? { borderWidth: 1, borderColor: b.border } : null]} accessibilityRole="button" accessibilityLabel={text}>
      <View style={s.socialIco}><Mark provider={provider} size={20} /></View>
      <Text style={[s.socialText, { color: b.fg }]}>{text}</Text>
    </PressableScale>
  );
}

export function OrDivider({ label }: { label: string }) {
  return (
    <View style={s.or}>
      <View style={s.orLine} />
      <Text style={txt.caption}>{label}</Text>
      <View style={s.orLine} />
    </View>
  );
}

/** 체크박스 + 문구 (+ 오른쪽 "보기") */
export function CheckRow({ checked, onPress, label, strong, onView }: { checked: boolean; onPress(): void; label: string; strong?: boolean; onView?(): void }) {
  return (
    <View style={s.checkRow}>
      <PressableScale onPress={onPress} style={s.checkHit} scaleTo={0.98} accessibilityRole="checkbox" accessibilityState={{ checked }} accessibilityLabel={label}>
        <View style={[s.box, checked && s.boxOn]}>{checked ? <Icon name="check" size={14} color={colors.white} strokeWidth={3} /> : null}</View>
        <Text style={[s.checkText, strong && { fontWeight: '700', color: colors.ink }]}>{label}</Text>
      </PressableScale>
      {onView ? <PressableScale onPress={onView} hitSlop={8}><Text style={s.view}>보기</Text></PressableScale> : null}
    </View>
  );
}

export function FieldError({ children }: { children?: string | null }) {
  if (!children) return null;
  return <Text style={s.err} accessibilityLiveRegion="polite">{children}</Text>;
}

export function FieldLabel({ children }: { children: string }) {
  return <Text style={s.label}>{children}</Text>;
}

/** 데모 안내 상자 */
export function DemoNote({ children }: { children: React.ReactNode }) {
  return (
    <View style={s.demo}>
      <Text style={s.demoTag}>데모</Text>
      <Text style={s.demoText}>{children}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  circle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  social: { height: 52, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  socialIco: { position: 'absolute', left: 18 },
  socialText: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  or: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 22 },
  orLine: { flex: 1, height: 1, backgroundColor: colors.line },
  checkRow: { flexDirection: 'row', alignItems: 'center', minHeight: 40 },
  checkHit: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.lineStrong, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  checkText: { flex: 1, fontSize: 14, color: colors.inkSub, fontWeight: '500' },
  view: { fontSize: 13, color: colors.inkMute, textDecorationLine: 'underline' },
  err: { color: colors.danger, fontSize: 12, marginTop: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.inkSub, marginBottom: 8 },
  demo: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: colors.lavenderSoft, borderRadius: radius.md, padding: 12, borderLeftWidth: 3, borderLeftColor: colors.seal },
  demoTag: { fontSize: 11, fontWeight: '700', color: colors.seal, marginTop: 1 },
  demoText: { flex: 1, fontSize: 13, lineHeight: 19, color: colors.inkSub },
});
