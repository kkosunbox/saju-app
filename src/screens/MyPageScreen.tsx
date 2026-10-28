import React, { useEffect, useState } from 'react';
import { Alert, Appearance, Platform, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@/navigation/compat';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import MbtiArt from '../components/MbtiArt';
import FigmaAsset, { ProfileAssetName } from '../components/profile/FigmaAsset';
import { profileLine, profileType } from '../theme/profileDesign';
import Screen from '../components/Screen';
import Card from '../components/Card';
import PressableScale from '../components/PressableScale';
import { BRAND } from '../components/BrandMark';
import { SOCIAL_LABEL } from '../components/auth/socialLabels';
import Disclaimer from '../components/Disclaimer';
import BusinessFooter from '../components/BusinessFooter';
import Segmented from '../components/Segmented';
import { ThemePref, readThemePrefSync, saveThemePref } from '../theme/themePref';
import { useApp } from '../context/AppContext';
import { useOpened } from '../services/content/opened';
import { usePremium } from '../context/PremiumContext';
import { fmtN } from '../services/premium/catalog';
import { storage, NotificationSettings } from '../services/storage/storageService';
import { notificationService } from '../services/notificationService';
import { MBTI_INFO } from '../data/mbtiData';
import { placeLabel } from '../services/server/birthPlaceApi';
import { colors } from '../theme/colors';
import { shadow, txt } from '../theme/typography';
import appJson from '../../app.json';

const HOURS = [7, 8, 9];

function Row({ icon, label, value, last, right }: { icon: 'user' | 'mail'; label: string; value?: string; last?: boolean; right?: React.ReactNode }) {
  return (
    <View style={[s.row, !last && s.border]}>
      <View style={s.rowIcon}><FigmaAsset name={icon} /></View>
      <Text style={s.rowLabel}>{label}</Text>
      {right ?? <Text style={s.rowValue}>{value}</Text>}
    </View>
  );
}

function ProfileHeading({ title, action, onAction }: { title: string; action?: string; onAction?(): void }) {
  return <View style={s.sectionHeading}>
    <Text style={[s.sectionTitle, title === '내 프로필' && { letterSpacing: 0 }]} accessibilityRole="header">{title}</Text>
    {action && <PressableScale onPress={onAction} accessibilityLabel={action} hitSlop={10} style={s.sectionAction}><FigmaAsset name="chevron" /></PressableScale>}
  </View>;
}

function ProfileRow({ icon, label, value, last }: { icon: ProfileAssetName; label: string; value: string; last?: boolean }) {
  return <>
    <View style={s.profileRow}>
      <FigmaAsset name={icon} /><Text style={s.profileLabel}>{label}</Text>
      <Text style={s.profileValue}>{value}</Text>
    </View>
    {!last && <View style={s.profileDivider} />}
  </>;
}

export default function MyPageScreen() {
  const { user, fortune, account, signOut, deleteAccount } = useApp();
  const { points, ownedCount, toast } = usePremium();
  const fortuneOpened = useOpened('fortune').opened; // 뽑기 전엔 점수 대신 홈으로 뽑으러 가게 한다
  const [theme, setTheme] = useState<ThemePref>(readThemePrefSync());
  const nav = useNavigation();
  const [noti, setNoti] = useState<NotificationSettings | null>(null);
  const [deleteArm, setDeleteArm] = useState(false);

  useEffect(() => { storage.getNotificationSettings().then(setNoti); }, []);
  if (!user) return null;

  const updateNoti = async (next: NotificationSettings) => {
    setNoti(next);
    await notificationService.schedule(next, user.nickname);
  };
  return (
    <Screen largeTitle="마이" contentStyle={{ paddingTop: 7 }}>
      {/* 프로필 카드 */}
      <View style={[s.cardWrap, shadow.hero]}>
        <View style={s.card}>
          <View style={s.cardTop}>
            <View style={s.avatar}><Text style={s.avatarText}>{user.nickname.slice(0, 1)}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{user.nickname}</Text>
              <Text style={s.meta}>{MBTI_INFO[user.mbti].nickname} {user.mbti} · {user.bloodType}형</Text>
            </View>
            <View style={s.heroMascot}><MbtiArt type={user.mbti} size={46} /></View>
          </View>
          {fortune && fortuneOpened ? (
            <View style={s.todayRow}>
              <Text style={s.todayLabel}>오늘의 종합운</Text>
              <Text style={s.todayScore}>{fortune.combined.totalScore}점</Text>
            </View>
          ) : fortune ? (
            <PressableScale onPress={() => nav.navigate('Home')} scaleTo={0.98} accessibilityLabel="홈에서 오늘의 운세 뽑기" style={s.todayRow}>
              <Text style={s.todayLabel}>오늘의 종합운</Text>
              <Text style={s.todayDraw}>뽑으러 가기 ›</Text>
            </PressableScale>
          ) : null}
        </View>
      </View>

      <ProfileHeading title="내 프로필" action="프로필 수정" onAction={() => router.push('/profile-edit')} />
      <View style={s.profileGroup}>
        <ProfileRow icon="sparkle" label="MBTI" value={`${user.mbti}${user.mbtiUnknown ? ' (추정)' : ''}`} />
        <ProfileRow icon="blood" label="혈액형" value={`${user.bloodType}형`} />
        <ProfileRow icon="calendar" label="생년월일" value={user.birthDate.replace(/-/g, '.')} />
        <ProfileRow icon="time" label="출생시간" value={user.birthTime ?? '모름'} />
        <ProfileRow icon="pin" label="태어난 지역" value={user.birthPlace ? placeLabel(user.birthPlace) : '모름'} />
        <ProfileRow icon="user" label="성별" value={user.gender === 'female' ? '여성' : '남성'} last />
        <View pointerEvents="none" style={s.profileOutline} />
      </View>

      <ProfileHeading title="화면 모드" />
      <Segmented<ThemePref>
        variant="figma"
        options={[{ key: 'system', label: '시스템', renderIcon: () => <FigmaAsset name="system" /> }, { key: 'light', label: '라이트', renderIcon: on => <FigmaAsset name="sun" tint={on ? colors.ink : '#808080'} /> }, { key: 'dark', label: '다크', renderIcon: on => <FigmaAsset name="moon" tint={on ? colors.ink : '#808080'} /> }]}
        value={theme}
        onChange={async t => {
          setTheme(t);
          await saveThemePref(t);
          if (Platform.OS === 'web') { location.reload(); return; }
          Appearance.setColorScheme?.(t === 'system' ? 'unspecified' : t);
          toast('앱을 다시 열면 모든 화면에 적용돼요');
        }}
      />

      <ProfileHeading title="알림" />
      {noti && (
        <Card variant="flat" style={s.notificationCard}>
          <View style={s.notificationTop}>
            <View style={s.notificationIcon}><FigmaAsset name="bell" /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.notificationTitle}>아침 운세 알림</Text>
              <Text style={s.notificationCaption}>새로운 운세와 소식을 놓치지 마세요.</Text>
            </View>
            <PressableScale accessibilityRole="switch" accessibilityLabel="아침 운세 알림" accessibilityState={{ checked: noti.enabled }} onPress={() => updateNoti({ ...noti, enabled: !noti.enabled })} hitSlop={10} style={s.notificationToggle}><FigmaAsset name={noti.enabled ? 'toggleOn' : 'toggleOff'} /></PressableScale>
          </View>
          {noti.enabled && (
            <Segmented variant="figma" options={HOURS.map(h => ({ key: String(h), label: `오전 ${h}시` }))} value={String(noti.hour)} onChange={hour => updateNoti({ ...noti, hour: Number(hour) })} />
          )}
        </Card>
      )}

      <ProfileHeading title="알" />
      <Card style={s.wallet}>
        <View style={s.walletTop}>
          <Image source={require('../../assets/figma/my-page/wallet-mascot.png')} style={{ width: 35, height: 32 }} contentFit="cover" />
          <View style={{ flex: 1 }}>
            <Text style={s.walletCaption}>보유 알</Text>
            <Text style={s.walletCount}>{fmtN(points)}</Text>
          </View>
          <PressableScale onPress={() => nav.navigate('Wallet')} style={s.charge} scaleTo={0.95}>
            <Text style={s.chargeLabel}>충전</Text>
          </PressableScale>
        </View>
        {([['coins', '이용 내역 · 요금 안내', () => nav.navigate('Wallet')], ['premium', `프리미엄 콘텐츠 · 보유 ${ownedCount}개`, () => nav.navigate('Tabs', { screen: 'Content' })]] as const).map(([icon, title, go]) => (
          <PressableScale key={icon} onPress={go} style={s.walletRow} scaleTo={0.98}>
            <FigmaAsset name={icon} />
            <Text style={s.menuLabel}>{title}</Text>
            <View style={s.menuArrow}><FigmaAsset name="chevron" /></View>
          </PressableScale>
        ))}
      </Card>

      <ProfileHeading title="계정" />
      {account ? (
        <Card style={s.group}>
          <Row icon="user" label="로그인 방법" value={account.loginMethods.map((m) => (m === 'email' ? '이메일' : SOCIAL_LABEL[m])).join(' · ') || '소셜 계정'} />
          <Row icon="mail" label="이메일" value={account.email ?? '제공 안 함'} last />
        </Card>
      ) : (
        <Card style={[s.group, { paddingVertical: 0 }]}>
          <PressableScale onPress={() => nav.navigate('Login')} style={[s.row, s.loginRow]} scaleTo={0.98} accessibilityLabel="로그인하기">
            <View style={s.loginIcon}><FigmaAsset name="login" /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.notificationTitle}>로그인하기</Text>
              <Text style={[s.notificationCaption, { marginTop: 4 }]}>로그인하면 유료 콘텐츠를 열고, 다른 기기에서도 이어 볼 수 있어요.</Text>
            </View>
            <View style={[s.menuArrow, { marginLeft: -7 }]}><FigmaAsset name="chevron" /></View>
          </PressableScale>
        </Card>
      )}
      <ProfileHeading title="정보" />
      <Card style={s.group}>
        {([['이용약관', () => nav.navigate('Legal', { doc: 'terms' })], ['개인정보처리방침', () => nav.navigate('Legal', { doc: 'privacy' })], ['문의하기', () => nav.navigate('Inquiry')]] as const).map(([t, go], i, a) => (
          <PressableScale key={t} onPress={go} style={[s.row, i < a.length - 1 && s.border]} scaleTo={0.98}>
            <Text style={s.menuLabel}>{t}</Text>
            <View style={s.menuArrow}><FigmaAsset name="chevron" /></View>
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
            const msg = '프로필 · 운세 기록 · 알이 모두 지워지고 되돌릴 수 없어요.';
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
      {deleteArm ? <Text style={[txt.caption, { textAlign: 'center', marginTop: 6 }]}>프로필 · 운세 기록 · 알이 모두 지워지고 되돌릴 수 없어요.</Text> : null}

      <Disclaimer />
      <BusinessFooter style={{ marginTop: 28 }} />
    </Screen>
  );
}

const s = StyleSheet.create({
  cardWrap: { borderRadius: 12, backgroundColor: colors.heroBg },
  card: { borderRadius: 12, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, minHeight: 120 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF386', borderWidth: 1, borderColor: colors.white, alignItems: 'center', justifyContent: 'center', transform: [{ translateY: 1 }] },
  avatarText: profileType(14, '700', 18, -0.7, '#000000'),
  name: profileType(20, '800', 24, -0.8, colors.white),
  meta: { ...profileType(12, '500', 18, -0.6, '#DDDDDD'), marginTop: 4 },
  heroMascot: { width: 46, height: 46, alignItems: 'center' },
  todayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#333333' },
  todayLabel: profileType(12, '500', 17, -0.6, '#DDDDDD'),
  todayScore: profileType(16, '700', 17, -0.8, colors.white),
  todayDraw: profileType(14, '700', 17, -0.7, colors.moon),
  sectionHeading: { marginTop: 32, marginBottom: 16, minHeight: 21, justifyContent: 'center' },
  sectionTitle: profileType(18, '600', 21, -0.72),
  sectionAction: { position: 'absolute', right: 0, top: -3.5, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  profileGroup: { borderRadius: 12, overflow: 'hidden', backgroundColor: colors.cream },
  profileOutline: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderWidth: 1, borderColor: profileLine, borderRadius: 12 },
  profileRow: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 16 },
  profileLabel: { ...profileType(13, '600', 18, -0.65), flex: 1 },
  profileValue: profileType(13, '600', 18, -0.65),
  profileDivider: { height: 1, backgroundColor: profileLine },
  group: { paddingVertical: 2, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 54 },
  loginRow: { paddingVertical: 12, minHeight: 81 },
  loginIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  border: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.lineStrong },
  rowIcon: { width: 16, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 15, color: colors.ink, fontWeight: '500' },
  rowValue: { fontSize: 15, color: colors.inkSub, fontWeight: '600' },
  notificationCard: { padding: 7, borderColor: profileLine },
  notificationTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 8, paddingTop: 4, minHeight: 55 },
  notificationIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.lavenderSoft, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  notificationToggle: { marginTop: 8 },
  notificationTitle: profileType(14, '700', 17, -0.56, colors.ink),
  notificationCaption: { ...profileType(13, '400', 18, -0.65), marginTop: 4 },
  wallet: { padding: 0, overflow: 'hidden' },
  walletTop: { minHeight: 64, paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 16 },
  walletCaption: profileType(13, '400', 18, -0.65),
  walletCount: { ...profileType(24, '700', 29, -1.2), marginTop: 1 },
  walletRow: { height: 55, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: profileLine },
  menuLabel: { ...profileType(14, '600', 18, -0.7), flex: 1 },
  menuArrow: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  accountActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 16 },
  accountLink: { fontSize: 14, color: colors.inkMute, fontWeight: '500' },
  sep: { width: 1, height: 12, backgroundColor: colors.lineStrong },
  charge: { height: 40, paddingHorizontal: 20, borderRadius: 5, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  chargeLabel: profileType(14, '600', 17, -0.28, '#EDEDED'),
});
