import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Animated, Easing, LayoutChangeEvent, Modal, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { motion, useReducedMotion } from '../utils/motion';

const native = Platform.OS !== 'web';

/**
 * 아래에서 올라오는 시트. 바깥을 누르면 닫힌다. 배경은 제자리에서 페이드, 시트만 슬라이드.
 * transitionKey를 주면 시트 안 내용이 바뀔 때 높이가 부드럽게 늘고 줄며, 키가 바뀌면(다른 화면으로 전환) 새 내용이 페이드인 된다.
 */
export default function BottomSheet({ visible, onClose, children, transitionKey }: { visible: boolean; onClose(): void; children: React.ReactNode; transitionKey?: string }) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const [a] = useState(() => new Animated.Value(0));
  // 닫히는 동안 부모가 내용을 비워도(visible={!!x} 패턴) 마지막 내용을 유지한다
  const [shown, setShown] = useState(children);
  if (visible && !mounted) setMounted(true);
  if (visible && shown !== children) setShown(children);

  useEffect(() => {
    Animated.timing(a, visible
      ? { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: native }
      : { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: native },
    ).start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
  }, [a, visible]);

  const translateY = a.interpolate({ inputRange: [0, 1], outputRange: [height, 0] });

  // 내용 전환: 바깥 상자 높이를 고정해 두고, 안쪽 내용의 실제 높이가 바뀌면 그쪽으로 애니메이션
  const reduced = useReducedMotion();
  const animated = transitionKey !== undefined;
  const [boxH] = useState(() => new Animated.Value(0));
  const [fade] = useState(() => new Animated.Value(1));
  const [measured, setMeasured] = useState(false);
  const lastH = useRef(0);
  // 다시 열 때는 첫 높이를 그대로 쓴다 (올라오는 중에 높이가 움직이지 않게)
  if (!visible && measured) setMeasured(false);
  // 그리기 전에 투명하게 만들어 새 내용이 한 번 번쩍이지 않게 한다 (렌더 중에 값을 바꾸면 React가 경고한다)
  const live = visible && measured && !reduced;
  const firstKey = useRef(true);
  useLayoutEffect(() => {
    if (firstKey.current) { firstKey.current = false; return; }
    if (!live) return;
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: motion.fast + 40, easing: motion.easeOut, useNativeDriver: native }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transitionKey]);
  const onContentLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (measured && h === lastH.current) return;
    lastH.current = h;
    if (!measured || reduced) {
      boxH.setValue(h);
      if (!measured) setMeasured(true);
      return;
    }
    Animated.timing(boxH, { toValue: h, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  };
  const content = visible ? children : shown;

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[s.backdrop, { opacity: a }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="닫기" />
      </Animated.View>
      <Animated.View style={s.root} pointerEvents="box-none">
        <Animated.View style={[s.sheet, { paddingBottom: 18 + insets.bottom, transform: [{ translateY }] }]} accessibilityViewIsModal>
          <View style={s.grab} />
          {animated ? (
            <Animated.View style={measured ? { height: boxH, overflow: 'hidden' } : undefined}>
              <Animated.View onLayout={onContentLayout} style={{ opacity: fade }}>{content}</Animated.View>
            </Animated.View>
          ) : content}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(20,18,14,0.45)' },
  sheet: { width: '100%', maxWidth: 430, backgroundColor: colors.card, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingTop: 10, paddingHorizontal: 20 },
  grab: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.lineStrong, marginBottom: 16 },
});
