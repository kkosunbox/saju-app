import { useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Image, type ImageProps } from 'expo-image';
import PrimaryButton from '../../components/PrimaryButton';
import { Stream, StreamBlock, StreamText } from '../../components/Stream';
import { colors } from '../../theme/colors';
import { sansW, SCREEN_PX } from '../../theme/typography';

export const consultMascotSize = { width: 215, height: 144 };

function consultGreeting(nickname: string) {
  return [
    `${nickname}님, 요즘 마음에 걸리는 일이 있나요?`,
    `${nickname}님을 잘 아는 운알이가 함께 고민해 줄게요.`,
    '편하게 대화해보세요.',
  ] as const;
}

export default function ConsultWelcomeIntro({ mascot, nickname, opacity, reducedMotion, leaving, onContinue }: {
  mascot: ImageProps['source'];
  nickname: string;
  opacity: Animated.Value;
  reducedMotion: boolean;
  leaving: boolean;
  onContinue(): void;
}) {
  const { width, height } = useWindowDimensions();
  const [mascotReady, setMascotReady] = useState(false);
  const showGreeting = () => setMascotReady(true);
  const ratio = consultMascotSize.width / consultMascotSize.height;
  const mascotWidth = Math.min(350, width - SCREEN_PX * 2, height * 0.34 * ratio);

  return (
    <Animated.View testID="consult-welcome-intro" style={[s.overlay, { opacity }]} pointerEvents={leaving ? 'none' : 'auto'}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Image
          testID="consult-welcome-mascot"
          source={mascot}
          style={{ width: mascotWidth, height: mascotWidth / ratio }}
          contentFit="cover"
          onLoad={showGreeting}
          onError={showGreeting}
          accessible={false}
        />
        <Stream active={mascotReady && !reducedMotion} key={mascotReady ? 'ready' : 'loading'} charactersPerSecond={72}>
          <View style={s.copy} testID="consult-welcome-copy">
            {consultGreeting(nickname).map((line, i) => (
              <View key={i} style={s.lineSlot}>
                <Text style={[s.line, s.reserve]} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{line}</Text>
                {mascotReady || reducedMotion ? (
                  <View testID="consult-welcome-line" style={StyleSheet.absoluteFill}>
                    <StreamText style={s.line}>{line}</StreamText>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
          <View style={s.continueSlot}>
            {mascotReady || reducedMotion ? (
              <StreamBlock>
                <PrimaryButton label="대화하기" onPress={onContinue} disabled={leaving} />
              </StreamBlock>
            ) : null}
          </View>
        </Stream>
      </ScrollView>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, zIndex: 1, backgroundColor: colors.cream },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SCREEN_PX, paddingVertical: 18, gap: 12 },
  copy: { alignSelf: 'stretch', alignItems: 'center', gap: 3 },
  lineSlot: { width: '100%', maxWidth: 360 },
  line: { ...sansW('400'), color: colors.ink, fontSize: 16, lineHeight: 23, letterSpacing: -0.5, textAlign: 'center' },
  reserve: { opacity: 0 },
  continueSlot: { width: '100%', maxWidth: 256, minHeight: 52, marginTop: 10 },
});
