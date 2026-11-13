import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from './Mascot';
import MascotShadow from './MascotShadow';
import ResultMascot from './ResultMascot';
import { colors } from '../theme/colors';
import { txt } from '../theme/typography';

/** 공유 링크의 안내 화면. 작은 화면과 큰 글씨에서는 전체 내용이 함께 스크롤된다. */
export default function LinkStateLayout({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={s.page}>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
        <View style={s.container}>
          <View style={s.brand} accessible accessibilityRole="image" accessibilityLabel="운Pick">
            <Logo height={58} color={colors.ink} />
          </View>
          <View style={s.content}>
            <View style={s.illustration} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <View style={s.mascot}>
                <MascotShadow size={156} />
                <ResultMascot size={156} pose="question" accessible={false} />
              </View>
            </View>
            {children}
          </View>
          <Text style={s.footer}>오늘의 나를 알아가는 작은 즐거움</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, alignItems: 'center' },
  container: { flexGrow: 1, width: '100%', maxWidth: 440, paddingHorizontal: 28, paddingTop: 20, paddingBottom: 24 },
  brand: { alignSelf: 'flex-start' },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 28, paddingBottom: 88 },
  illustration: { width: 224, height: 208, alignItems: 'center', justifyContent: 'flex-end', marginBottom: 28 },
  mascot: { width: 156 * 1.08, height: 156, marginBottom: 12 },
  footer: { ...txt.caption, textAlign: 'center', color: colors.inkMute },
});
