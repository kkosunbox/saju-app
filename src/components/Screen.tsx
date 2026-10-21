import React from 'react';
import { ScrollView, StyleSheet, Text, View, ViewStyle, RefreshControlProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@/navigation/compat';
import { useTabBack } from '../navigation/tabBack';
import PressableScale from './PressableScale';
import Icon from './Icon';
import { colors, gradients } from '../theme/colors';
import { SCREEN_PX, txt } from '../theme/typography';

interface Props {
  children: React.ReactNode;
  title?: string;        // 상단 바 제목 (뒤로 가기 옆, 왼쪽 정렬)
  largeTitle?: string;   // 탭 화면 제목 — 디자인이 바뀌어 상단 바 제목과 같은 자리에 같은 크기로 쓴다
  subtitle?: string;     // 예전 큰 제목 아래 한 줄. 지금 디자인에는 자리가 없어 보여주지 않는다
  back?: boolean;
  scroll?: boolean;
  right?: React.ReactNode;
  contentStyle?: ViewStyle;
  bg?: string;
  /** 상단을 옅은 하늘색 그라디언트로 (콘텐츠 · 상담 대화) */
  sky?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  footer?: React.ReactNode; // 하단 고정 버튼 영역
  onBack?: () => void;      // 뒤로 가기를 화면 안 단계로 돌릴 때 (예: 결과 → 입력)
}

export default function Screen({ children, title, largeTitle, back, scroll = true, right, contentStyle, bg = colors.cream, sky, refreshControl, footer, onBack }: Props) {
  const nav = useNavigation();
  const tabBack = useTabBack();
  // 탭 화면(큰 제목)에도 뒤로 가기: 화면 안 단계 → 이전에 보던 탭 → 홈
  const showBack = back || !!largeTitle || !!onBack;
  const goBack = onBack ?? (largeTitle && !back ? tabBack : () => nav.goBack());
  const heading = title ?? largeTitle;
  const bar = (heading || showBack || right) && (
    <View style={s.bar}>
      {showBack ? (
        <PressableScale onPress={goBack} hitSlop={10} style={s.iconBtn} accessibilityLabel="뒤로 가기" scaleTo={0.9}>
          <Icon name="chevronLeft" size={24} strokeWidth={2} />
        </PressableScale>
      ) : null}
      <Text style={s.title} numberOfLines={1} accessibilityRole="header">{heading}</Text>
      {right ? <View style={s.right}>{right}</View> : null}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      {sky ? <LinearGradient pointerEvents="none" colors={gradients.skySoft} locations={[0, 0.64]} style={s.sky} /> : null}
      {bar}
      {scroll ? (
        <ScrollView contentContainerStyle={[s.content, contentStyle]} showsVerticalScrollIndicator={false} refreshControl={refreshControl} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
      )}
      {footer ? <View style={s.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  sky: { position: 'absolute', top: 0, left: 0, right: 0, height: 150 },
  bar: { height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: SCREEN_PX },
  iconBtn: { width: 32, height: 44, alignItems: 'flex-start', justifyContent: 'center' },
  title: { ...txt.h2, flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  content: { paddingHorizontal: SCREEN_PX, paddingTop: 8, paddingBottom: 40 },
  footer: { paddingHorizontal: SCREEN_PX, paddingTop: 8, paddingBottom: 12 },
});
