/**
 * Android 위젯 작업 (앱이 꺼져 있어도 위젯이 부르는 헤드리스 JS). index.ts 에서 등록한다.
 * 추가 · 30분 주기 · 크기 변경 때 다시 그리고, '운세 뽑기'를 누르면 오늘을 뽑은 날로 적고 다시 그린다.
 * 서버는 부르지 않는다 (AI 문장은 앱 홈에서 마스코트를 눌러 뽑을 때).
 */
import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { todayISO } from '../utils/date';
import { FortuneWidget } from './FortuneWidget.android';
import { currentWidgetProps, readWidgetStore, writeWidgetStore } from './fortuneWidgetStore.android';
import type { FortuneWidgetProps } from './fortuneWidgetProps';

/** 이 너비(dp)보다 좁으면 작은 위젯 배치 */
const SMALL_MAX_WIDTH = 250;

export function renderFortuneWidget(props: FortuneWidgetProps, width: number) {
  const small = width < SMALL_MAX_WIDTH;
  return {
    light: <FortuneWidget props={props} dark={false} small={small} />,
    dark: <FortuneWidget props={props} dark small={small} />,
  };
}

export async function fortuneWidgetTaskHandler(task: WidgetTaskHandlerProps) {
  if (task.widgetInfo.widgetName !== 'FortuneWidget') return;
  switch (task.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const store = await readWidgetStore();
      task.renderWidget(renderFortuneWidget(currentWidgetProps(store), task.widgetInfo.width));
      break;
    }
    case 'WIDGET_CLICK': {
      const store = await readWidgetStore();
      if (task.clickAction === 'reveal') {
        const today = todayISO();
        if (!store.revealed.includes(today)) store.revealed.push(today);
        await writeWidgetStore(store);
      }
      task.renderWidget(renderFortuneWidget(currentWidgetProps(store), task.widgetInfo.width));
      break;
    }
    default:
      break;
  }
}
