import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Screen from '../components/Screen';
import Card from '../components/Card';
import PressableScale from '../components/PressableScale';
import SectionHeader from '../components/SectionHeader';
import Icon, { IconName } from '../components/Icon';
import { Crescent } from '../components/BrandMark';
import Disclaimer from '../components/Disclaimer';
import { useApp } from '../context/AppContext';
import { storage, NotificationSettings } from '../services/storage/storageService';
import { notificationService } from '../services/notificationService';
import { MBTI_INFO } from '../data/mbtiData';
import { colors, gradients } from '../theme/colors';
import { radius, shadow, txt } from '../theme/typography';

const HOURS = [7, 8, 9];

function Row({ icon, label, value, last, right }: { icon: IconName; label: string; value?: string; last?: boolean; right?: React.ReactNode }) {
  return (
    <View style={[s.row, !last && s.border]}>
      <View style={s.rowIcon}><Icon name={icon} size={18} color={colors.purpleSoft} /></View>
      <Text style={s.rowLabel}>{label}</Text>
      {right ?? <Text style={s.rowValue}>{value}</Text>}
    </View>
  );
}

export default function MyPageScreen() {
  const { user, fortune, resetProfile } = useApp();
  const [noti, setNoti] = useState<NotificationSettings | null>(null);

  useEffect(() => { storage.getNotificationSettings().then(setNoti); }, []);
  if (!user) return null;

  const updateNoti = async (next: NotificationSettings) => {
    setNoti(next);
    await notificationService.schedule(next, user.nickname);
  };

  const confirmReset = () => Alert.alert('프로필을 다시 입력할까요?', '저장된 운세 기록도 함께 초기화돼요.', [
    { text: '취소', style: 'cancel' },
    { text: '다시 입력하기', style: 'destructive', onPress: resetProfile },
  ]);

  return (
    <Screen largeTitle="마이">
      {/* 브랜드 카드: 홈 히어로와 같은 그라디언트로 앱 전체 톤을 묶는다 */}
      <View style={[s.cardWrap, shadow.hero]}>
        <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 0.9, y: 1 }} style={s.card}>
          <View style={s.cardTop}>
            <View style={s.avatar}><Text style={s.avatarText}>{user.nickname.slice(0, 1)}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{user.nickname}</Text>
              <Text style={s.meta}>{MBTI_INFO[user.mbti].nickname} {user.mbti} · {user.bloodType}형</Text>
            </View>
            <Crescent size={22} color={colors.moon} cut="#4A358F" />
          </View>
          {fortune ? (
            <View style={s.todayRow}>
              <Text style={s.todayLabel}>오늘의 종합운</Text>
              <Text style={s.todayScore}>{fortune.combined.totalScore}점</Text>
            </View>
          ) : null}
        </LinearGradient>
      </View>

      <SectionHeader title="내 프로필" action="다시 입력" onAction={confirmReset} />
      <Card style={s.group}>
        <Row icon="sparkle" label="MBTI" value={user.mbti} />
        <Row icon="heart" label="혈액형" value={`${user.bloodType}형`} />
        <Row icon="palette" label="생년월일" value={user.birthDate.replace(/-/g, '.')} />
        <Row icon="clock" label="출생시간" value={user.birthTime ?? '모름'} />
        <Row icon="user" label="성별" value={user.gender === 'female' ? '여성' : '남성'} last={!user.occupation} />
        {user.occupation ? <Row icon="crown" label="직업" value={user.occupation} last /> : null}
      </Card>

      <SectionHeader title="알림" />
      {noti && (
        <Card style={s.group}>
          <Row
            icon="bell"
            label="아침 운세 알림"
            last={!noti.enabled}
            right={<Switch value={noti.enabled} onValueChange={v => updateNoti({ ...noti, enabled: v })} trackColor={{ true: colors.purpleSoft, false: colors.lineStrong }} thumbColor={colors.white} ios_backgroundColor={colors.lineStrong} />}
          />
          {noti.enabled && (
            <View style={s.hours}>
              {HOURS.map(h => {
                const on = noti.hour === h;
                return (
                  <PressableScale key={h} onPress={() => updateNoti({ ...noti, hour: h })} style={[s.hour, on && s.hourOn]} scaleTo={0.94} haptic accessibilityState={{ selected: on }}>
                    <Text style={[s.hourText, on && { color: colors.white }]}>오전 {h}시</Text>
                  </PressableScale>
                );
              })}
            </View>
          )}
          {noti.enabled && <Text style={s.preview}>“{notificationService.buildMessage(user.nickname)}”</Text>}
        </Card>
      )}

      <SectionHeader title="구독" />
      <Card variant="tinted" tint={colors.lavenderSoft} style={s.plus}>
        <View style={s.plusIcon}><Icon name="crown" size={20} color={colors.money} filled /></View>
        <View style={{ flex: 1 }}>
          <Text style={txt.h3}>오늘나 플러스</Text>
          <Text style={[txt.small, { marginTop: 2 }]}>상세 사주 해석 · AI 궁합 · 월간 리포트</Text>
        </View>
        <View style={s.badge}><Text style={s.badgeText}>준비 중</Text></View>
      </Card>

      <Disclaimer />
    </Screen>
  );
}

const s = StyleSheet.create({
  cardWrap: { borderRadius: radius.xl, backgroundColor: colors.purple },
  card: { borderRadius: radius.xl, padding: 20 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.moon, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontWeight: '800', color: colors.purpleDeep },
  name: { fontSize: 20, fontWeight: '800', color: colors.white, letterSpacing: -0.5 },
  meta: { fontSize: 13, color: 'rgba(255,255,255,0.72)', marginTop: 2 },
  todayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.22)' },
  todayLabel: { fontSize: 13, color: 'rgba(255,255,255,0.72)', fontWeight: '600' },
  todayScore: { fontSize: 17, color: colors.moon, fontWeight: '800' },
  group: { paddingVertical: 2, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 54 },
  border: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.lineStrong },
  rowIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.lavenderSoft, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 15, color: colors.ink, fontWeight: '500' },
  rowValue: { fontSize: 15, color: colors.inkSub, fontWeight: '600' },
  hours: { flexDirection: 'row', gap: 8, paddingTop: 14 },
  hour: { flex: 1, height: 40, borderRadius: radius.sm, backgroundColor: colors.lavenderSoft, alignItems: 'center', justifyContent: 'center' },
  hourOn: { backgroundColor: colors.purple },
  hourText: { fontSize: 13, fontWeight: '700', color: colors.purple },
  preview: { fontSize: 12, color: colors.inkMute, paddingVertical: 14 },
  plus: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: colors.lavender },
  plusIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  badge: { backgroundColor: colors.white, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontSize: 11, fontWeight: '700', color: colors.purple },
});
