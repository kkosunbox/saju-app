import React, { useEffect, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import BottomSheet from '../BottomSheet';
import Mascot from '../Mascot';
import PrimaryButton from '../PrimaryButton';
import PressableScale from '../PressableScale';
import { CheckRow } from '../auth/AuthKit';
import FortuneTimeWheel from './FortuneTimeWheel';
import FigmaAsset from '../profile/FigmaAsset';
import { usePremium } from '../../context/PremiumContext';
import { DEFAULT_FORTUNE_MINUTE, NotificationSettings, formatMinute, notificationService } from '../../services/notificationService';
import { colors } from '../../theme/colors';
import { profileType } from '../../theme/profileDesign';
import { radius, txt } from '../../theme/typography';

/**
 * 오늘의 운세를 뽑은 뒤 한 번 권하는 알림 시트. 큰 버튼은 오늘의 운세 알림, 그 아래 이벤트·혜택 알림은
 * 광고성 정보 수신 동의라 처음엔 체크하지 않은 채로 둔다 (이미 동의했으면 보이지 않는다).
 * 이 시트에서 '알림 받기'를 눌러야 OS 권한 창이 뜬다 — iOS는 권한 창을 한 번만 띄울 수 있어 먼저 묻는다.
 */
export default function FortuneAlarmPrompt({ visible, onClose }: { visible: boolean; onClose(): void }) {
  const { toast } = usePremium();
  const [current, setCurrent] = useState<NotificationSettings | null>(null);
  const [minute, setMinute] = useState(DEFAULT_FORTUNE_MINUTE);
  const [pickTime, setPickTime] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    notificationService.load().then(n => { setCurrent(n); setMinute(n.minute); }).catch(() => {});
  }, [visible]);

  const accept = async () => {
    if (!current || busy) return;
    setBusy(true);
    try {
      const next = { fortune: true, minute, marketing: current.marketing || marketing };
      const { settings, blocked, notice } = await notificationService.apply(current, next);
      onClose();
      if (settings.fortune) toast(`매일 ${formatMinute(settings.minute)}에 오늘의 운세를 알려 드릴게요`);
      if (notice) setTimeout(() => toast(notice), settings.fortune ? 2600 : 0);
      if (blocked) {
        Alert.alert('알림이 꺼져 있어요', '설정에서 운Pick 알림을 허용하면 오늘의 운세를 받아볼 수 있어요.', [
          { text: '닫기', style: 'cancel' },
          { text: '설정 열기', onPress: () => Linking.openSettings() },
        ]);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={s.body}>
        <Mascot name="today" size={84} />
        <Text style={[txt.h2, s.center, { marginTop: 8 }]}>내일 운세도 알려 드릴까요?</Text>
        <Text style={[txt.small, s.center, { marginTop: 4 }]}>매일 정한 시간에 오늘의 운세가 도착하면 알려 드려요</Text>

        <View style={s.timeBox}>
          <PressableScale onPress={() => setPickTime(v => !v)} scaleTo={0.99} style={s.timeRow} accessibilityRole="button" accessibilityLabel={`알림 시간 ${formatMinute(minute)}`} accessibilityHint={pickTime ? '시간 고르기를 닫아요' : '알림 받을 시간을 바꿔요'} accessibilityState={{ expanded: pickTime }}>
            <FigmaAsset name="time" />
            <Text style={s.timeLabel}>알림 시간</Text>
            <Text style={s.timeValue}>{formatMinute(minute)}</Text>
            <Text style={s.timeChange}>{pickTime ? '완료' : '바꾸기'}</Text>
          </PressableScale>
          </View>
        {pickTime && <View style={s.wheel}><FortuneTimeWheel value={minute} onChange={setMinute} /></View>}

        {current && !current.marketing && (
          <View style={s.marketing}>
            <CheckRow checked={marketing} onPress={() => setMarketing(v => !v)} label="[선택] 이벤트·혜택 알림도 받을게요 (광고성 정보)" />
          </View>
        )}
      </View>
      <PrimaryButton label={busy ? '켜는 중…' : '알림 받기'} onPress={accept} disabled={busy || !current} />
      <PrimaryButton label="나중에" variant="text" onPress={onClose} style={{ marginTop: 4 }} />
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  body: { alignItems: 'center', marginBottom: 14 },
  center: { textAlign: 'center' },
  timeBox: { alignSelf: 'stretch', marginTop: 18, borderRadius: radius.lg, backgroundColor: colors.cream },
  timeRow: { height: 48, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 },
  timeLabel: { ...profileType(14, '600', 18, -0.6), flex: 1 },
  timeValue: profileType(14, '700', 18, -0.6, colors.ink),
  timeChange: { ...profileType(13, '500', 18, -0.5, colors.inkSub), marginLeft: 6, textDecorationLine: 'underline' },
  wheel: { alignSelf: 'stretch', marginTop: 8 },
  marketing: { alignSelf: 'stretch', marginTop: 10 },
});
