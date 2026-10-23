import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, TextInputProps, View, StyleProp, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { radius } from '../theme/typography';
import { profileLine, profileType } from '../theme/profileDesign';

interface Props extends TextInputProps { suffix?: string; containerStyle?: StyleProp<ViewStyle>; invalid?: boolean; compact?: boolean; variant?: 'default' | 'profile' }

/** 흰 입력창 — 포커스되면 하늘색 테두리. compact: 회색 카드 안의 낮은 칸(36) */
export default function TextField({ suffix, containerStyle, invalid, compact, variant = 'default', style, onFocus, onBlur, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[s.box, compact && s.compactBox, variant === 'profile' && s.profileBox, focused && s.focus, invalid && s.invalid, containerStyle]}>
      <TextInput
        {...rest}
        placeholderTextColor={colors.inkMute}
        onFocus={e => { setFocused(true); onFocus?.(e); }}
        onBlur={e => { setFocused(false); onBlur?.(e); }}
        style={[s.input, compact && s.compactInput, variant === 'profile' && s.profileInput, Platform.OS === 'web' && webInput, rest.multiline && { height: 96, paddingTop: 14, textAlignVertical: 'top' }, style]}
      />
      {suffix ? <Text style={s.suffix}>{suffix}</Text> : null}
    </View>
  );
}

/** 웹: 브라우저 기본 포커스 외곽선 제거 + input 기본 너비(size=20)로 칸이 넘치지 않게 */
const webInput = { outlineStyle: 'none', minWidth: 0, width: '100%' } as object;

const s = StyleSheet.create({
  profileBox: { borderRadius: 6, borderColor: profileLine, paddingRight: 0 },
  profileInput: { ...profileType(13, '500', 18.2), minHeight: 38, height: 38, paddingHorizontal: 12, paddingVertical: 0 },
  box: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cream, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.lineStrong, paddingRight: 14 },
  compactBox: { borderRadius: 6, borderColor: colors.surface, backgroundColor: colors.surface, paddingRight: 12 },
  compactInput: { minHeight: 36, paddingHorizontal: 12, fontSize: 13, letterSpacing: -0.3 },
  focus: { borderColor: colors.accent },
  invalid: { borderColor: colors.danger },
  input: { flex: 1, minHeight: 52, paddingHorizontal: 14, fontSize: 16, fontWeight: '500', letterSpacing: -0.4, color: colors.ink, fontVariant: ['tabular-nums'] },
  suffix: { fontSize: 15, fontWeight: '500', color: colors.inkMute },
});
