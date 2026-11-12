/** 웹에는 홈 화면 위젯이 없다 (iOS: fortuneWidget.ios.ts · Android: fortuneWidget.android.ts). */
import type { DailyFortune } from '../types';

export async function syncFortuneWidget(_today: DailyFortune, _tomorrow: DailyFortune | null): Promise<void> {}

export function clearFortuneWidget(): void {}
