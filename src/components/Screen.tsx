import React from 'react';
import { ScrollView, StyleSheet, Text, View, ViewStyle, RefreshControlProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@/navigation/compat';
import { useTabBack } from '../navigation/tabBack';
import PressableScale from './PressableScale';
import Icon from './Icon';
import { colors } from '../theme/colors';
import { SCREEN_PX, txt } from '../theme/typography';

interface Props {
  children: React.ReactNode;
  title?: string;        // 상단 바 가운데 제목 (상세 화면)
  largeTitle?: string;   // 탭 화면의 큰 제목
  subtitle?: string;
  back?: boolean;
  scroll?: boolean;
  right?: React.ReactNode;
  contentStyle?: ViewStyle;
  bg?: string;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  footer?: React.ReactNode; // 하단 고정 버튼 영역
  onBack?: () => void;      // 뒤로 가기를 화면 안 단계로 돌릴 때 (예: 결과 → 입력)
}

export default function Screen({ children, title, largeTitle, subtitle, back, scroll = true, right, contentStyle, bg = colors.cream, refreshControl, footer, onBack }: Props) {
  const nav = useNavigation();
  const tabBack = useTabBack();
  // 탭 화면(큰 제목)에도 뒤로 가기: 화면 안 단계 → 이전에 보던 탭 → 홈
  const showBack = back || !!largeTitle || !!onBack;
  const goBack = onBack ?? (largeTitle && !back ? tabBack : () => nav.goBack());
  const bar = (title || showBack || right) && (
    <View style={s.bar}>
      {showBack ? (
        <PressableScale onPress={goBack} hitSlop={10} style={s.iconBtn} accessibilityLabel="뒤로 가기" scaleTo={0.9}>
          <Icon name="chevronLeft" size={24} />
        </PressableScale>
      ) : <View style={s.iconBtn} />}
      <Text style={txt.h3} numberOfLines={1}>{title}</Text>
      <View style={s.iconBtn}>{right}</View>
    </View>
  );
  const head = largeTitle ? (
    <View style={s.largeHead}>
      <Text style={txt.title} accessibilityRole="header">{largeTitle}</Text>
      {subtitle ? <Text style={[txt.body, { marginTop: 4 }]}>{subtitle}</Text> : null}
    </View>
  ) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      {bar}
      {scroll ? (
        <ScrollView contentContainerStyle={[s.content, contentStyle]} showsVerticalScrollIndicator={false} refreshControl={refreshControl} keyboardShouldPersistTaps="handled">
          {head}
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, contentStyle]}>{head}{children}</View>
      )}
      {footer ? <View style={s.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  bar: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  largeHead: { paddingTop: 2, paddingBottom: 20 },
  content: { paddingHorizontal: SCREEN_PX, paddingBottom: 32 },
  footer: { paddingHorizontal: SCREEN_PX, paddingTop: 8, paddingBottom: 12 },
});
