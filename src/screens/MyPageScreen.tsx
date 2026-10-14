import React, { useEffect, useRef, useState } from 'react';
import { Alert, Linking, Platform, StyleSheet, Switch, Text, View } from 'react-native';
import { useNavigation } from '@/navigation/compat';
import { LinearGradient } from 'expo-linear-gradient';
import Screen from '../components/Screen';
import Card from '../components/Card';
import PressableScale from '../components/PressableScale';
import SectionHeader from '../components/SectionHeader';
import Icon, { IconName } from '../components/Icon';
import { BRAND, LogoMark } from '../components/BrandMark';
import Disclaimer from '../components/Disclaimer';
import BottomSheet from '../components/BottomSheet';
import OptionChip from '../components/OptionChip';
import Segmented from '../components/Segmented';
import { Appearance } from 'react-native';
import { ThemePref, readThemePrefSync, saveThemePref } from '../theme/themePref';
import { useApp } from '../context/AppContext';
import { usePremium } from '../context/PremiumContext';
import { Coin } from '../components/premium/Kit';
import { fmtP } from '../services/premium/catalog';
import { providerLabel } from '../services/auth/authService';
import { storage, NotificationSettings } from '../services/storage/storageService';
import { notificationService } from '../services/notificationService';
import { MBTI_INFO, MBTI_LIST } from '../data/mbtiData';
import { colors, gradients } from '../theme/colors';
import { fonts, radius, shadow, txt } from '../theme/typography';
import appJson from '../../app.json';

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
  const { user, fortune, resetProfile, account, signOut, deleteAccount, saveUser } = useApp();
  const { points, ownedCount, toast } = usePremium();
  const [mbtiSheet, setMbtiSheet] = useState(false);
  const [theme, setTheme] = useState<ThemePref>(readThemePrefSync());
  const nav = useNavigation();
  const [noti, setNoti] = useState<NotificationSettings | null>(null);
  const [resetArm, setResetArm] = useState(false);
  const [deleteArm, setDeleteArm] = useState(false);
  const armTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => { storage.getNotificationSettings().then(setNoti); return () => clearTimeout(armTimer.current); }, []);
  if (!user) return null;

  const updateNoti = async (next: NotificationSettings) => {
    setNoti(next);
    await notificationService.schedule(next, user.nickname);
  };

  // 웹에서는 Alert 버튼이 동작하지 않아 두 번 눌러 확인한다
  const confirmReset = () => {
    if (Platform.OS !== 'web') {
      Alert.alert('프로필을 다시 입력할까요?', '저장된 운세 기록도 함께 초기화돼요.', [
        { text: '취소', style: 'cancel' },
        { text: '다시 입력하기', style: 'destructive', onPress: resetProfile },
      ]);
      return;
    }
    if (!resetArm) {
      setResetArm(true);
      armTimer.current = setTimeout(() => setResetArm(false), 4000);
      return;
    }
    clearTimeout(armTimer.current);
    setResetArm(false);
    resetProfile();
  };

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
            <LogoMark size={26} fg={'#F4EDDF'} />
          </View>
          {fortune ? (
            <View style={s.todayRow}>
              <Text style={s.todayLabel}>오늘의 종합운</Text>
              <Text style={s.todayScore}>{fortune.combined.totalScore}점</Text>
            </View>
          ) : null}
        </LinearGradient>
      </View>

      <SectionHeader title="내 프로필" caption={resetArm ? '저장된 정보가 모두 지워져요' : undefined} action={resetArm ? '한 번 더 누르면 초기화' : '다시 입력'} onAction={confirmReset} />
      <Card style={s.group}>
        <PressableScale onPress={() => setMbtiSheet(true)} scaleTo={0.99} accessibilityLabel="MBTI 바꾸기">
          <Row icon="sparkle" label="MBTI" value={`${user.mbti}${user.mbtiUnknown ? ' (추정)' : ''} ›`} />
        </PressableScale>
        <Row icon="heart" label="혈액형" value={`${user.bloodType}형`} />
        <Row icon="palette" label="생년월일" value={user.birthDate.replace(/-/g, '.')} />
        <Row icon="clock" label="출생시간" value={user.birthTime ?? '모름'} />
        <Row icon="user" label="성별" value={user.gender === 'female' ? '여성' : '남성'} last={!user.occupation} />
        {user.occupation ? <Row icon="crown" label="직업" value={user.occupation} last /> : null}
      </Card>

      <SectionHeader title="화면 모드" caption={Platform.OS === 'web' ? undefined : '바꾸면 앱을 다시 열 때 모든 화면에 적용돼요'} />
      <Segmented<ThemePref>
        options={[{ key: 'system', label: '시스템' }, { key: 'light', label: '라이트' }, { key: 'dark', label: '다크' }]}
        value={theme}
        onChange={async t => {
          setTheme(t);
          await saveThemePref(t);
          if (Platform.OS === 'web') { location.reload(); return; }
          Appearance.setColorScheme?.(t === 'system' ? 'unspecified' : t);
          toast('앱을 다시 열면 모든 화면에 적용돼요');
        }}
      />

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

      <SectionHeader title="포인트" />
      <Card style={{ paddingVertical: 4, paddingHorizontal: 16 }}>
        <View style={[s.row, { paddingVertical: 12 }]}>
          <View style={[s.rowIcon, { width: 42, height: 42, borderRadius: 21 }]}><Coin size={22} /></View>
          <View style={{ flex: 1 }}>
            <Text style={txt.caption}>보유 포인트</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: colors.purple }}>{fmtP(points)}</Text>
          </View>
          <PressableScale onPress={() => nav.navigate('Wallet')} style={s.charge} scaleTo={0.95}>
            <Text style={{ color: colors.white, fontSize: 14, fontWeight: '700' }}>충전</Text>
          </PressableScale>
        </View>
        {([['記', '이용 내역 · 요금 안내', () => nav.navigate('Wallet')], ['圖', `프리미엄 콘텐츠 · 보유 ${ownedCount}개`, () => nav.navigate('Tabs', { screen: 'Content' })]] as const).map(([e, t, go]) => (
          <PressableScale key={e} onPress={go} style={[s.row, s.topBorder]} scaleTo={0.98}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.purpleSoft, width: 32, textAlign: 'center' }}>{e}</Text>
            <Text style={[s.rowLabel, { fontWeight: '600' }]}>{t}</Text>
            <Icon name="chevronRight" size={18} color={colors.inkMute} />
          </PressableScale>
        ))}
      </Card>

      <SectionHeader title="계정" />
      {account ? (
        <Card style={s.group}>
          <Row icon="user" label="로그인 방법" value={providerLabel(account.provider)} />
          <Row icon="mail" label="이메일" value={account.email ?? '제공 안 함'} last />
        </Card>
      ) : (
        <Card style={s.group}>
          <PressableScale onPress={() => nav.navigate('Login')} style={s.row} scaleTo={0.98} accessibilityLabel="로그인하기">
            <View style={{ flex: 1 }}>
              <Text style={[s.rowLabel, { fontWeight: '600' }]}>로그인하기</Text>
              <Text style={[txt.small, { marginTop: 2 }]}>로그인하면 포인트로 유료 콘텐츠를 열고, 다른 기기에서도 이어 볼 수 있어요.</Text>
            </View>
            <Icon name="chevronRight" size={18} color={colors.inkMute} />
          </PressableScale>
        </Card>
      )}
      <SectionHeader title="정보" />
      <Card style={s.group}>
        {([['이용약관', () => nav.navigate('Legal', { doc: 'terms' })], ['개인정보처리방침', () => nav.navigate('Legal', { doc: 'privacy' })], ['문의하기', () => Linking.openURL('mailto:help@woonpick.com?subject=' + encodeURIComponent('[운Pick] 문의'))]] as const).map(([t, go], i, a) => (
          <PressableScale key={t} onPress={go} style={[s.row, i < a.length - 1 && s.border]} scaleTo={0.98}>
            <Text style={s.rowLabel}>{t}</Text>
            <Icon name="chevronRight" size={18} color={colors.inkMute} />
          </PressableScale>
        ))}
      </Card>
      <Text style={[txt.caption, { textAlign: 'center', marginTop: 10 }]}>{BRAND.name} {appJson.expo.version} · {BRAND.slogan}</Text>

      {account ? <View style={s.accountActions}>
        <PressableScale onPress={() => signOut()} hitSlop={8}><Text style={s.accountLink}>로그아웃</Text></PressableScale>
        <View style={s.sep} />
        <PressableScale
          hitSlop={8}
          onPress={() => {
            const msg = '프로필 · 운세 기록 · 포인트가 모두 지워지고 되돌릴 수 없어요.';
            if (Platform.OS !== 'web') {
              Alert.alert('회원 탈퇴할까요?', msg, [{ text: '취소', style: 'cancel' }, { text: '탈퇴하기', style: 'destructive', onPress: () => deleteAccount() }]);
              return;
            }
            if (!deleteArm) { setDeleteArm(true); setTimeout(() => setDeleteArm(false), 4000); return; }
            deleteAccount();
          }}
        >
          <Text style={[s.accountLink, deleteArm && { color: colors.danger, fontWeight: '700' }]}>{deleteArm ? '한 번 더 누르면 탈퇴' : '회원 탈퇴'}</Text>
        </PressableScale>
      </View> : null}
      {deleteArm ? <Text style={[txt.caption, { textAlign: 'center', marginTop: 6 }]}>프로필 · 운세 기록 · 포인트가 모두 지워지고 되돌릴 수 없어요.</Text> : null}

      <Disclaimer />
      <BottomSheet visible={mbtiSheet} onClose={() => setMbtiSheet(false)}>
        <Text style={txt.h2}>MBTI를 골라 주세요</Text>
        <Text style={[txt.small, { marginTop: 4 }]}>{user.mbtiUnknown ? '지금은 사주로 추정한 값이에요. 내 MBTI를 고르면 운세가 더 정확해져요.' : '바꾸면 오늘의 운세가 다시 계산돼요.'}</Text>
        <View style={s.mbtiGrid}>
          {MBTI_LIST.map(t => (
            <OptionChip key={t} style={{ width: '23%' }} label={t} sub={MBTI_INFO[t].nickname} selected={!user.mbtiUnknown && user.mbti === t}
              onPress={async () => { setMbtiSheet(false); await saveUser({ ...user, mbti: t, mbtiUnknown: false }); toast(`MBTI를 ${t}로 바꿨어요`); }} />
          ))}
        </View>
      </BottomSheet>
    </Screen>
  );
}

const s = StyleSheet.create({
  cardWrap: { borderRadius: radius.xl, backgroundColor: colors.heroBg },
  card: { borderRadius: radius.xl, padding: 20 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.moon, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontWeight: '800', color: colors.purpleDeep },
  name: { fontSize: 20, fontWeight: '800', color: colors.white, letterSpacing: -0.5 },
  meta: { fontSize: 13, color: 'rgba(255,255,255,0.72)', marginTop: 2 },
  todayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.22)' },
  todayLabel: { fontSize: 13, color: 'rgba(255,255,255,0.72)', fontWeight: '600' },
  todayScore: { fontFamily: fonts.serif, fontSize: 18, color: colors.moon, fontWeight: '700' },
  group: { paddingVertical: 2, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 54 },
  border: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.lineStrong },
  rowIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.lavenderSoft, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 15, color: colors.ink, fontWeight: '500' },
  rowValue: { fontSize: 15, color: colors.inkSub, fontWeight: '600' },
  mbtiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  hours: { flexDirection: 'row', gap: 8, paddingTop: 14 },
  hour: { flex: 1, height: 40, borderRadius: radius.sm, backgroundColor: colors.lavenderSoft, alignItems: 'center', justifyContent: 'center' },
  hourOn: { backgroundColor: colors.navy },
  hourText: { fontSize: 13, fontWeight: '700', color: colors.purple },
  preview: { fontSize: 12, color: colors.inkMute, paddingVertical: 14 },
  topBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
  accountActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 16 },
  accountLink: { fontSize: 14, color: colors.inkMute, fontWeight: '500' },
  sep: { width: 1, height: 12, backgroundColor: colors.lineStrong },
  charge: { height: 40, paddingHorizontal: 16, borderRadius: radius.md, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
});
