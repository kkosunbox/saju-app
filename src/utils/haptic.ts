import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/** 뽑기 연출의 손맛 — 웹에선 아무것도 하지 않는다 */
const on = Platform.OS !== 'web';
export const haptic = {
  /** 차오르는 중의 작은 똑딱 */
  tick: () => { if (on) Haptics.selectionAsync().catch(() => {}); },
  /** 카드가 뒤집히거나 슬롯이 멈출 때 */
  tap: () => { if (on) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); },
  /** 결과가 터지는 순간 */
  pop: () => { if (on) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}); },
  done: () => { if (on) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); },
};
