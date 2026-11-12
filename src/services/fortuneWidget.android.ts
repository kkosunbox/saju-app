/**
 * Android '오늘의 운세' 위젯에 운세를 넣는다 (src/widgets/FortuneWidget.android.tsx).
 * 오늘과 내일 운세를 저장해 두고, 위젯 작업이 그릴 때마다 지금 날짜에 맞는 날을 고른다.
 */
import type { DailyFortune } from '../types';
import { nextISO, toFortuneWidgetProps } from '../widgets/fortuneWidgetProps';
import { currentWidgetProps, readWidgetStore, writeWidgetStore, type FortuneWidgetStore } from '../widgets/fortuneWidgetStore.android';

async function save(update: (store: FortuneWidgetStore) => FortuneWidgetStore): Promise<void> {
  try {
    const store = update(await readWidgetStore());
    await writeWidgetStore(store);
    // 위젯 모듈이 없는 빌드에서는 여기서 실패한다 — 저장만 하고 넘어간다
    const { requestWidgetUpdate } = require('react-native-android-widget') as typeof import('react-native-android-widget');
    const { renderFortuneWidget } = require('../widgets/fortuneWidgetTask.android') as typeof import('../widgets/fortuneWidgetTask.android');
    const props = currentWidgetProps(store);
    await requestWidgetUpdate({
      widgetName: 'FortuneWidget',
      renderWidget: info => renderFortuneWidget(props, info.width),
    });
  } catch {
    // 위젯은 부가 기능이라 앱 흐름을 막지 않는다
  }
}

export async function syncFortuneWidget(today: DailyFortune, tomorrow: DailyFortune | null): Promise<void> {
  const days = [today, ...(tomorrow && tomorrow.date === nextISO(today.date) ? [tomorrow] : [])].map(toFortuneWidgetProps);
  await save(store => ({ ...store, signedOut: false, days }));
}

export function clearFortuneWidget(): void {
  void save(() => ({ signedOut: true, days: [], revealed: [] }));
}
