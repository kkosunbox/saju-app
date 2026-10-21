import { RefObject } from 'react';
import { View, Alert, Platform } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

export type ShareResult = 'shared' | 'saved' | 'cancelled' | 'failed';

/** 웹에서 미리 그려 둔 카드 이미지 */
export interface WebCard { dataUri: string; file: File }

/**
 * 웹: 카드를 1080px 폭 PNG로 그린다 (view-shot이 findNodeHandle을 못 써서 html2canvas로).
 * 버튼을 누른 뒤에 그리면 그 사이 iOS 사파리가 사용자 동작이 끝났다고 보고 공유를 막으니, 화면에 들어오면 미리 그려 둔다.
 */
export async function renderCardWeb(ref: RefObject<View | null>, file = 'woonpick'): Promise<WebCard | null> {
  if (Platform.OS !== 'web' || !ref.current) return null;
  const node = ref.current as unknown as HTMLElement;
  const html2canvas = (await import('html2canvas')).default;
  await (document as any).fonts?.ready;
  const canvas = await html2canvas(node, { scale: 1080 / node.offsetWidth, backgroundColor: null, logging: false, useCORS: true });
  const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'));
  if (!blob) return null;
  return { dataUri: canvas.toDataURL('image/png'), file: new File([blob], `${file}.png`, { type: 'image/png' }) };
}

/**
 * 공유 카드 View를 PNG로 캡처한다.
 * - mode 'share': 웹은 Web Share(이미지 첨부 — 모바일에서 인스타·카톡 바로 선택), 안 되면 저장으로 대체
 * - mode 'save' : 웹은 PNG 다운로드
 * - 네이티브는 둘 다 시스템 공유 시트(사진 저장·인스타 스토리 포함)
 * - prepared: 웹에서 renderCardWeb으로 미리 그려 둔 이미지 (없거나 실패했으면 지금 그린다)
 */
export async function shareCardImage(
  ref: RefObject<View | null>,
  opts: { file?: string; text?: string; url?: string; mode?: 'share' | 'save'; prepared?: WebCard | null } = {},
): Promise<ShareResult> {
  const { file = 'woonpick', text, url, mode = 'save', prepared } = opts;
  try {
    if (!ref.current) return 'failed';
    if (Platform.OS === 'web') {
      const card = prepared ?? (await renderCardWeb(ref, file));
      if (!card) return 'failed';
      if (mode === 'share') {
        const nav = navigator as any;
        if (nav.canShare?.({ files: [card.file] })) {
          try {
            await nav.share({ files: [card.file], text: [text, url].filter(Boolean).join('\n') });
            return 'shared';
          } catch (e) {
            if ((e as Error)?.name === 'AbortError') return 'cancelled';
            // 사파리가 공유를 막았으면(NotAllowedError 등) 저장으로 대체한다
          }
        }
      }
      const a = document.createElement('a');
      a.href = card.dataUri;
      a.download = `${file}.png`;
      a.click();
      return 'saved';
    }
    const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile', width: 1080, height: 1920 });
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
