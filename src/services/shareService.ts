import { RefObject } from 'react';
import { View, Alert, Platform } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

/** 공유 카드 View를 PNG로 캡처해 시스템 공유 시트로 넘긴다 (웹은 PNG 다운로드) */
export async function shareCardImage(ref: RefObject<View | null>) {
  try {
    if (!ref.current) return;
    if (Platform.OS === 'web') {
      const dataUri = await captureRef(ref, { format: 'png', quality: 1, result: 'data-uri' });
      const a = document.createElement('a');
      a.href = dataUri;
      a.download = 'onulna-today.png';
      a.click();
      return;
    }
    const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert('공유할 수 없어요', '이 기기에서는 공유 기능을 사용할 수 없어요.');
      return;
    }
    await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: '오늘의 운세 공유하기' });
  } catch (e) {
    Alert.alert('이미지를 만들지 못했어요', '잠시 후 다시 시도해 주세요.');
  }
}
