import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@/navigation/compat';
import PressableScale from './PressableScale';
import Icon from './Icon';
import { ART } from './Mascot';
import { usePremium } from '../context/PremiumContext';
import { colors } from '../theme/colors';
import { radius } from '../theme/typography';
import { profileType } from '../theme/profileDesign';
import { motion, useReducedMotion } from '../utils/motion';

// 출석 말풍선은 앱을 켠 뒤 처음 한 번만 보여 주고, 그 뒤로는 알약 속 +10만 남긴다
let attendBubbleShown = false;

/** 상단 오른쪽: 내 포인트 알약(누르면 지갑).
 *  attendHint면 오늘 출석 전일 때 말풍선을 잠깐 띄웠다가 알약 속으로 빨려 들어가게 하고, 금색 +10을 남긴다.
 *  알약 → 알충전소 길을 익히게 하려는 것(비로그인도 똑같이) */
export function PointPill({ attendHint }: { attendHint?: boolean }) {
  const nav = useNavigation();
  const { points, ready, attendedToday } = usePremium();
  const reduced = useReducedMotion();
  const goWallet = () => nav.navigate('Wallet');
  const show = !!attendHint && ready && !attendedToday;

  const [bubble, setBubble] = useState(false);
  // 말풍선 몸통과 글자를 따로 움직인다: 몸통이 먼저 떠오르고 글자가 차례로 올라온 뒤,
  // 나갈 때는 등장을 정확히 거꾸로 돌린다(+10알 → 오늘 출석 보상 → 몸통). 그 뒤 알약에 +10 칸이 열린다.
  // 튕기는 스프링 없이 감속 곡선만 써서 부드럽게
  const body = useRef(new Animated.Value(0)).current; // 몸통 등장
  const label = useRef(new Animated.Value(0)).current; // '오늘 출석 보상' 등장
  const gold = useRef(new Animated.Value(0)).current; // '+10알' 등장
  const gulp = useRef(new Animated.Value(0)).current; // 받은 알약이 살짝 부풂
  const chip = useRef(new Animated.Value(attendBubbleShown ? 1 : 0)).current; // +10 칸 펼침(폭이라 JS 드라이버)
  const chipPop = useRef(new Animated.Value(attendBubbleShown ? 1 : 0)).current; // +10 글자

  useEffect(() => {
    if (!show) return;
    if (attendBubbleShown) { chip.setValue(1); chipPop.setValue(1); return; }
    attendBubbleShown = true;
    setBubble(true);
    const ease = (v: Animated.Value, duration: number, easing: (t: number) => number, toValue = 1, useNativeDriver = true) =>
      Animated.timing(v, { toValue, duration: reduced ? 0 : duration, easing, useNativeDriver });
    const after = (ms: number, a: Animated.CompositeAnimation) => Animated.sequence([Animated.delay(reduced ? 0 : ms), a]);
    const out = Easing.bezier(0.22, 1, 0.36, 1); // 빠르게 시작해 길게 멈추는 감속
    const back = Easing.bezier(0.64, 0, 0.78, 0); // out을 시간축으로 뒤집은 곡선 — 퇴장이 등장의 정확한 역재생이 된다
    const inOut = Easing.bezier(0.45, 0, 0.25, 1);
    const anim = Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        ease(body, 520, out),
        after(160, ease(label, 460, out)),
        after(260, ease(gold, 480, out)),
      ]),
      Animated.delay(2300),
      // 등장(총 740ms)의 각 시작·길이를 거울처럼 뒤집은 시점: 740 - (시작 + 길이)
      Animated.parallel([
        ease(gold, 480, back, 0),
        after(120, ease(label, 460, back, 0)),
        after(220, ease(body, 520, back, 0)),
        // 몸통이 거의 사라질 즈음 알약이 받아 주고 +10 칸이 열린다
        after(620, Animated.sequence([ease(gulp, 180, out), ease(gulp, 320, inOut, 0)])),
        after(640, ease(chip, 380, out, 1, false)),
        after(720, ease(chipPop, 380, out)),
      ]),
    ]);
    anim.start(({ finished }) => { if (finished) setBubble(false); });
    return () => anim.stop();
  }, [show, reduced, body, label, gold, gulp, chip, chipPop]);

  if (!show) return <PillButton points={points} onPress={goWallet} />;
  const lerp = (v: Animated.Value, inputRange: number[], outputRange: number[]) => v.interpolate({ inputRange, outputRange, extrapolate: 'clamp' });
  return (
    <View>
      <Animated.View style={{ transform: [{ scale: lerp(gulp, [0, 1], [1, 1.06]) }] }}>
        <PillButton points={points} onPress={goWallet} label={`내 알 ${points}개, 오늘 출석하면 10알을 받아요`}>
          <Animated.View style={{ maxWidth: lerp(chip, [0, 1], [0, 40]), opacity: chip, overflow: 'hidden' }}>
            <View style={s.chip}>
              <Animated.Text style={[s.chipText, { opacity: chipPop, transform: [{ scale: lerp(chipPop, [0, 1], [0.7, 1]) }] }]}>+10</Animated.Text>
            </View>
          </Animated.View>
        </PillButton>
      </Animated.View>
      {bubble ? (
        // 알약 폭에 갇혀 줄바꿈되지 않게 양옆으로 넓은 자리를 깔고 가운데에 둔다
        <View pointerEvents="box-none" style={s.bubbleSlot}>
          <Animated.View
            pointerEvents="box-none"
            style={[s.bubbleWrap, {
              opacity: body,
              transform: [
                { translateY: lerp(body, [0, 1], [-6, 0]) },
                { scale: lerp(body, [0, 1], [0.9, 1]) },
              ],
            }]}
          >
            <PressableScale onPress={goWallet} style={s.bubble} scaleTo={0.96} hitSlop={6} accessibilityLabel="출석 체크하고 10알 받기">
              <View style={s.tail} />
              <Animated.Text
                style={[s.bubbleText, {
                  opacity: label,
                  transform: [{ translateY: lerp(label, [0, 1], [4, 0]) }],
                }]}
                numberOfLines={1}
              >오늘 출석 보상</Animated.Text>
              <Animated.Text
                style={[s.bubbleGold, {
                  opacity: gold,
                  transform: [
                    { translateY: lerp(gold, [0, 1], [4, 0]) },
                    { scale: lerp(gold, [0, 1], [0.85, 1]) },
                  ],
                }]}
                numberOfLines={1}
              >+10알</Animated.Text>
            </PressableScale>
          </Animated.View>
        </View>
      ) : null}
    </View>
  );
}

function PillButton({ points, onPress, label, children }: { points: number; onPress(): void; label?: string; children?: React.ReactNode }) {
  return (
    <PressableScale onPress={onPress} style={s.pill} scaleTo={0.94} accessibilityLabel={label ?? `내 알 ${points}개`}>
      <View style={{ width: 16, height: 16 }}>
        <Image source={ART.mascot} style={{ width: 16, height: 15, marginTop: 1 }} contentFit="cover" accessible={false} />
      </View>
      <Text style={s.text}>{points.toLocaleString('ko-KR')}</Text>
      {children}
    </PressableScale>
  );
}

/** 상단 오른쪽: 포인트 알약 + (있으면) 저장·공유 버튼 */
export default function HeaderPoints({ onSave, saveLabel = '공유하기', color = colors.ink }: { onSave?: () => void; saveLabel?: string; color?: string }) {
  return (
    <>
      <PointPill />
      {onSave ? (
        <PressableScale onPress={onSave} hitSlop={8} scaleTo={0.9} accessibilityLabel={saveLabel}>
          <Icon name="download" size={24} color={color} />
        </PressableScale>
      ) : null}
    </>
  );
}

const s = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 24, paddingLeft: 6, paddingRight: 6, borderRadius: radius.pill, backgroundColor: colors.heroBg },
  text: { ...profileType(14, '800', 17, -0.56, colors.white) },
  chip: { marginLeft: 2, height: 16, paddingHorizontal: 5, borderRadius: 8, justifyContent: 'center', backgroundColor: colors.moon },
  chipText: { ...profileType(11, '800', 13, -0.2, colors.heroBg) },
  bubbleSlot: { position: 'absolute', top: 24 + 9, left: -100, right: -100, alignItems: 'center' },
  // 꼬리 끝(알약 가운데)을 기준으로 커지고 작아진다
  bubbleWrap: { transformOrigin: '50% 0%' },
  bubble: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, height: 24, paddingHorizontal: 10, borderRadius: 12,
    backgroundColor: colors.heroBg, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.14)',
    boxShadow: '0 4px 14px rgba(29,33,45,0.22)',
  },
  tail: { position: 'absolute', top: -3, left: '50%', marginLeft: -3.5, width: 7, height: 7, borderTopLeftRadius: 1.5, backgroundColor: colors.heroBg, transform: [{ rotate: '45deg' }] },
  bubbleText: { ...profileType(11, '600', 13, -0.3, 'rgba(255,255,255,0.78)') },
  bubbleGold: { ...profileType(11, '800', 13, -0.2, colors.moon) },
});
