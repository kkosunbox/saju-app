/**
 * AI 풀이가 다 써졌을 때 사용자에게 어떻게 알릴지 정한다 (PremiumContext와 /dev/toast가 함께 쓴다).
 * - 그 화면을 보고 있음 → 아무것도 안 띄움 (풀이가 화면에 바로 채워진다)
 * - 앱이 백그라운드 → 서버 푸시가 알린다 (앱은 아무것도 안 함)
 * - 백그라운드일 때 이미 푸시로 알림 (알림 센터에 남았거나 눌러서 들어옴) → 토스트를 또 띄우지 않음
 * - 그 밖 (앱은 켜져 있고 다른 화면) → 눌러서 이동하는 토스트
 */
import { AppState } from 'react-native';
import { router, type Href } from 'expo-router';
import { hrefOfKey, titleOfKey } from './premium/catalog';
import { isViewing } from './readingPresence';
import { push } from './push';

export type ReadingDoneOutcome = 'viewing' | 'background' | 'pushed' | 'toast';

export async function announceReadingDone(
  key: string,
  toast: (msg: string, onPress?: () => void) => void,
): Promise<ReadingDoneOutcome> {
  if (isViewing(key)) return 'viewing';
  if (AppState.currentState !== 'active') return 'background';
  if (await push.wasNotified(key)) return 'pushed';
  // 알림 센터를 확인하는 사이에 그 화면으로 들어왔을 수 있다
  if (isViewing(key)) return 'viewing';
  const href = hrefOfKey(key);
  toast(`${titleOfKey(key)} 풀이가 완성됐어요`, href ? () => router.push(href as Href) : undefined);
  return 'toast';
}
