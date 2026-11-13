import React, { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, DevSettings, Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Updates from 'expo-updates';
import { useFocusEffect, useNavigation } from '@/navigation/compat';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { profileRequestApi, profileRequestKeys } from '../services/server/profileRequestApi';
import MbtiArt from '../components/MbtiArt';
import FigmaAsset from '../components/profile/FigmaAsset';
import { profileLine, profileType } from '../theme/profileDesign';
import Screen from '../components/Screen';
import Card from '../components/Card';
import PressableScale from '../components/PressableScale';
import { BRAND } from '../components/BrandMark';
import { SOCIAL_LABEL } from '../components/auth/socialLabels';
import Disclaimer from '../components/Disclaimer';
import BusinessFooter from '../components/BusinessFooter';
import Segmented from '../components/Segmented';
import BottomSheet from '../components/BottomSheet';
import PrimaryButton from '../components/PrimaryButton';
import { ThemePref, readThemePrefSync, saveThemePref } from '../theme/themePref';
import { useApp } from '../context/AppContext';
import { useOpened } from '../services/content/opened';
import { usePremium } from '../context/PremiumContext';
import SolidIcon from '../components/SolidIcon';
import { CROWN, SubscriptionBadge } from '../components/premium/SubscriptionBadge';
import { fmtN } from '../services/premium/catalog';
import { NotificationSettings, formatMinute, notificationService } from '../services/notificationService';
import FortuneTimeWheel from '../components/notification/FortuneTimeWheel';
import type { PushPermission } from '../services/push';
import { MBTI_INFO } from '../data/mbtiData';
import { RELATIONSHIP_LABEL, User } from '../types';
import { colors } from '../theme/colors';
import { shadow, txt } from '../theme/typography';
import appJson from '../../app.json';

const THEME_LABEL: Record<ThemePref, string> = { system: '시스템', light: '라이트', dark: '다크' };

/** 색은 앱 시작 때 정해지므로(colors.ts) 모드를 바꾸면 앱을 다시 불러와 적용한다. 앱은 안내 시트를 거치고 웹은 바로 새로고침 */
async function reloadApp() {
  if (Platform.OS === 'web') { location.reload(); return; }
  try { await Updates.reloadAsync(); } catch { DevSettings.reload(); }
}

function Row({ icon, label, value, last, right }: { icon: 'user' | 'mail'; label: string; value?: string; last?: boolean; right?: React.ReactNode }) {
  return (
    <View style={[s.row, !last && s.border]}>
      <View style={s.rowIcon}><FigmaAsset name={icon} /></View>
      <Text style={s.rowLabel}>{label}</Text>
      {right ?? <Text style={s.rowValue}>{value}</Text>}
    </View>
  );
}

function ProfileHeading({ title }: { title: string }) {
  return <View style={s.sectionHeading}>
    <Text style={[s.sectionTitle, title === '내 프로필' && { letterSpacing: 0 }]} accessibilityRole="header">{title}</Text>
  </View>;
}

const PROFILE_PAGE_SIZE = 10;

/** 공통으로 조회한 프로필을 10개씩 표시한다. 긴 목록은 이 영역 안에서만 스크롤한다. */
function MyProfiles({ profiles }: { profiles: User[] }) {
  const [shown, setShown] = useState(PROFILE_PAGE_SIZE);
  const [revoking, setRevoking] = useState<number | null>(null);
  const { refreshProfiles } = useApp();
  const { toast } = usePremium();
  const qc = useQueryClient();
  const requests = useQuery({ queryKey: profileRequestKeys.open, queryFn: profileRequestApi.listOpen });
  // 요청 링크로 추가된 프로필도 마이 탭에 돌아오면 갱신한다.
  useFocusEffect(useCallback(() => {
    void refreshProfiles().catch(() => {});
    void qc.invalidateQueries({ queryKey: profileRequestKeys.open });
  }, [refreshProfiles, qc]));

  const revoke = async (id: number) => {
    if (revoking !== null) return;
    setRevoking(id);
    try {
      await profileRequestApi.revoke(id);
      await qc.invalidateQueries({ queryKey: profileRequestKeys.open });
    } catch {
      toast('요청을 취소하지 못했어요. 잠시 후 다시 시도해 주세요');
    } finally {
      setRevoking(null);
    }
  };

  return (
    <>
      <View style={s.profileGroup}>
        <ScrollView
          style={s.profileScroll}
          nestedScrollEnabled
          showsVerticalScrollIndicator
          bounces={false}
          accessibilityLabel="프로필 목록"
          scrollEventThrottle={100}
          onScroll={({ nativeEvent: { layoutMeasurement, contentOffset, contentSize } }) => {
            if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 40) {
              setShown(n => n < profiles.length ? Math.min(n + PROFILE_PAGE_SIZE, profiles.length) : n);
            }
          }}
        >
          {profiles.slice(0, shown).map(p => (
            <React.Fragment key={p.profileId}>
              <PressableScale onPress={() => router.push({ pathname: '/profiles/[id]', params: { id: String(p.profileId) } })} scaleTo={0.99} style={s.personRow} accessibilityLabel={`${p.nickname} 프로필 수정`}>
                <View style={{ flex: 1 }}>
                  <View style={s.personName}>
                    <Text style={s.profileLabel}>{p.nickname}</Text>
                    {p.isPrimary ? <Text style={s.primaryTag}>대표</Text> : null}
                  </View>
                  <Text style={s.personMeta} numberOfLines={1}>
                    {RELATIONSHIP_LABEL[p.relationship ?? 'other']} · {(p.birthDateInput ?? p.birthDate).replace(/-/g, '.')}{p.calendarType === 'lunar' ? ' (음력)' : ''} · {p.birthTime ?? '시간 모름'} · {p.mbti}{p.mbtiUnknown ? ' (추정)' : ''}
                  </Text>
                </View>
                <FigmaAsset name="chevron" />
              </PressableScale>
              <View style={s.profileDivider} />
            </React.Fragment>
          ))}
        </ScrollView>
        <PressableScale onPress={() => router.push('/profiles/new')} scaleTo={0.99} style={s.personRow} accessibilityLabel="프로필 추가">
          <Text style={[s.profileLabel, { color: colors.purpleSoft }]}>+ 프로필 추가</Text>
        </PressableScale>
        <View pointerEvents="none" style={s.profileOutline} />
      </View>
      {requests.data?.length ? (
        <View style={s.profileRequests}>
          <Text style={txt.bodyStrong} accessibilityRole="header">답을 기다리는 요청</Text>
          <ScrollView style={s.profileScroll} nestedScrollEnabled showsVerticalScrollIndicator>
            {requests.data.map(r => (
              <View key={r.id} style={s.profileRequestRow}>
                <View style={{ flex: 1 }}>
                  <Text style={txt.bodyStrong} numberOfLines={1}>{r.nickname ?? RELATIONSHIP_LABEL[r.relationship]}</Text>
                  <Text style={txt.caption}>{RELATIONSHIP_LABEL[r.relationship]} · {r.expiresAt.slice(0, 10).replace(/-/g, '.')}까지</Text>
                </View>
                <PrimaryButton label={revoking === r.id ? '취소 중…' : '요청 취소'} variant="text" small disabled={revoking !== null} onPress={() => revoke(r.id)} />
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </>
  );
}

export default function MyPageScreen() {
  const { user, profiles, fortune, account, signOut, deleteAccount } = useApp();
  const { points, ownedCount, toast, subscription } = usePremium();
  const fortuneOpened = useOpened('fortune').opened; // 뽑기 전엔 점수 대신 홈으로 뽑으러 가게 한다
  const [theme] = useState<ThemePref>(readThemePrefSync());
  const [themeAsk, setThemeAsk] = useState<ThemePref | null>(null);
  const nav = useNavigation();
  const [noti, setNoti] = useState<NotificationSettings | null>(null);
  const [timeDraft, setTimeDraft] = useState<number | null>(null); // 시간 고르기 시트 — 저장을 눌러야 바뀐다
  const [deleteArm, setDeleteArm] = useState(false);

  const [permission, setPermission] = useState<PushPermission | null>(null);
  // 마이 탭은 한 번 열면 계속 떠 있다 — 홈의 권유 시트에서 켜고 와도 맞도록 탭에 들어올 때마다 다시 읽는다
  const reloadNoti = useCallback(() => {
    notificationService.load().then(setNoti);
    notificationService.permission().then(setPermission);
  }, []);
  useFocusEffect(reloadNoti);
  // 설정 앱에서 권한을 켜고 돌아오면 지금 설정대로 등록하고 다시 읽는다
  useEffect(() => {
    const sub = AppState.addEventListener('change', st => {
      if (st === 'active') notificationService.resync().finally(reloadNoti);
    });
    return () => sub.remove();
  }, [reloadNoti]);
  if (!user) return null;

  const blockedAlert = () => Alert.alert('이 기기 알림 권한이 꺼져 있어요', '알림은 켜 두었어요. 설정에서 운Pick 알림을 허용하면 바로 받아볼 수 있어요.', [
    { text: '닫기', style: 'cancel' },
    { text: '설정 열기', onPress: () => Linking.openSettings() },
  ]);
  // 알림을 켜 두었는데 이 기기 알림 권한이 없을 때 (권한을 거절했거나, 다른 기기에서 동의 등): 권한만 다시 받는다
  const enablePermission = async () => {
    if (!noti) return;
    if (permission === 'denied') { blockedAlert(); return; }
    const { granted, blocked } = await notificationService.enablePermission(noti);
    setPermission(await notificationService.permission());
    if (blocked) blockedAlert();
    else if (granted) toast('이제 알림을 받을 수 있어요');
  };

  const updateNoti = async (next: NotificationSettings) => {
    if (!noti) return;
    const prev = noti;
    setNoti(next);
    const { settings, blocked, notice } = await notificationService.apply(prev, next);
    setNoti(settings);
    setPermission(await notificationService.permission());
    if (notice) toast(notice);
    if (blocked) blockedAlert();
  };
  // 켜 둔 알림이 있는데 OS 권한이 없으면 켜진 그대로 두고 안내한다 (운세가 켜졌으면 운세 칸에, 아니면 이벤트 칸에 한 번만)
  const needPermission = Platform.OS !== 'web' && permission !== null && permission !== 'granted';
  const permissionHint = (
    <PressableScale onPress={enablePermission} scaleTo={0.99} style={s.alarmSub} accessibilityRole="button" accessibilityLabel={`이 기기 알림 권한이 꺼져 있어 아직 받을 수 없어요. ${permission === 'denied' ? '설정에서 켜기' : '알림 켜기'}`} accessibilityHint={permission === 'denied' ? '설정 앱으로 안내해요' : '알림 권한을 물어요'}>
      <Text style={s.permissionText}>이 기기 알림 권한이 꺼져 있어 아직 받을 수 없어요</Text>
      <Text style={s.permissionAction}>{permission === 'denied' ? '설정에서 켜기' : '알림 켜기'}</Text>
    </PressableScale>
  );

  return (
    <Screen largeTitle="마이" contentStyle={{ paddingTop: 7 }}>
      {/* 프로필 카드 */}
      <View style={[s.cardWrap, shadow.hero]}>
        <View style={s.card}>
          <View style={s.cardTop}>
            <View style={s.avatar}><Text style={s.avatarText}>{user.nickname.slice(0, 1)}</Text></View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={s.name}>{user.nickname}</Text>
                {/* 구독 중이면 이름 옆 왕관 칩 — 누르면 구독 관리 */}
                {subscription ? (
                  <PressableScale onPress={() => router.push('/subscription')} scaleTo={0.95} accessibilityLabel="프리미엄 구독 관리">
                    <SubscriptionBadge label="프리미엄" small />
                  </PressableScale>
                ) : null}
              </View>
              <Text style={s.meta}>{MBTI_INFO[user.mbti].nickname} {user.mbti}</Text>
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

      {/* 프로필 — 나와 함께 운세를 보는 사람들 (대표 프로필이 오늘의 운세 · 운알톡 기준) */}
      <ProfileHeading title="프로필" />
      <MyProfiles key={user.id} profiles={profiles} />

      <ProfileHeading title="화면 모드" />
      <Segmented<ThemePref>
        variant="figma"
        options={[{ key: 'system', label: '시스템', renderIcon: () => <FigmaAsset name="system" /> }, { key: 'light', label: '라이트', renderIcon: on => <FigmaAsset name="sun" tint={on ? colors.ink : '#808080'} /> }, { key: 'dark', label: '다크', renderIcon: on => <FigmaAsset name="moon" tint={on ? colors.ink : '#808080'} /> }]}
        value={theme}
        onChange={async t => {
          if (t === theme) return;
          if (Platform.OS !== 'web') { setThemeAsk(t); return; }
          await saveThemePref(t);
          reloadApp();
        }}
      />

      <ProfileHeading title="알림" />
      {Platform.OS === 'web' ? (
        // 웹은 앱 푸시를 받을 수 없어 켜지 않는다 — 켜 봐야 어디서도 알림이 오지 않는다
        <Card variant="flat" style={s.alarmCard}>
          <View style={s.alarmSection}>
            <View style={s.alarmHead}>
              <View style={s.notificationIcon}><FigmaAsset name="bell" /></View>
              <View style={s.alarmText}>
                <Text style={s.notificationTitle}>오늘의 운세, 알림으로 먼저 받아 보세요</Text>
                <Text style={s.alarmCaption}>운Pick 앱에서 알림을 켜면 매일 원하는 시간에 오늘의 행운을 가장 먼저 알려 드려요.</Text>
              </View>
            </View>
          </View>
        </Card>
      ) : noti && (
        <Card variant="flat" style={s.alarmCard}>
          <View style={s.alarmSection}>
            <View style={s.alarmHead}>
              <View style={s.notificationIcon}><FigmaAsset name="bell" /></View>
              <View style={s.alarmText}>
                <Text style={s.notificationTitle}>오늘의 운세 알림</Text>
                <Text style={s.alarmCaption}>오늘 나에게 올 행운, 원하는 시간에 가장 먼저 알려 드릴게요.</Text>
              </View>
              <PressableScale accessibilityRole="switch" accessibilityLabel="오늘의 운세 알림" accessibilityState={{ checked: noti.fortune }} onPress={() => { void notificationService.markDecided(); updateNoti({ ...noti, fortune: !noti.fortune }); }} hitSlop={10}><FigmaAsset name={noti.fortune ? 'toggleOn' : 'toggleOff'} /></PressableScale>
            </View>
            {noti.fortune && needPermission && permissionHint}
            {noti.fortune && (
              <PressableScale onPress={() => setTimeDraft(noti.minute)} scaleTo={0.99} style={s.alarmSub} accessibilityRole="button" accessibilityLabel={`알림 시간 ${formatMinute(noti.minute)}`} accessibilityHint="알림 받을 시간을 바꿔요">
                <FigmaAsset name="time" />
                <Text style={s.timeLabel}>알림 시간</Text>
                <Text style={s.timeValue}>{formatMinute(noti.minute)}</Text>
                <FigmaAsset name="smallChevron" />
              </PressableScale>
            )}
          </View>
          <View style={s.alarmDivider} />
          <View style={s.alarmSection}>
            <View style={s.alarmHead}>
              <View style={s.notificationIcon}><FigmaAsset name="sparkle" /></View>
              <View style={s.alarmText}>
                <Text style={s.notificationTitle}>이벤트·혜택 알림</Text>
                <Text style={s.alarmCaption}>할인·이벤트 소식을 먼저 알려 드려요. (광고성 정보 수신 동의)</Text>
              </View>
              <PressableScale accessibilityRole="switch" accessibilityLabel="이벤트·혜택 알림" accessibilityState={{ checked: noti.marketing }} onPress={() => updateNoti({ ...noti, marketing: !noti.marketing })} hitSlop={10}><FigmaAsset name={noti.marketing ? 'toggleOn' : 'toggleOff'} /></PressableScale>
            </View>
            {noti.marketing && !noti.fortune && needPermission && permissionHint}
          </View>
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
        {/* 구독 중이면 구독 관리로, 아니면 구독 안내로 */}
        <PressableScale onPress={() => router.push(subscription ? '/subscription' : '/subscribe')} style={s.walletRow} scaleTo={0.98} accessibilityLabel={subscription ? '정기 구독 관리' : '정기 구독 안내'}>
          <View style={s.subIcon}><SolidIcon name="crown" size={13} color={CROWN} /></View>
          <Text style={s.menuLabel}>{subscription ? '정기 구독 관리' : '정기 구독'}</Text>
          <View style={s.menuArrow}><FigmaAsset name="chevron" /></View>
        </PressableScale>
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

      <BottomSheet visible={timeDraft !== null} onClose={() => setTimeDraft(null)}>
        {timeDraft !== null && noti && <View>
          <Text style={[txt.h2, s.center]}>알림 시간</Text>
          <Text style={[txt.small, s.center, { marginTop: 4, marginBottom: 12 }]}>매일 이 시간에 오늘의 운세를 알려 드려요</Text>
          <FortuneTimeWheel value={timeDraft} onChange={setTimeDraft} />
          <PrimaryButton label={`${formatMinute(timeDraft)}로 저장`} onPress={() => { const minute = timeDraft; setTimeDraft(null); if (minute !== noti.minute) updateNoti({ ...noti, minute }); }} style={{ marginTop: 16 }} />
        </View>}
      </BottomSheet>

      <BottomSheet visible={!!themeAsk} onClose={() => setThemeAsk(null)}>
        {themeAsk && <View>
          <Text style={[txt.caption, s.center]}>화면 모드</Text>
          <Text style={[txt.h2, s.center, { marginTop: 6 }]}>{THEME_LABEL[themeAsk]} 모드로 바꿀까요?</Text>
          <Text style={[txt.small, s.center, { marginTop: 4, marginBottom: 18 }]}>모든 화면에 적용하려면 앱이 다시 시작돼요</Text>
          <PrimaryButton label="다시 시작하기" onPress={async () => { await saveThemePref(themeAsk); reloadApp(); }} />
          <PrimaryButton label="취소" variant="soft" onPress={() => setThemeAsk(null)} style={{ marginTop: 8 }} />
        </View>}
      </BottomSheet>
    </Screen>
  );
}

const s = StyleSheet.create({
  center: { textAlign: 'center' },
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
  profileRequests: { marginTop: 16, gap: 8 },
  profileRequestRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  profileGroup: { borderRadius: 12, overflow: 'hidden', backgroundColor: colors.cream },
  profileScroll: { maxHeight: 280, flexGrow: 0, overscrollBehaviorY: 'contain' },
  personRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  personName: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  personMeta: { ...profileType(12, '400', 16, -0.4, colors.inkMute), marginTop: 3 },
  primaryTag: { ...profileType(11, '600', 14, 0, colors.purpleSoft), paddingHorizontal: 6, paddingVertical: 1, borderRadius: 999, borderWidth: 1, borderColor: colors.purpleSoft, overflow: 'hidden' },
  profileOutline: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderWidth: 1, borderColor: profileLine, borderRadius: 12 },
  profileLabel: profileType(14, '600', 18, -0.65),
  profileDivider: { height: 1, backgroundColor: profileLine },
  group: { paddingVertical: 2, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 54 },
  loginRow: { paddingVertical: 12, minHeight: 81 },
  loginIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  border: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.lineStrong },
  rowIcon: { width: 16, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 15, color: colors.ink, fontWeight: '500' },
  rowValue: { fontSize: 15, color: colors.inkSub, fontWeight: '600' },
  notificationIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.lavenderSoft, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  notificationTitle: profileType(14, '700', 17, -0.56, colors.ink),
  notificationCaption: { ...profileType(13, '400', 18, -0.65), marginTop: 4 },
  permissionText: { ...profileType(12, '500', 16, -0.4, colors.inkSub), flex: 1 },
  permissionAction: profileType(12, '700', 16, -0.4, colors.ink),
  // 알림 카드: 구역마다 위아래 16 · 좌우 16으로 같게, 아이콘·글·토글은 가운데 정렬, 아래 줄(시간·권한)은 12 띄운다
  alarmCard: { padding: 0, borderColor: profileLine, overflow: 'hidden' },
  alarmSection: { paddingHorizontal: 16, paddingVertical: 16 },
  alarmHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  alarmText: { flex: 1 },
  alarmCaption: { ...profileType(13, '400', 18, -0.65), marginTop: 4 },
  alarmDivider: { height: 1, backgroundColor: profileLine },
  alarmSub: { minHeight: 44, marginTop: 12, borderRadius: 8, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  timeLabel: { ...profileType(13, '600', 18, -0.65), flex: 1 },
  timeValue: profileType(13, '700', 18, -0.65, colors.ink),
  wallet: { padding: 0, overflow: 'hidden' },
  walletTop: { minHeight: 64, paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 16 },
  walletCaption: profileType(13, '400', 18, -0.65),
  walletCount: { ...profileType(24, '700', 29, -1.2), marginTop: 1 },
  walletRow: { height: 55, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: profileLine },
  menuLabel: { ...profileType(14, '600', 18, -0.7), flex: 1 },
  subIcon: { width: 20, height: 20, borderRadius: 5, backgroundColor: colors.heroBg, alignItems: 'center', justifyContent: 'center' },
  menuArrow: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  accountActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 16 },
  accountLink: { fontSize: 14, color: colors.inkMute, fontWeight: '500' },
  sep: { width: 1, height: 12, backgroundColor: colors.lineStrong },
  charge: { height: 40, paddingHorizontal: 20, borderRadius: 5, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  chargeLabel: profileType(14, '600', 17, -0.28, '#EDEDED'),
});
