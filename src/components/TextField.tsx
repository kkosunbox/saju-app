import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View, StyleProp, ViewStyle } from 'react-native';
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
        style={[s.input, rest.multiline && { height: 96, paddingTop: 14, textAlignVertical: 'top' }, style]}
      />
      {suffix ? <Text style={s.suffix}>{suffix}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.line, paddingRight: 14 },
  focus: { borderColor: colors.purpleSoft, backgroundColor: '#FDFCFF' },
  invalid: { borderColor: colors.danger },
  input: { flex: 1, minHeight: 54, paddingHorizontal: 16, fontSize: 17, fontWeight: '600', color: colors.ink },
  suffix: { fontSize: 15, fontWeight: '600', color: colors.inkMute },
});
