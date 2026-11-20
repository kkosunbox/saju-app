import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { motion, useReducedMotion } from '../utils/motion';

const native = Platform.OS !== 'web';

/**
 * 아래에서 올라오는 시트. 바깥을 누르면 닫힌다. 배경은 제자리에서 페이드, 시트만 슬라이드.
 * transitionKey가 바뀌면 새 내용이 페이드인 된다. scrollable 시트는 화면에 맞추고 긴 내용만 스크롤한다.
 */
export default function BottomSheet({ visible, onClose, children, transitionKey, scrollable = false }: {
  visible: boolean; onClose(): void; children: React.ReactNode; transitionKey?: string; scrollable?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const [presented, setPresented] = useState(false);
  const onShow = useCallback(() => setPresented(true), []);
  const [a] = useState(() => new Animated.Value(0));
  const reduced = useReducedMotion();
  // 닫히는 동안 부모가 내용을 비워도(visible={!!x} 패턴) 마지막 내용을 유지한다
  const [shown, setShown] = useState(children);
  if (visible && !mounted) setMounted(true);
  if (visible && shown !== children) setShown(children);

  useEffect(() => {
    if (!mounted || (visible && !presented)) return;
    const animation = Animated.timing(a, {
      toValue: visible ? 1 : 0,
      duration: reduced ? 0 : visible ? 260 : 200,
      easing: visible ? motion.easeOut : Easing.in(Easing.cubic),
      useNativeDriver: native,
    });
    animation.start(({ finished }) => {
      if (finished && !visible) {
        setMounted(false);
        setPresented(false);
      }
    });
    return () => animation.stop();
  }, [a, mounted, presented, reduced, visible]);

  const translateY = a.interpolate({ inputRange: [0, 1], outputRange: [height, 0] });

  // 링크가 로딩되거나 펼쳐져도 레이아웃이 시트 높이를 다시 정한다.
  const [fade] = useState(() => new Animated.Value(1));
  const previousKey = useRef(transitionKey);
  useLayoutEffect(() => {
    const changed = previousKey.current !== transitionKey;
    previousKey.current = transitionKey;
    if (!visible || !presented || reduced) {
      fade.setValue(1);
      return;
    }
    if (!changed) return;
    fade.setValue(0);
    const animation = Animated.timing(fade, { toValue: 1, duration: motion.fast + 40, easing: motion.easeOut, useNativeDriver: native });
    animation.start();
    return () => animation.stop();
  }, [fade, presented, reduced, transitionKey, visible]);
  const current = visible ? children : shown;
  const content = transitionKey === undefined ? current : <Animated.View style={{ opacity: fade }}>{current}</Animated.View>;

  return (
    <Modal visible={mounted} transparent animationType="none" onShow={onShow} onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[s.backdrop, { opacity: a }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="닫기" />
      </Animated.View>
      <Animated.View style={s.root} pointerEvents="box-none">
        <Animated.View style={[s.sheet, scrollable && s.bounded, { paddingBottom: 18 + insets.bottom, transform: [{ translateY }] }]} accessibilityViewIsModal>
          <View style={s.grab} />
          {scrollable ? <ScrollView style={s.scroll} keyboardShouldPersistTaps="handled">{content}</ScrollView> : content}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(20,18,14,0.45)' },
  sheet: { width: '100%', maxWidth: 430, backgroundColor: colors.card, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingTop: 10, paddingHorizontal: 20 },
  bounded: { maxHeight: '92%' },
  scroll: { flexGrow: 0, flexShrink: 1 },
  grab: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.lineStrong, marginBottom: 16 },
});
