import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ImageBackground, Linking, Platform, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { ART } from './Mascot';
import { useNavigation } from '@/navigation/compat';
import PressableScale from './PressableScale';
import Icon from './Icon';
import BottomSheet from './BottomSheet';
import PrimaryButton from './PrimaryButton';
import { usePremium } from '../context/PremiumContext';
import { useSharedView } from '../context/SharedViewContext';
import { ApiError } from '../api/client';
import { useApp } from '../context/AppContext';
import { Item, titleOfKey } from '../services/premium/catalog';
import { ShareSpec, josa } from '../services/share/shareSpecs';
import { MyShare, canShareFull, createFullShare, getMyShare, revokeMyShare } from '../services/share/fullShare';
import { copyToClipboard, shareLink } from '../services/share/linkShare';
import { colors } from '../theme/colors';
import { radius, sansW, txt } from '../theme/typography';

/**
 * 유료 결과 끝의 공유 배너 — 열람한 사람에게만 (결과를 받기 전에는 숨김).
 * 카드 그림 바탕 + 하늘색 점선. 박스를 그림 비율(327×68)에 맞춰 폭이 달라도 그림이 잘리지 않게 한다.
 * 전체 공유가 되는 콘텐츠는 누르면 '전체 풀이 링크 / 카드' 중에서 고른다.
 */
export default function ShareCta({ item, spec, style }: { item?: Item; spec?: ShareSpec | null; style?: StyleProp<ViewStyle> }) {
  const share = useShareChooser(item, spec);
  if (!share) return null;
  return (
    <>
      <PressableScale onPress={share.open} style={[s.bannerBox, style]} scaleTo={0.98} accessibilityLabel={share.full ? '결과 공유하기' : '결과를 카드로 공유하기'}>
        <ImageBackground source={ART.shareBanner} style={s.banner} imageStyle={s.bannerImage} resizeMode="stretch">
          <View style={{ flex: 1 }}>
            <Text style={s.bannerTitle}>{share.full ? '결과 공유하기' : '결과를 카드로 공유하기'}</Text>
            <Text style={s.bannerSub}>{share.full ? '전체 풀이 링크나 카드로 전해 보세요' : '나의 운세를 공유해 보세요'}</Text>
          </View>
          <Icon name="external" size={24} color={BANNER_INK} />
        </ImageBackground>
        {/* 점선은 그림 위에 따로 얹는다 */}
        <View pointerEvents="none" style={s.bannerBorder} />
      </PressableScale>
      {share.sheet}
    </>
  );
}

// 배너 그림이 밝은 하늘색이라 글자는 화면 모드와 상관없이 어둡게
const BANNER_INK = '#222222';

/** 유료 화면 상단 오른쪽 공유 아이콘 — 열람한 사람에게만 보인다 */
export function ShareIconButton({ item, spec }: { item?: Item; spec?: ShareSpec | null }) {
  const share = useShareChooser(item, spec);
  if (!share) return null;
  return (
    <>
      <PressableScale onPress={share.open} scaleTo={0.9} hitSlop={10} accessibilityLabel={share.full ? '결과 공유하기' : '결과를 카드로 공유하기'} style={{ width: 24, height: 44, justifyContent: 'center' }}>
        <Icon name="external" size={24} strokeWidth={2} color={colors.ink} />
      </PressableScale>
      {share.sheet}
    </>
  );
}

/**
 * 공유 버튼 동작. 전체 공유가 안 되는 콘텐츠는 바로 카드 화면으로,
 * 되는 콘텐츠는 시트에서 '전체 풀이 공유 / 카드로 공유'를 고른다. 전체 풀이 공유를 누르면 바로 링크를 만들어
 * 그 아래로 펼쳐 링크 · 복사 · PDF 저장 · 공유하기 · 공유 취소를 보여 준다. 공유 중이면 시트를 열 때부터 펼쳐 두고
 * 접히지 않으며, 공유를 취소하면 접힌다 (링크는 취소할 때까지 열린다).
 * 공유하기는 링크가 나온 뒤 따로 누른다 — 누른 뒤 서버를 기다리면 iOS 사파리가 공유 시트를 막는다.
 * 공유 링크로 연 화면(받은 사람)에서는 null.
 */
function useShareChooser(item: Item | undefined, spec: ShareSpec | null | undefined) {
  const nav = useNavigation();
  const { owned, toast, rewardShare } = usePremium();
  const shared = useSharedView();
  const { user } = useApp();
  const [visible, setVisible] = useState(false);
  /** undefined: 확인 중 · null: 공유 안 하는 중 */
  const [mine, setMine] = useState<MyShare | null | undefined>(undefined);
  const [busy, setBusy] = useState<'send' | 'revoke' | null>(null);
  /** 전체 풀이 공유를 펼쳤는지 (펼치면 링크를 만들어 아래에 보여 준다) */
  const [expanded, setExpanded] = useState(false);
  /** 공유 취소 확인 중 (시트 내용을 통째로 바꿔 묻는다) */
  const [confirming, setConfirming] = useState(false);
  /** PDF 저장 안내 중 (브라우저 인쇄 화면으로 넘어간다고 먼저 알려 준다) */
  const [pdfGuide, setPdfGuide] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(copiedTimer.current), []);
  if (shared || !spec || (item && !owned(item.key))) return null;
  const key = item?.key;
  const full = canShareFull(key);
  const toCard = () => nav.navigate('Share', { spec });

  const open = () => {
    if (!full) return toCard();
    setExpanded(false);
    setConfirming(false);
    setPdfGuide(false);
    setError(null);
    // 공유 중이면 처음부터 펼쳐 둔다
    setMine(undefined);
    getMyShare(key!).then(live => { setMine(live); if (live) setExpanded(true); }).catch(() => setMine(null));
    setCopied(false);
    setVisible(true);
  };
  const send = async (share: MyShare) => {
    setBusy('send');
    // 전체 풀이 링크는 결과 한 줄 대신 '누가 무엇을 공유했는지'만 알린다
    const title = item?.title ?? titleOfKey(key!);
    const r = await shareLink(`${user?.nickname ?? ''}님이 ${title}${josa(title, '을', '를')} 공유했어요.\n링크에서 바로 확인할 수 있어요.`, share.url);
    setBusy(null);
    if (r === 'cancelled') return;
    setVisible(false);
    // 복사만으로는 보냈는지 알 수 없어 공유 보상은 OS 공유로 보냈을 때만 (카드 공유와 같은 보상 — 콘텐츠마다 한 번)
    if (r === 'copied') toast('링크를 복사했어요.');
    else void rewardShare(spec.file);
  };
  // 시트가 떠 있는 동안은 토스트가 시트에 가려지니 버튼 글자로 알려 준다
  const copy = async (share: MyShare) => {
    if (!(await copyToClipboard(share.url))) return setError(Platform.OS === 'android' ? '복사하지 못했어요. 공유하기로 보내 주세요' : '복사하지 못했어요. 링크를 길게 눌러 복사해 주세요');
    setError(null);
    setCopied(true);
    clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 2000);
  };
  // 공유 링크의 인쇄 화면을 브라우저로 열어 'PDF로 저장'으로 받는다 (앱은 기본 브라우저에서)
  const savePdf = (share: MyShare) => {
    const url = `${share.url}?pdf=1`;
    if (Platform.OS === 'web') window.open(url, '_blank');
    else Linking.openURL(url).catch(() => setError('브라우저를 열지 못했어요'));
  };
  // '전체 풀이 공유'를 누르면 바로 링크를 만든다 (같은 내용의 살아 있는 링크가 있으면 서버가 그것을 준다)
  const create = async () => {
    setMine(undefined);
    setError(null);
    try {
      setMine(await createFullShare(key!));
    } catch (e) {
      setMine(null);
      setError(e instanceof ApiError && e.code === 'BAD_REQUEST' ? '풀이를 다 쓴 뒤에 공유할 수 있어요' : '링크를 만들지 못했어요. 잠시 후 다시 시도해 주세요');
    }
  };
  const revoke = async () => {
    setBusy('revoke');
    try {
      await revokeMyShare(key!);
      // 취소하면 접힌 상태로 돌아간다
      setMine(null);
      setExpanded(false);
      setConfirming(false);
      setError(null);
    } catch {
      setError('공유를 취소하지 못했어요. 잠시 후 다시 시도해 주세요');
    }
    setBusy(null);
  };

  let linkBody: React.ReactNode;
  if (mine === undefined) {
    linkBody = <ActivityIndicator color={colors.inkMute} style={{ marginTop: 14 }} />;
  } else if (!mine) {
    // 만들지 못했을 때만 (아래에 이유를 보여 준다)
    linkBody = <PrimaryButton size="medium" variant="soft" label="다시 시도" onPress={create} style={[s.linkBtn, s.softBtn]} />;
  } else {
    linkBody = (
      <>
        <View style={s.urlBox}>
          {/* 안드로이드는 selectable이면 줄임(…)을 무시하고 개행돼서 거기선 끈다 (복사 버튼이 옆에 있다) */}
          <Text style={s.url} numberOfLines={1} ellipsizeMode="middle" selectable={Platform.OS !== 'android'}>{mine.url.replace(/^https?:\/\//, '')}</Text>
          <PressableScale onPress={() => copy(mine)} style={s.copyBtn} scaleTo={0.94} accessibilityLabel="링크 복사">
            <Icon name={copied ? 'check' : 'copy'} size={14} strokeWidth={2} color={copied ? colors.success : colors.ink} />
            <Text style={[s.copyText, copied && { color: colors.success }]}>{copied ? '복사됨' : '복사'}</Text>
          </PressableScale>
        </View>
        <View style={s.row}>
          <PrimaryButton size="medium" variant="soft" label="PDF 저장" onPress={() => { setError(null); setPdfGuide(true); }} disabled={!!busy} style={[s.flex, s.softBtn]}
            icon={<View style={{ marginRight: -4 }}><Icon name="download" size={16} strokeWidth={1.95} color={colors.ink} /></View>} />
          <PrimaryButton size="medium" label={busy === 'send' ? '보내는 중…' : '공유하기'} onPress={() => send(mine)} disabled={!!busy} style={s.flex}
            icon={busy ? undefined : <View style={{ marginRight: -4 }}><Icon name="external" size={16} strokeWidth={1.95} color={colors.white} /></View>} />
        </View>
        <PressableScale onPress={() => setConfirming(true)} disabled={!!busy} style={s.revokeLink} scaleTo={0.96} accessibilityLabel="공유 취소">
          <Text style={s.revokeText}>공유 취소</Text>
        </PressableScale>
      </>
    );
  }

  const toggleFull = () => {
    // 공유 중에는 늘 펼쳐 둔다 (접으려면 공유 취소)
    if (mine) return setExpanded(true);
    if (expanded) return setExpanded(false);
    setExpanded(true);
    if (!mine) void create();
  };
  const menu = (
    <>
      {/* 전체 풀이 공유: 누르면 링크를 만들고 그 아래로 펼친다 */}
      <View style={s.option}>
        <PressableScale onPress={toggleFull} style={s.optionHead} scaleTo={0.98} accessibilityLabel="전체 풀이 공유" accessibilityState={{ expanded }}>
          <View style={s.optionIcon}><Icon name="send" size={20} color={colors.accent} /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.optionTitle}>전체 풀이 공유</Text>
            <Text style={s.optionSub}>링크를 공유하거나 PDF로 다운받을 수 있어요</Text>
          </View>
          {mine ? null : <Icon name={expanded ? 'chevronDown' : 'chevronRight'} size={18} color={colors.inkMute} />}
        </PressableScale>
        {expanded ? (
          <>
            {linkBody}
            {error ? <Text style={[txt.small, s.error]}>{error}</Text> : null}
            <Text style={[txt.caption, s.note]}>전체 풀이 링크에는 내 이름 · 생년월일시 · 사주 원국이 함께 보여요.</Text>
          </>
        ) : null}
      </View>
      <PressableScale onPress={() => { setVisible(false); toCard(); }} style={[s.option, s.optionHead]} scaleTo={0.98} accessibilityLabel="카드로 공유">
        <View style={s.optionIcon}><Icon name="download" size={20} color={colors.accent} /></View>
        <View style={{ flex: 1 }}>
          <Text style={s.optionTitle}>카드로 공유</Text>
          <Text style={s.optionSub}>핵심만 담은 이미지 카드를 공유할 수 있어요</Text>
        </View>
        <Icon name="chevronRight" size={18} color={colors.inkMute} />
      </PressableScale>
    </>
  );
  // 공유 취소 확인 — 시트 내용을 통째로 바꿔 묻는다 (지우기 확인과 같은 모양)
  const confirm = (
    <>
      <Text style={[txt.h2, s.center]}>공유를 취소할까요?</Text>
      <Text style={[txt.small, s.center, { marginTop: 8 }]}>이미 보낸 링크도 더 이상 열리지 않아요.{'\n'}다시 공유하면 새 링크가 만들어져요.</Text>
      {error ? <Text style={[txt.small, s.error, s.center]}>{error}</Text> : null}
      <PrimaryButton label={busy === 'revoke' ? '취소하는 중…' : '공유 취소하기'} onPress={revoke} disabled={!!busy} style={{ marginTop: 20 }} />
      <PrimaryButton label="돌아가기" variant="text" onPress={() => { setConfirming(false); setError(null); }} disabled={!!busy} style={[{ marginTop: 8 }, s.backBtn]} />
    </>
  );

  // PDF 저장 안내 — 앱 밖(브라우저)으로 나가 인쇄 화면이 뜨니 미리 알려 주고 넘긴다
  const pdf = mine ? (
    <>
      <Text style={[txt.h2, s.center]}>{Platform.OS === 'web' ? '새 탭이 열려요' : '브라우저가 열려요'}</Text>
      <Text style={[txt.small, s.center, { marginTop: 8 }]}>
        {Platform.OS === 'web' ? '새 탭' : '브라우저'}에서 풀이 페이지가 열리고 인쇄 화면이 떠요.{'\n'}인쇄 화면에서 'PDF로 저장'을 골라 저장해 주세요.
      </Text>
      {error ? <Text style={[txt.small, s.error, s.center]}>{error}</Text> : null}
      <PrimaryButton label="PDF 저장" onPress={() => { setPdfGuide(false); savePdf(mine); }} style={{ marginTop: 20 }} />
      <PrimaryButton label="돌아가기" variant="text" onPress={() => setPdfGuide(false)} style={[{ marginTop: 8 }, s.backBtn]} />
    </>
  ) : null;

  const sheet = full ? (
    <BottomSheet visible={visible} onClose={() => setVisible(false)} transitionKey={confirming ? 'revoke' : pdfGuide && pdf ? 'pdf' : 'menu'}>
      {confirming ? confirm : pdfGuide && pdf ? pdf : menu}
    </BottomSheet>
  ) : null;
  return { open, full, sheet };
}

const s = StyleSheet.create({
  bannerBox: { marginTop: 16 },
  banner: { aspectRatio: 984 / 204, minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 84, paddingRight: 20 },
  // 그림을 상자 전체에 편다. 앱(iOS·Android의 Yoga)은 '100%'를 패딩(84+20)을 뺀 폭으로 재서 오른쪽이 비니 위아래좌우 0으로만 펴고,
  // 웹은 크기를 비우면 그림 원래 크기(984×204)로 넘쳐 나오니 '100%'를 둔다. 상자를 잘라내지 않고 그림 자체를 둥글게 깎는다
  bannerImage: { ...(Platform.OS === 'web' ? { width: '100%', height: '100%' } : { width: undefined, height: undefined }), borderRadius: radius.sm },
  bannerBorder: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, borderRadius: radius.sm, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.accent },
  bannerTitle: { ...sansW('700'), fontSize: 14, letterSpacing: -0.56, color: BANNER_INK },
  bannerSub: { ...sansW('400'), marginTop: 4, fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: '#000000' },
  center: { textAlign: 'center' },
  option: { paddingVertical: 14, paddingHorizontal: 14, marginBottom: 10, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  optionHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  optionTitle: { ...sansW('700'), fontSize: 15, letterSpacing: -0.6, color: colors.ink },
  optionSub: { ...txt.small, marginTop: 3 },
  linkBtn: { marginTop: 14 },
  urlBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, height: 44, paddingLeft: 12, paddingRight: 6, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.cream },
  url: { ...sansW('500'), flex: 1, fontSize: 13, letterSpacing: -0.2, color: colors.inkSub },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 32, paddingHorizontal: 10, borderRadius: radius.xs, borderWidth: 1, borderColor: colors.lineStrong, backgroundColor: colors.card },
  copyText: { ...sansW('600'), fontSize: 13, letterSpacing: -0.3, color: colors.ink },
  row: { flexDirection: 'row', gap: 8, marginTop: 10 },
  flex: { flex: 1 },
  softBtn: { borderWidth: 1, borderColor: colors.lineStrong },
  // 시트 바탕이 soft 버튼과 같은 card 색이라, 시트 안 보조 버튼은 한 톤 진한 회색으로 채운다
  backBtn: { borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.lineStrong },
  revokeLink: { alignSelf: 'center', marginTop: 10, paddingVertical: 4, paddingHorizontal: 8 },
  revokeText: { ...sansW('500'), fontSize: 13, letterSpacing: -0.3, color: colors.inkMute, textDecorationLine: 'underline' },
  error: { marginTop: 8, color: colors.danger },
  note: { textAlign: 'center', marginTop: 14, marginBottom: 4 },
});
