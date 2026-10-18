import React, { useEffect, useState } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

const native = Platform.OS !== 'web';

/** 아래에서 올라오는 시트. 바깥을 누르면 닫힌다. 배경은 제자리에서 페이드, 시트만 슬라이드 */
export default function BottomSheet({ visible, onClose, children }: { visible: boolean; onClose(): void; children: React.ReactNode }) {
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

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[s.backdrop, { opacity: a }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="닫기" />
      </Animated.View>
      <Animated.View style={s.root} pointerEvents="box-none">
        <Animated.View style={[s.sheet, { paddingBottom: 18 + insets.bottom, transform: [{ translateY }] }]} accessibilityViewIsModal>
          <View style={s.grab} />
          {visible ? children : shown}
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
