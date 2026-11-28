import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import PrimaryButton from './PrimaryButton';
import { APP_STORE_LIVE, type InstallDevice } from '../services/webInstall';
import { colors } from '../theme/colors';
import { radius } from '../theme/typography';

const STORES = {
  ios: {
    label: 'App Store',
    url: 'https://apps.apple.com/kr/app/id6827429370',
    logo: require('../../assets/store-badges/app-store.svg'),
  },
  android: {
    label: 'Google Play',
    url: 'https://play.google.com/store/apps/details?id=com.woonpick.android',
    logo: require('../../assets/store-badges/google-play.svg'),
  },
} as const;

export default function StoreInstallButtons({ device, variant = 'solid', horizontal = false, onOpenStore }: {
  device: InstallDevice;
  variant?: 'solid' | 'outline';
  horizontal?: boolean;
  onOpenStore?(): void;
}) {
  const platforms = device === 'desktop' ? (['ios', 'android'] as const) : [device];
  const inline = horizontal && device === 'desktop';
  return (
    <View style={[s.buttons, inline && s.horizontal]}>
      {platforms.map(platform => {
        const store = STORES[platform];
        const pending = platform === 'ios' && !APP_STORE_LIVE;
        const tint = pending ? colors.inkMute : variant === 'solid' ? colors.white : colors.ink;
        return (
          <PrimaryButton
            key={platform}
            label={pending ? store.label : `${store.label}에서 받기`}
            labelStyle={pending ? s.pendingLabel : undefined}
            disabled={pending}
            externalHref={pending ? undefined : store.url}
            onPress={onOpenStore}
            variant={pending ? 'outline' : variant}
            style={inline ? s.inlineButton : undefined}
            icon={<Image source={store.logo} tintColor={platform === 'ios' ? tint : undefined} style={s.logo} contentFit="contain" accessible={false} />}
            trailing={pending ? <Text style={s.status}>출시 준비 중</Text> : null}
          />
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  buttons: { gap: 8 },
  horizontal: { flexDirection: 'row', flexWrap: 'wrap' },
  inlineButton: { flexGrow: 1, flexBasis: 160, minWidth: 160 },
  logo: { width: 20, height: 20 },
  pendingLabel: { color: colors.inkSub },
  status: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.lavenderSoft,
    color: colors.inkSub,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: -0.25,
  },
});
