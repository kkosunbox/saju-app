/**
 * 무료 운알톡을 다 쓴 뒤 알이 드는 말을 보낼 때 — 보내는 순간 가벼운 하단 시트로 한 번 묻는다.
 * 한 줄 안내 · 보내기 · '다음부터 묻지 않고 보내기'(이 기기에서 다시 묻지 않음) · 구독 한 줄 (구독하면 알 없이 무제한).
 * 알이 모자랄 때는 늘 충전과 구독을 안내한다.
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomSheet from '../../components/BottomSheet';
import PrimaryButton from '../../components/PrimaryButton';
import PressableScale from '../../components/PressableScale';
import { usePremium } from '../../context/PremiumContext';
import { deviceKey } from '../../services/storage/storageService';
import { colors } from '../../theme/colors';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { trackAction } from '../../services/screenViews';

const HIDE_KEY = deviceKey('chatCostNoticeHidden');
const MASCOT = require('../../../assets/figma/consult/counselor-mascot.webp');

/** confirm(cost, run): 알이 들면 시트로 묻고 확인하면 run, 무료(0)거나 다시 보지 않기면 바로 run. sheet는 화면에 그려 둔다 */
export function useChatCostConfirm() {
  const { points, goWallet } = usePremium();
  const [hidden, setHidden] = useState(false);
  const [pending, setPending] = useState<{ cost: number; run(): void } | null>(null);
  useEffect(() => {
    let live = true;
    void AsyncStorage.getItem(HIDE_KEY).then(v => { if (live) setHidden(v === '1'); }).catch(() => {});
    return () => { live = false; };
  }, []);

  const confirm = (cost: number, run: () => void) => {
    if (cost <= 0 || (hidden && points >= cost)) { run(); return; }
    setPending({ cost, run });
  };
  const close = () => setPending(null);
  /** hide: 다음부터 묻지 않기 */
  const send = (hide: boolean) => {
    const p = pending;
    setPending(null);
    if (hide) {
      setHidden(true);
      void AsyncStorage.setItem(HIDE_KEY, '1').catch(() => {});
    }
    p?.run();
  };

  const cost = pending?.cost ?? 0;
  const short = points < cost;
  // 짧고 가볍게 — 한 줄 안내와 버튼 하나. 닫기는 바깥을 누르면 된다
  const sheet = (
    <BottomSheet visible={!!pending} onClose={close}>
      <View style={s.head}>
        <Image source={MASCOT} style={s.mascot} contentFit="contain" accessible={false} />
        <View style={{ flex: 1, gap: 2 }}>
          {short ? (
            <Text style={s.title}>알이 조금 모자라요</Text>
          ) : (
            <Text style={s.title}>{cost}알을 사용할까요?</Text>
          )}
          <Text style={s.sub}>오늘 무료 대화는 다 썼어요.</Text>
        </View>
      </View>
      {short ? (
        <PrimaryButton label="충전하러 가기 →" onPress={() => { close(); goWallet?.(); }} style={{ marginTop: 18 }} />
      ) : (
        <>
          <PrimaryButton label="보내기" onPress={() => send(false)} style={{ marginTop: 18 }} />
          <PressableScale onPress={() => send(true)} hitSlop={8} scaleTo={0.97} style={s.skip} accessibilityLabel="다음부터 묻지 않고 보내기">
            <Text style={s.skipText}>다음부터 묻지 않고 보내기</Text>
          </PressableScale>
        </>
      )}
      {/* 구독은 한 줄로만 살짝 — 구독하면 운알톡을 알 없이 쓴다 */}
      <PressableScale onPress={() => { close(); trackAction('chat_cost_subscribe'); router.push('/subscribe'); }} scaleTo={0.98} style={s.plan} accessibilityLabel="정기 구독 알아보기">
        <Text style={s.planText}>구독하면 운알톡을 알 없이 마음껏 이야기해요</Text>
        <Text style={s.planGo}>구독 알아보기 ›</Text>
      </PressableScale>
    </BottomSheet>
  );
  return { confirm, sheet };
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4 },
  mascot: { width: 40, height: 36 },
  title: { fontSize: 16, fontWeight: '700', color: colors.ink, letterSpacing: -0.6 },
  sub: { fontSize: 13, color: colors.inkSub, letterSpacing: -0.4 },
  skip: { alignSelf: 'center', marginTop: 14, paddingVertical: 4 },
  plan: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 16, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.card },
  planText: { flex: 1, fontSize: 12, color: colors.inkSub, letterSpacing: -0.4 },
  planGo: { fontSize: 12, fontWeight: '700', color: colors.accent, letterSpacing: -0.4 },
  skipText: { fontSize: 13, color: colors.inkMute, letterSpacing: -0.4, textDecorationLine: 'underline' },
});
