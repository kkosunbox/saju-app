import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { router, type Href } from 'expo-router';
import { Animated, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Amount } from '../../components/Amount';
import { SOCIAL_PROVIDERS, SocialCircle } from '../../components/auth/AuthKit';
import PrimaryButton from '../../components/PrimaryButton';
import PromoCard from '../../components/PromoCard';
import { promoDesign } from '../../components/PromoSlot';
import { useApp } from '../../context/AppContext';
import { newYearOf, spousePromo } from '../../services/promo/promos';
import { storage } from '../../services/storage/storageService';
import { colors } from '../../theme/colors';
import { txt } from '../../theme/typography';
import { motion, useReducedMotion } from '../../utils/motion';
import { FortuneSpouseBanner } from './FortuneRec';
import { trackAction } from '../../services/screenViews';

const FORTUNE_SIGNUP_DELAY_MS = 3_000;
type FortuneSignupControl = { reserve(): void; setHostLive(live: boolean): void };
const FortuneSignupContext = createContext<FortuneSignupControl>({ reserve: () => {}, setHostLive: () => {} });

/** 운세 화면이 가입 안내를 예약하고, 자기가 지금 앞에 떠 있는지 알린다 */
export function useFortuneSignup() {
  return useContext(FortuneSignupContext);
}

/**
 * 가입 안내의 예약과 표시를 라우트 전환과 별도로 유지한다.
 * 예약하고 3초가 지나도 운세 화면이 앞에 없으면(다른 화면으로 갔거나 앱이 뒤로 갔으면) 돌아올 때까지 미룬다 —
 * 로그인·결제 같은 다른 화면이나 모달 위에 겹쳐 뜨지 않게.
 */
export function FortuneSignupProvider({ children }: { children: ReactNode }) {
  const { booting, account, user, today } = useApp();
  const [open, setOpen] = useState(false);
  const reserved = useRef(false);
  const due = useRef(false);
  const hostLive = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reserve = useCallback(() => {
    if (reserved.current) return;
    reserved.current = true;
    timer.current = setTimeout(() => {
      if (hostLive.current) setOpen(true);
      else due.current = true;
    }, FORTUNE_SIGNUP_DELAY_MS);
  }, []);
  const setHostLive = useCallback((live: boolean) => {
    hostLive.current = live;
    if (live && due.current) {
      due.current = false;
      setOpen(true);
    }
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  const control = useMemo(() => ({ reserve, setHostLive }), [reserve, setHostLive]);
  const visible = open && !booting && !!user && !account;
  useEffect(() => { if (visible) { void storage.markFortuneSignupSeen(); trackAction('fortune_signup_shown'); } }, [visible]);

  return (
    <FortuneSignupContext.Provider value={control}>
      {children}
      <FortuneSignupDialog visible={visible} onClose={() => setOpen(false)} today={today} />
    </FortuneSignupContext.Provider>
  );
}

function FortuneSignupDialog({ visible, onClose, today }: { visible: boolean; onClose(): void; today: string }) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [scale] = useState(() => new Animated.Value(0.97));
  useLayoutEffect(() => {
    if (!visible || reducedMotion) return;
    scale.setValue(0.97);
    const animation = Animated.timing(scale, {
      toValue: 1, duration: motion.fast, easing: motion.easeOut, useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();
    return () => animation.stop();
  }, [reducedMotion, scale, visible]);
  const verticalMargin = Math.max(insets.top, insets.bottom, 16);
  const year = newYearOf(today);
  const open = (destination: Href) => {
    onClose();
    router.push(destination);
  };

  return (
    <Modal visible={visible} transparent animationType={reducedMotion ? 'none' : 'fade'} onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={[s.overlay, { paddingLeft: Math.max(insets.left, 16), paddingRight: Math.max(insets.right, 16) }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessible={false} />
        <Animated.View style={[s.dialog, { maxHeight: height - verticalMargin * 2, transform: [{ scale: reducedMotion ? 1 : scale }] }]} accessibilityViewIsModal>
          <Text style={[txt.h2, s.heading]} accessibilityRole="header">더 많은 콘텐츠가 있어요</Text>
          <ScrollView style={s.scroll} contentContainerStyle={s.banners}>
            <PromoCard variant="recommendation" {...promoDesign('theme-love')} title="그 사람과 나, 잘 맞을까?"
              desc="연인 · 친구 · 가족과의 관계를 살펴봐요" cta="무료 궁합 보기 →" accessibilityLabel="궁합"
              onPress={() => open('/compatibility')} />
            <PromoCard variant="recommendation" {...promoDesign('newyear', year)} title={`${year}년 신년운세`}
              desc="분야별 운세와 12개월 흐름" cta="확인하러 가기 →" accessibilityLabel="신년운세"
              onPress={() => open({ pathname: '/premium/new-year', params: { year: String(year) } })} />
            {/* 닫히며 흐려지는 동안에도 그대로 둔다 — 먼저 빠지면 카드 높이가 줄며 튄다 (안 보일 때는 Modal이 안을 그리지 않는다) */}
            <FortuneSpouseBanner promo={spousePromo(() => open('/spouse'))} screen="fortune_signup" cta="확인하러 가기 →" />
          </ScrollView>
          <View style={s.signup}>
            <View style={s.reward} accessible accessibilityLabel="SNS로 처음 가입하면 50알을 드려요">
              <Text style={txt.h3}>SNS로 처음 가입하면</Text>
              <Amount value={50} after="을" size={16} style={txt.h3} />
              <Text style={txt.h3}>드려요</Text>
            </View>
            <Text style={[txt.small, s.description]}>
              매일 출석 체크와 공유로 알을 모아서{'\n'}다양한 사주 풀이를 즐겨보세요.
            </Text>
            <View style={s.social}>
              {SOCIAL_PROVIDERS.map(provider => (
                <SocialCircle key={provider} provider={provider}
                  onPress={() => open({ pathname: '/login/social/[provider]', params: { provider } })} />
              ))}
            </View>
            <PrimaryButton label="나중에" variant="text" onPress={onClose} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(20,18,14,0.45)' },
  dialog: { width: '100%', maxWidth: 390, borderRadius: 18, backgroundColor: colors.card, overflow: 'hidden' },
  heading: { textAlign: 'center', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 },
  scroll: { flexGrow: 0, flexShrink: 1 },
  banners: { gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  signup: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, paddingHorizontal: 16, paddingTop: 12 },
  reward: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', columnGap: 4 },
  description: { textAlign: 'center', marginTop: 4, marginBottom: 12 },
  social: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
});
