import { RefObject } from 'react';
import { View, Alert, Platform } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

export type ShareResult = 'shared' | 'saved' | 'cancelled' | 'failed';

/**
 * 공유 카드 View를 PNG로 캡처한다.
 * - mode 'share': 웹은 Web Share(이미지 첨부 — 모바일에서 인스타·카톡 바로 선택), 안 되면 저장으로 대체
 * - mode 'save' : 웹은 PNG 다운로드
 * - 네이티브는 둘 다 시스템 공유 시트(사진 저장·인스타 스토리 포함)
 */
export async function shareCardImage(
  ref: RefObject<View | null>,
  opts: { file?: string; text?: string; url?: string; mode?: 'share' | 'save' } = {},
): Promise<ShareResult> {
  const { file = 'woonpick', text, url, mode = 'save' } = opts;
  try {
    if (!ref.current) return 'failed';
    if (Platform.OS === 'web') {
      // 웹은 view-shot이 findNodeHandle을 못 써서 html2canvas로 직접 그린다 — 인스타 스토리 해상도(1080px 폭)
      const node = ref.current as unknown as HTMLElement;
      const html2canvas = (await import('html2canvas')).default;
      await (document as any).fonts?.ready;
      const canvas = await html2canvas(node, { scale: 1080 / node.offsetWidth, backgroundColor: null, logging: false, useCORS: true });
      const dataUri = canvas.toDataURL('image/png');
      if (mode === 'share') {
        const nav = navigator as any;
        const blob = await (await fetch(dataUri)).blob();
        const f = new File([blob], `${file}.png`, { type: 'image/png' });
        if (nav.canShare?.({ files: [f] })) {
          try {
            await nav.share({ files: [f], text: [text, url].filter(Boolean).join('\n') });
            return 'shared';
          } catch { return 'cancelled'; }
        }
      }
      const a = document.createElement('a');
      a.href = dataUri;
      a.download = `${file}.png`;
      a.click();
      return 'saved';
    }
    const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });
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
