import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import BottomSheet from './BottomSheet';
import Icon, { type IconName } from './Icon';
import PrimaryButton from './PrimaryButton';
import StoreInstallButtons from './StoreInstallButtons';
import { APP_STORE_LIVE, isIosChrome, useWebInstallRequest, type InstallDevice } from '../services/webInstall';
import { colors } from '../theme/colors';
import { radius, txt } from '../theme/typography';

function IosInstallGuide() {
  const chrome = typeof navigator !== 'undefined' && isIosChrome(navigator.userAgent);
  const steps: { icon: IconName; label: string; hint?: ReactNode }[] = [
    {
      icon: chrome ? 'share' : 'menu',
      label: chrome ? 'Chrome 주소창 오른쪽의 공유 버튼을 눌러요'
        : 'Safari 주소창 왼쪽의 메뉴 버튼을 누른 뒤 ‘공유’를 눌러요',
    },
    {
      icon: 'plus',
      label: '‘홈 화면에 추가’를 눌러요',
      hint: (
        <>
          안 보이면 ‘
          <Text style={s.inlineChevron}>
            <Icon name="chevronDown" size={11} color="currentColor" />
          </Text>
          {' 더 보기’를 눌러보세요'}
        </>
      ),
    },
    {
      icon: 'check',
      label: '‘추가’를 누르면 완료예요.',
      hint: '‘웹 앱으로 열기’ 옵션이 있다면 켜 주세요.',
    },
  ];
  return (
    <View style={s.guide}>
      {steps.map(step => (
        <View key={step.icon} style={s.step}>
          <View style={s.stepIcon}><Icon name={step.icon} size={18} /></View>
          <View style={s.stepCopy}>
            <Text style={[txt.small, s.stepText]}>{step.label}</Text>
            {step.hint ? <Text style={txt.caption}>{step.hint}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

const DESKTOP_STEPS = [
  { browser: 'Chrome', path: '⋮ → 전송, 저장, 공유 → 페이지를 앱으로 설치' },
  { browser: 'Microsoft Edge', path: '⋯ → 기타 도구 → 앱 → 이 사이트를 앱으로 설치' },
  { browser: 'Mac Safari (macOS 14 이상)', path: '파일 → Dock에 추가' },
];

export default function InstallSheet({ device, visible, fromFortune, guideOnly = false, onClose }: {
  device: InstallDevice;
  visible: boolean;
  fromFortune?: boolean;
  guideOnly?: boolean;
  onClose(): void;
}) {
  const [showGuide, setShowGuide] = useState(false);
  const guide = guideOnly || showGuide;
  const desktop = device === 'desktop';
  const iosPending = device === 'ios' && !APP_STORE_LIVE;
  const shortcutFirst = desktop || iosPending;
  const close = () => {
    onClose();
    setShowGuide(false);
  };
  const { install, requesting } = useWebInstallRequest(() => setShowGuide(true), close);
  const shortcut = (
    <PrimaryButton
      label={desktop ? 'PC에 웹 앱 설치' : '홈 화면에 추가'}
      variant={shortcutFirst ? 'solid' : 'outline'}
      onPress={install}
      disabled={requesting}
      icon={<Icon name={desktop ? 'download' : 'home'} size={20} color={shortcutFirst ? colors.white : colors.ink} />}
    />
  );
  const title = guide
    ? desktop ? 'PC에 운픽 설치하기' : '홈 화면에 운픽 추가하기'
    : fromFortune ? '내일의 운세도 바로 확인해요' : '운픽을 더 편하게 열어 보세요';
  const description = iosPending
    ? '홈 화면에 운픽을 추가하면 다음 운세도 바로 열 수 있어요.'
    : desktop
      ? '웹 앱으로 설치하면 운픽을 별도 창에서 바로 열 수 있어요.'
      : '앱을 받으면 오늘의 운세를 홈 화면 위젯에서 볼 수 있어요.';

  return (
    <BottomSheet visible={visible} onClose={close} scrollable>
      <View style={s.header}>
        <Image source={require('../../assets/icon.png')} style={s.appIcon} accessible={false} />
        <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={[txt.h2, s.center]}>{title}</Text>
        {guide ? null : <Text style={[txt.small, s.center]}>{description}</Text>}
      </View>
      {guide ? (
        <View style={s.actions}>
          {device === 'ios' ? <IosInstallGuide /> : desktop ? (
            <View style={s.guide}>
              {DESKTOP_STEPS.map(step => (
                <View key={step.browser} style={s.desktopStep}>
                  <Text style={s.browser}>{step.browser}</Text>
                  <Text style={txt.small}>{step.path}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[txt.small, s.center]}>Chrome에서 주소창 옆 ⋮ 메뉴를 열고 설치 또는 바로가기 만들기를 선택해 주세요.</Text>
          )}
          <PrimaryButton label="확인" onPress={close} />
        </View>
      ) : (
        <View style={s.actions}>
          {shortcutFirst ? shortcut : null}
          <StoreInstallButtons device={device} variant={shortcutFirst ? 'outline' : 'solid'} onOpenStore={close} />
          {shortcutFirst ? null : shortcut}
          <PrimaryButton label={fromFortune ? '나중에' : '닫기'} variant="text" onPress={close} />
        </View>
      )}
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  header: { alignItems: 'center', gap: 8, marginBottom: 20 },
  appIcon: { width: 52, height: 52, borderRadius: 13, marginBottom: 4, backgroundColor: colors.accentSoft },
  center: { textAlign: 'center' },
  actions: { gap: 8 },
  guide: { padding: 12, borderRadius: radius.md, backgroundColor: colors.lavenderSoft, gap: 10 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  stepCopy: { flex: 1, gap: 3 },
  stepText: { color: colors.ink },
  inlineChevron: { verticalAlign: 'middle', lineHeight: 11 },
  desktopStep: { gap: 3, paddingHorizontal: 4 },
  browser: { color: colors.ink, fontSize: 14, fontWeight: '700' },
});
