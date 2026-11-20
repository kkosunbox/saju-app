import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, Platform, Pressable, StyleSheet, Text, View, type ViewInstance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Coin } from '../../components/Amount';
import Icon from '../../components/Icon';
import { SHARE_P } from '../../context/PremiumContext';
import { useSharedView } from '../../context/SharedViewContext';
import { useShareRewardAvailable } from '../../services/share/useShare';
import { colors, isDark } from '../../theme/colors';
import { SCREEN_PX, sansW } from '../../theme/typography';
import { motion, useReducedMotion, useScreenLive } from '../../utils/motion';
import { TOP_BAR_H, useTopBarInsets } from '../../utils/topBarRegion';

const SPOTLIGHT_KEY = 'woonpick:spouseShareSpotlight';
let seenInSession = false;

function rememberSpotlight() {
  seenInSession = true;
  void AsyncStorage.setItem(SPOTLIGHT_KEY, '1').catch(() => {});
}

/** 공유 보상이 남은 회원에게 기기·브라우저마다 한 번만 보여 준다. */
export function useSpouseShareSpotlight(ready: boolean) {
  const shared = useSharedView();
  const rewardAvailable = useShareRewardAvailable();
  const live = useScreenLive();
  const eligible = ready && !shared && rewardAvailable;
  const enabled = eligible && live;
  const [guide, setGuide] = useState<'waiting' | 'visible' | 'dismissed'>('waiting');

  useEffect(() => {
    if (!enabled || guide !== 'waiting' || seenInSession) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = async () => {
      if (await AsyncStorage.getItem(SPOTLIGHT_KEY).catch(() => null)) {
        seenInSession = true;
        return;
      }
      // 이전 버전에 계정별로 기록한 노출도 이 기기에서 본 것으로 본다.
      const keys = await AsyncStorage.getAllKeys().catch(() => []);
      if (keys.some(key => key.startsWith(`${SPOTLIGHT_KEY}:`))) {
        rememberSpotlight();
        return;
      }
      if (!active) return;
      timer = setTimeout(() => {
        if (seenInSession) return;
        rememberSpotlight();
        setGuide('visible');
      }, 700);
    };
    void check();
    return () => { active = false; clearTimeout(timer); };
  }, [enabled, guide]);

  const dismiss = useCallback(() => setGuide('dismissed'), []);
  return { visible: eligible && guide === 'visible', dismiss };
}

const SPOT_SIZE = 48;
const SHARE_ICON_SIZE = 24;
const REWARD_COLOR = isDark ? '#FFB3C5' : '#942C50';

export default function SpouseShareSpotlight({ dismiss, openCard }: { dismiss(): void; openCard(): void }) {
  const insets = useTopBarInsets();
  const reduced = useReducedMotion();
  const [reveal] = useState(() => new Animated.Value(0));
  const shareButton = useRef<ViewInstance>(null);
  const top = insets.top + (TOP_BAR_H - SPOT_SIZE) / 2;
  const right = Math.max(SCREEN_PX, insets.right) - (SPOT_SIZE - SHARE_ICON_SIZE) / 2;

  useEffect(() => {
    if (reduced) { reveal.setValue(1); return; }
    const animation = Animated.timing(reveal, {
      toValue: 1, duration: 540, easing: motion.easeOut, useNativeDriver: Platform.OS !== 'web', isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [reduced, reveal]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      const back = BackHandler.addEventListener('hardwareBackPress', () => { dismiss(); return true; });
      return () => back.remove();
    }

    const previous = document.activeElement as HTMLElement | null;
    const share = shareButton.current as unknown as HTMLElement | null;
    share?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        dismiss();
      } else if (event.key === 'Tab') {
        event.preventDefault();
        share?.focus({ preventScroll: true });
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus({ preventScroll: true });
    };
  }, [dismiss]);

  return (
    <View style={s.overlay} role="dialog" aria-modal accessibilityViewIsModal accessibilityLabel="카드 공유 보상" testID="spouse-share-spotlight">
      <Animated.View pointerEvents="none" style={[s.dimmer, { opacity: reveal }]} />
      <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} focusable={false} accessible={false} aria-hidden />
      <Animated.View pointerEvents="none" style={[s.halo, {
        top: top - 5, right: right - 5,
        opacity: reveal.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0, 0.8, 0.35] }),
        transform: [{ scale: reveal.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0.8, 1.14, 1] }) }],
      }]} />
      <Pressable
        ref={shareButton}
        accessibilityRole="button"
        accessibilityLabel="배우자 카드 공유하기"
        onAccessibilityEscape={dismiss}
        style={[s.spot, { top, right }]}
        onPress={openCard}
      >
        <Icon name="external" size={SHARE_ICON_SIZE} color="#202434" strokeWidth={2} />
      </Pressable>
      <Animated.View pointerEvents="box-none" style={[s.anchor, {
        top: top + SPOT_SIZE + 13, right,
        opacity: reveal,
        transform: [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [-7, 0] }) }],
      }]}>
        <View style={s.bubble}>
          <View style={s.tip} />
          <Text style={s.titleText}>카드 공유하면 매일</Text>
          <View style={s.reward}>
            <Coin size={15} />
            <Text style={s.titleText}><Text style={s.rewardNumber}>{SHARE_P}</Text>{' 을 드려요!'}</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, zIndex: 10 },
  dimmer: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(12, 15, 27, 0.57)' },
  halo: { position: 'absolute', width: SPOT_SIZE + 10, height: SPOT_SIZE + 10, borderRadius: 29, borderWidth: 2, borderColor: '#FFE7C4', backgroundColor: '#FFE7C4' },
  spot: { position: 'absolute', width: SPOT_SIZE, height: SPOT_SIZE, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF9F2', borderWidth: 1, borderColor: '#FFE7C4' },
  anchor: { position: 'absolute', left: 16, alignItems: 'flex-end' },
  bubble: {
    maxWidth: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 4,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  tip: { position: 'absolute', top: -5, right: 19, width: 10, height: 10, backgroundColor: colors.surface, transform: [{ rotate: '45deg' }] },
  titleText: { ...sansW('700'), fontSize: 15, lineHeight: 21, letterSpacing: -0.55, color: colors.ink },
  reward: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  rewardNumber: { ...sansW('800'), color: REWARD_COLOR },
});
