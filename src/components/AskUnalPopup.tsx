import React, { useEffect, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import PressableScale from './PressableScale';
import Icon from './Icon';
import { useApp } from '../context/AppContext';
import { CHAT_CONFIG } from '../services/content/consult';
import { ChatSource } from '../services/server/consultApi';
import { useAskConsult } from '../screens/consult/useAskConsult';
import { useChatCostConfirm } from '../screens/consult/ChatCostSheet';
import { WEB_ONE_ROW, webEnterToSend } from '../screens/consult/parts';
import { colors } from '../theme/colors';
import { radius, SCREEN_PX } from '../theme/typography';
import { useReducedMotion } from '../utils/motion';

const MASCOT = require('../../assets/figma/consult/counselor-mascot.webp');

/**
 * 콘텐츠를 끝까지 읽을 즈음 운알이가 화면 위쪽에서 부드럽게 내려온다 — 누르면 바로 입력창이 열리고,
 * 보내면 이 화면 내용을 기억한 운알톡 대화로 넘어간다. 닫으면 이 화면에서는 다시 뜨지 않는다.
 * Screen이 끝 근처인지(visible)를 정하고, 상단 바 바로 아래(top)에 본문 위로 띄운다.
 */
export default function AskUnalPopup({ source, visible, top, bg }: { source: ChatSource; visible: boolean; top: number; bg: string }) {
  const { user } = useApp();
  const { ask, cost } = useAskConsult('content_popup');
  const { confirm: confirmCost, sheet: costSheet } = useChatCostConfirm();
  const reduced = useReducedMotion();
  const [dismissed, setDismissed] = useState(false);
  const [composing, setComposing] = useState(false);
  const [text, setText] = useState('');
  const [enter] = useState(() => new Animated.Value(0));
  const show = !!user && !dismissed && (visible || composing);
  useEffect(() => {
    if (!show) return;
    // 살짝만 넘쳤다가 부드럽게 자리 잡는 스프링 (한 번, 아주 작게)
    const animation = Animated.spring(enter, { toValue: 1, useNativeDriver: Platform.OS !== 'web', friction: 7, tension: 50 });
    if (reduced) enter.setValue(1);
    else animation.start();
    return () => animation.stop();
  }, [show, enter, reduced]);
  if (!show) return null;

  const send = () => {
    const message = text.trim();
    if (!message) return;
    // 알이 드는 말이면 보내기 전에 한 번 묻는다 (다시 보지 않기를 고르면 바로)
    confirmCost(cost, () => {
      setText('');
      setComposing(false);
      ask(message, source);
    });
  };
  const style = {
    opacity: enter,
    transform: [
      { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [-28, 0] }) },
      { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
    ],
  };

  return (
    <>
    <View style={[s.float, { top }]} pointerEvents="box-none">
    {/* 알림 뒤 본문이 뚝 끊기지 않게, 위에서 아래로 화면 배경색이 서서히 옅어진다 */}
    <Animated.View pointerEvents="none" style={[s.fade, { opacity: enter }]}>
      <LinearGradient colors={[bg, bg, bg + '00']} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
    </Animated.View>
    <Animated.View style={[s.wrap, style]}>
      <View style={s.card}>
        {composing ? (
          <>
            <View style={s.inputRow}>
              <Image source={MASCOT} style={s.mascot} contentFit="contain" accessible={false} />
              <TextInput
                value={text} onChangeText={setText} autoFocus multiline maxLength={CHAT_CONFIG.maxLen} {...WEB_ONE_ROW} {...webEnterToSend(send)}
                placeholder="궁금한 걸 편하게 물어보세요" placeholderTextColor={colors.inkMute}
                style={[s.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]} accessibilityLabel="운알이에게 보낼 말"
              />
              <PressableScale onPress={send} disabled={!text.trim()} style={[s.send, !text.trim() && { opacity: 0.4 }]} scaleTo={0.9} accessibilityLabel={cost > 0 ? `${cost}알로 보내기` : '보내기'}>
                <View style={{ transform: [{ rotate: '-45deg' }], marginLeft: 2, marginBottom: 2 }}><Icon name="send" size={18} color={colors.white} strokeWidth={1.8} /></View>
              </PressableScale>
            </View>
          </>
        ) : (
          <PressableScale onPress={() => setComposing(true)} style={s.open} scaleTo={0.98} accessibilityLabel="운알이에게 이 내용 물어보기">
            <Image source={MASCOT} style={s.mascot} contentFit="contain" accessible={false} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.title}>더 궁금한게 있나요?</Text>
              <Text style={s.sub} numberOfLines={1}>운알이한테 이어서 물어볼 수 있어요</Text>
            </View>
            <Text style={s.cta}>물어보기 →</Text>
          </PressableScale>
        )}
      </View>
      {/* 닫기 — 카드 오른쪽 위 모서리에 걸친 동그라미 */}
      <PressableScale onPress={() => setDismissed(true)} hitSlop={10} scaleTo={0.9} style={s.close} accessibilityLabel="운알이 닫기">
        <Icon name="close" size={12} color={colors.inkSub} strokeWidth={2.4} />
      </PressableScale>
    </Animated.View>
    </View>
    {costSheet}
    </>
  );
}

/** 알림 아래로 그라데이션이 더 내려오는 만큼 */
const FADE_H = 40;

/** 알림처럼 떠 있는 그림자 */
const DROP = { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8 } as const;

const s = StyleSheet.create({
  // 화면 위쪽(상단 바 바로 아래)에 본문 위로 떠 있다
  float: { position: 'absolute', left: 0, right: 0, zIndex: 10 },
  // 알림 뒤에서 아래로 FADE_H만큼 더 내려와 본문에 녹아드는 그라데이션
  fade: { position: 'absolute', left: 0, right: 0, top: 0, bottom: -FADE_H },
  // 닫기 동그라미가 카드 위로 걸치는 만큼 위를 비운다
  wrap: { paddingHorizontal: SCREEN_PX, paddingTop: 12 },
  card: { borderRadius: radius.lg, backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 20, borderWidth: 1, borderColor: colors.line, ...DROP },
  close: { position: 'absolute', top: 2, right: SCREEN_PX - 10, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.lineStrong, ...DROP },
  open: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 6 },
  mascot: { width: 34, height: 30.4 },
  title: { fontSize: 14, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 },
  sub: { fontSize: 12, color: colors.inkSub, letterSpacing: -0.4 },
  cta: { fontSize: 13, fontWeight: '700', color: colors.accent, letterSpacing: -0.4 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: { flex: 1, minHeight: 36, maxHeight: 110, paddingTop: 8, paddingBottom: 8, fontSize: 14, lineHeight: 20, color: colors.ink, letterSpacing: -0.6 },
  send: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
});
