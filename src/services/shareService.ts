import { RefObject } from 'react';
import { Alert, Linking, Platform, Share, type ViewInstance } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

/** unsupported: 이미지 공유를 못 하는 브라우저 (fallback 'none'일 때만) */
export type ShareResult = 'shared' | 'saved' | 'cancelled' | 'failed' | 'unsupported';

/** 웹에서 미리 그려 둔 카드 이미지 */
export interface WebCard { dataUri: string; file: File }

/**
 * html2canvas는 <style>을 복제할 때 지금 규칙 전체 뒤에 원래 글자를 한 번 더 붙인다.
 * 정적 export 웹은 RN 웹 스타일이 글자로 미리 들어 있어서, 뒤에 붙은 기본 글자 스타일(검정)이
 * 화면에서 나중에 추가된 색·여백 규칙을 덮는다 — 복제본을 지금 규칙 한 벌로 바로잡는다.
 */
function syncStyles(clone: Document) {
  const live = document.querySelectorAll('style');
  const copies = clone.querySelectorAll('style');
  live.forEach((style, i) => {
    try {
      if (style.sheet && copies[i]) copies[i].textContent = Array.from(style.sheet.cssRules, rule => rule.cssText).join('\n');
    } catch {
      // 다른 출처 시트는 읽을 수 없다 — 그대로 둔다
    }
  });
}

/**
 * 웹: 카드를 1080px 폭 PNG로 그린다 (view-shot이 findNodeHandle을 못 써서 html2canvas로).
 * 버튼을 누른 뒤에 그리면 그 사이 iOS 사파리가 사용자 동작이 끝났다고 보고 공유를 막으니, 화면에 들어오면 미리 그려 둔다.
 */
export async function renderCardWeb(ref: RefObject<ViewInstance | null>, file = 'woonpick'): Promise<WebCard | null> {
  if (Platform.OS !== 'web' || !ref.current) return null;
  const node = ref.current as unknown as HTMLElement;
  const html2canvas = (await import('html2canvas')).default;
  await (document as any).fonts?.ready;
  const canvas = await html2canvas(node, { scale: 1080 / node.offsetWidth, backgroundColor: null, logging: false, useCORS: true, onclone: syncStyles });
  const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'));
  if (!blob) return null;
  return { dataUri: canvas.toDataURL('image/png'), file: new File([blob], `${file}.png`, { type: 'image/png' }) };
}

/** iOS 사파리는 다운로드를 '파일' 앱에 넣는다 — 사진첩에는 공유 시트의 '이미지 저장'으로만 들어간다 */
const isIosWeb = () => typeof navigator !== 'undefined'
  && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

/** 웹에서 이미지 파일을 공유 시트로 보낼 수 있는지 */
export const canShareImageWeb = (card: WebCard | null) =>
  Platform.OS === 'web' && !!card && !!(navigator as any).canShare?.({ files: [card.file] });

/** 사진첩(쓰기 전용)에 저장한다. 권한을 거절했으면 설정으로 안내한다. */
async function saveToPhotos(uri: string): Promise<ShareResult> {
  const MediaLibrary = await import('expo-media-library');
  const perm = await MediaLibrary.requestPermissionsAsync(true, ['photo']);
  if (!perm.granted) {
    Alert.alert('사진 접근 권한이 필요해요', '설정에서 사진 추가를 허용하면 이미지를 저장할 수 있어요.', [
      { text: '닫기', style: 'cancel' },
      { text: '설정 열기', onPress: () => { void Linking.openSettings(); } },
    ]);
    return 'cancelled';
  }
  await MediaLibrary.Asset.create(uri);
  return 'saved';
}

/**
 * 공유 카드 View를 PNG로 캡처한다.
 * - mode 'share': 이미지 첨부 공유 (웹은 Web Share — 모바일에서 인스타·카톡 바로 선택, iOS 앱은 문구·링크도 함께).
 *   웹에서 이미지 공유가 안 되면 fallback 'save'(기본)는 저장으로, 'none'은 'unsupported'를 돌려준다
 * - mode 'save' : 사진첩에 저장 (네이티브는 사진 보관함, iOS 웹은 공유 시트의 '이미지 저장', 그 밖의 웹은 PNG 다운로드)
 * - prepared: 웹에서 renderCardWeb으로 미리 그려 둔 이미지 (없거나 실패했으면 지금 그린다)
 */
export async function shareCardImage(
  ref: RefObject<ViewInstance | null>,
  opts: { file?: string; text?: string; url?: string; mode?: 'share' | 'save'; fallback?: 'save' | 'none'; prepared?: WebCard | null; aspectRatio?: number } = {},
): Promise<ShareResult> {
  const { file = 'woonpick', text, url, mode = 'save', fallback = 'save', prepared } = opts;
  const message = [text, url].filter(Boolean).join('\n');
  try {
    if (!ref.current) return 'failed';
    if (Platform.OS === 'web') {
      const card = prepared ?? (await renderCardWeb(ref, file));
      if (!card) return 'failed';
      if (mode === 'share' || isIosWeb()) {
        if (canShareImageWeb(card)) {
          try {
            await (navigator as any).share(mode === 'share' ? { files: [card.file], text: message || undefined } : { files: [card.file] });
            return 'shared';
          } catch (e) {
            if ((e as Error)?.name === 'AbortError') return 'cancelled';
            // 사파리가 공유를 막았으면(NotAllowedError 등) 저장으로 대체한다
          }
        }
        if (mode === 'share' && fallback === 'none') return 'unsupported';
      }
      const a = document.createElement('a');
      a.href = card.dataUri;
      a.download = `${file}.png`;
      a.click();
      return 'saved';
    }
    const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile', width: 1080, height: opts.aspectRatio ? Math.round(1080 / opts.aspectRatio) : 1920 });
    if (mode === 'save') return await saveToPhotos(uri);
    // iOS 공유 시트는 이미지와 함께 문구·링크도 넘길 수 있다 (안드로이드는 이미지만)
    if (Platform.OS === 'ios' && message) {
      const r = await Share.share({ url: uri, message });
      return r.action === Share.dismissedAction ? 'cancelled' : 'shared';
    }
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert('공유할 수 없어요', '이 기기에서는 공유 기능을 사용할 수 없어요.');
      return 'failed';
    }
    await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: '공유하기' });
    return 'shared';
  } catch (e) {
    console.warn('[share] capture failed', e);
    Alert.alert('이미지를 만들지 못했어요', '잠시 후 다시 시도해 주세요.');
    return 'failed';
  }
}
