/**
 * Android 위젯 작업 (앱이 꺼져 있어도 위젯이 부르는 헤드리스 JS). index.ts 에서 등록한다.
 * 추가 · 30분 주기 · 크기 변경 때 다시 그리고, '운세 뽑기'를 누르면 오늘을 뽑은 날로 적고 뽑기 연출과 함께 다시 그린다.
 * 위젯은 그림 한 장이라 애니메이션을 못 해서 몇 장을 짧게 이어 그린다 (REVEAL_FRAMES).
 * 서버는 부르지 않는다 (AI 문장은 앱 홈에서 마스코트를 눌러 뽑을 때).
 */
import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { todayISO } from '../utils/date';
import { FortuneWidget, type FortuneWidgetFrame } from './FortuneWidget.android';
import { currentWidgetProps, readWidgetStore, writeWidgetStore } from './fortuneWidgetStore.android';
import type { FortuneWidgetProps } from './fortuneWidgetProps';

/** 이 너비(dp)보다 좁으면 작은 위젯 배치 */
const SMALL_MAX_WIDTH = 250;

/** app.config.js 에 등록한 위젯 이름 (작은 · 중간). 그리는 화면은 같다 */
export const FORTUNE_WIDGET_NAMES = ['FortuneWidgetSmall', 'FortuneWidget'] as const;

export function renderFortuneWidget(props: FortuneWidgetProps, width: number, height: number, frame?: FortuneWidgetFrame) {
  const size = { small: width < SMALL_MAX_WIDTH, width, height, frame };
  return {
    light: <FortuneWidget props={props} dark={false} {...size} />,
    dark: <FortuneWidget props={props} dark {...size} />,
  };
}

/**
 * 뽑기 연출: '뽑는 중…'을 잠깐 보여 준 뒤 점수를 몇 단계로 올려 최종 점수에서 멈춘다.
 * 한 장 그리는 데 기기에 따라 수백 ms가 들어서 장 수를 적게 둔다 (전체 1~2초).
 */
const DRAWING_HOLD_MS = 450;
const COUNT_STEPS = [0.3, 0.6, 0.85];
const COUNT_GAP_MS = 90;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function playReveal(task: WidgetTaskHandlerProps, before: FortuneWidgetProps, after: FortuneWidgetProps) {
  const { width, height } = task.widgetInfo;
  task.renderWidget(renderFortuneWidget(before, width, height, { drawing: true }));
  await wait(DRAWING_HOLD_MS);
  const target = after.score ?? 0;
  for (const step of COUNT_STEPS) {
    task.renderWidget(renderFortuneWidget(after, width, height, { score: Math.round(target * step) }));
    await wait(COUNT_GAP_MS);
  }
  task.renderWidget(renderFortuneWidget(after, width, height));
}

export async function fortuneWidgetTaskHandler(task: WidgetTaskHandlerProps) {
  if (!(FORTUNE_WIDGET_NAMES as readonly string[]).includes(task.widgetInfo.widgetName)) return;
  switch (task.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const store = await readWidgetStore();
      task.renderWidget(renderFortuneWidget(currentWidgetProps(store), task.widgetInfo.width, task.widgetInfo.height));
      break;
    }
    case 'WIDGET_CLICK': {
      const store = await readWidgetStore();
      const before = currentWidgetProps(store);
      if (task.clickAction === 'reveal') {
        const today = todayISO();
        if (!store.revealed.includes(today)) store.revealed.push(today);
        await writeWidgetStore(store);
      }
      const after = currentWidgetProps(store);
      // 이번 누름으로 처음 뽑혔을 때만 연출 (이미 뽑았거나 연출 중에 또 누르면 바로 최종 화면)
      if (before.state === 'ready' && !before.revealed && after.state === 'ready' && after.revealed) {
        await playReveal(task, before, after);
      } else {
        task.renderWidget(renderFortuneWidget(after, task.widgetInfo.width, task.widgetInfo.height));
      }
      break;
    }
    default:
      break;
  }
}
