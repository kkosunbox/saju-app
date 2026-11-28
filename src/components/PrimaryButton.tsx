import React from 'react';
import { Link } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, TextStyle, ViewStyle, StyleProp, View } from 'react-native';
import PressableScale from './PressableScale';
import { colors, isDark } from '../theme/colors';
import { radius } from '../theme/typography';
import { profileType } from '../theme/profileDesign';

interface Props { label: string; onPress?(): void; externalHref?: `https://${string}`; disabled?: boolean; variant?: 'solid' | 'soft' | 'outline' | 'text'; style?: StyleProp<ViewStyle>; icon?: React.ReactNode; trailing?: React.ReactNode; small?: boolean; size?: 'default' | 'medium'; labelStyle?: StyleProp<TextStyle> }

/** 단색 먹남색 버튼 */
/** small: 카드 안에 들어가는 40 높이 버튼 */
export default function PrimaryButton({ label, onPress, externalHref, disabled, variant = 'solid', style, icon, trailing, small, size = 'default', labelStyle }: Props) {
  const solid = variant === 'solid';
  const content = (
    <View style={[s.inner, size === 'medium' && { height: 48 }, small && s.small, solid ? { backgroundColor: disabled ? (size === 'medium' && !isDark ? '#DEDEDE' : colors.lavender) : colors.navy } : variant === 'soft' ? { backgroundColor: colors.card } : variant === 'outline' ? s.outline : null]}>
      {icon}<Text style={[s.label, size === 'medium' && profileType(14, '500', 17, 0, colors.white), small && { fontSize: 14, fontWeight: '500' }, !solid ? { color: colors.ink } : disabled ? { color: colors.inkMute } : null, labelStyle]}>{label}</Text>{trailing}
    </View>
  );
  if (externalHref && !disabled) {
    const externalAttrs = { target: '_blank', rel: 'noopener noreferrer' };
    return (
      <Link href={externalHref} asChild onPress={onPress}>
        <Pressable
          {...(Platform.OS === 'web' ? { hrefAttrs: externalAttrs } : {})}
          accessibilityRole="link"
          accessibilityLabel={label}
          style={StyleSheet.flatten([s.wrap, style])}
        >
          {content}
        </Pressable>
      </Link>
    );
  }
  return (
    <PressableScale onPress={onPress} disabled={disabled} haptic={solid} style={[s.wrap, style]} accessibilityState={{ disabled }}>
      {content}
    </PressableScale>
  );
}

const s = StyleSheet.create({
  wrap: { borderRadius: radius.md },
  inner: { height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  outline: { borderWidth: 1, borderColor: colors.lineStrong, backgroundColor: colors.surface },
  small: { height: 40 },
  label: { color: colors.white, fontSize: 15, fontWeight: '600', letterSpacing: -0.5 },
});
