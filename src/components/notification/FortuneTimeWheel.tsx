import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import WheelColumn, { WHEEL_ITEM_H, WHEEL_VISIBLE } from './WheelColumn';
import { FORTUNE_MINUTES } from '../../services/notificationService';
import { colors } from '../../theme/colors';

const FIRST = FORTUNE_MINUTES[0];
const LAST = FORTUNE_MINUTES[FORTUNE_MINUTES.length - 1];
const HOURS = Array.from({ length: LAST / 60 - FIRST / 60 + 1 }, (_, i) => FIRST / 60 + i);
const HOUR_LABELS = HOURS.map(h => `${h < 12 ? '오전' : '오후'} ${h % 12 === 0 ? 12 : h % 12}시`);
const MINUTES = [0, 30];
const MINUTE_LABELS = MINUTES.map(m => `${String(m).padStart(2, '0')}분`);

/** 범위(오전 6시~오후 10시) 밖이 되면 끝으로 붙인다 — 오후 10시 30분 → 오후 10시 */
const clamp = (m: number) => Math.min(LAST, Math.max(FIRST, m));

/**
 * 오늘의 운세 알림 시각 — 시·분 두 줄 휠. 가운데 띠가 고른 값이고 위아래는 흐려진다.
 * bg: 휠이 놓인 바탕색 (위아래 흐림을 그 색으로 덮는다)
 */
export default function FortuneTimeWheel({ value, onChange, bg = colors.card }: { value: number; onChange(minute: number): void; bg?: string }) {
  const hourIndex = Math.max(0, HOURS.indexOf(Math.floor(value / 60)));
  const minuteIndex = Math.max(0, MINUTES.indexOf(value % 60));
  const set = (h: number, m: number) => { const next = clamp(h * 60 + m); if (next !== value) onChange(next); };
  const fade = [bg, `${bg}00`];

  return (
    <View style={s.wrap}>
      <View style={s.band} pointerEvents="none" />
      <View style={s.columns}>
        <WheelColumn items={HOUR_LABELS} index={hourIndex} width={128} accessibilityLabel="알림 시" onChange={i => set(HOURS[i], MINUTES[minuteIndex])} />
        <WheelColumn items={MINUTE_LABELS} index={minuteIndex} width={88} accessibilityLabel="알림 분" onChange={i => set(HOURS[hourIndex], MINUTES[i])} />
      </View>
      <LinearGradient colors={fade as [string, string]} style={[s.fade, { top: 0 }]} pointerEvents="none" />
      <LinearGradient colors={[...fade].reverse() as [string, string]} style={[s.fade, { bottom: 0 }]} pointerEvents="none" />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { height: WHEEL_ITEM_H * WHEEL_VISIBLE, justifyContent: 'center', overflow: 'hidden' },
  band: { position: 'absolute', left: 0, right: 0, top: WHEEL_ITEM_H * Math.floor(WHEEL_VISIBLE / 2), height: WHEEL_ITEM_H, borderRadius: 10, backgroundColor: colors.cream },
  columns: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
  fade: { position: 'absolute', left: 0, right: 0, height: WHEEL_ITEM_H * 1.4 },
});
