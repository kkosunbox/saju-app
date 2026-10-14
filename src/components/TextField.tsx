import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, TextInputProps, View, StyleProp, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { radius } from '../theme/typography';

interface Props extends TextInputProps { suffix?: string; containerStyle?: StyleProp<ViewStyle>; invalid?: boolean }

/** 포커스되면 보라 테두리 + 라벤더 배경으로 바뀌는 입력창 */
export default function TextField({ suffix, containerStyle, invalid, style, onFocus, onBlur, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[s.box, focused && s.focus, invalid && s.invalid, containerStyle]}>
      <TextInput
        {...rest}
        placeholderTextColor={colors.inkMute}
        onFocus={e => { setFocused(true); onFocus?.(e); }}
        onBlur={e => { setFocused(false); onBlur?.(e); }}
        style={[s.input, Platform.OS === 'web' && webInput, rest.multiline && { height: 96, paddingTop: 14, textAlignVertical: 'top' }, style]}
      />
      {suffix ? <Text style={s.suffix}>{suffix}</Text> : null}
    </View>
  );
}

/** 웹: 브라우저 기본 포커스 외곽선 제거 + input 기본 너비(size=20)로 칸이 넘치지 않게 */
const webInput = { outlineStyle: 'none', minWidth: 0, width: '100%' } as object;

const s = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.lineStrong, paddingRight: 14 },
  focus: { borderColor: colors.purple },
  invalid: { borderColor: colors.danger },
  input: { flex: 1, minHeight: 52, paddingHorizontal: 14, fontSize: 17, fontWeight: '500', color: colors.ink, fontVariant: ['tabular-nums'] },
  suffix: { fontSize: 15, fontWeight: '500', color: colors.inkMute },
});
