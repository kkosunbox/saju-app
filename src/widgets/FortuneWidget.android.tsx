/**
 * Android 홈 화면 위젯 '오늘의 운세' (react-native-android-widget).
 * iOS(FortuneWidget.ios.tsx)와 같은 상태·문구를 쓴다. 그리는 일은 fortuneWidgetTask.android.tsx 가 한다.
 * - 안 뽑음: '운세 뽑기'(clickAction 'reveal') — 앱을 열지 않고 위젯 안에서 점수·요약을 보여 준다 (규칙 엔진, AI 없음).
 *   앱의 뽑기 상태는 바꾸지 않는다 — AI 문장은 앱 홈에서 마스코트를 꾹 눌러 뽑을 때만.
 * - 뽑음: 누르면 앱 홈 (종합풀이로 바로 가면 그 화면이 뽑기를 해 버린다)
 * - 그 밖: 누르면 앱
 */
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { FortuneWidgetProps } from './fortuneWidgetProps';

type Hex = `#${string}`;
const LIGHT = { ink: '#222222', sub: '#4F4F4F', mute: '#777777', accent: '#28B2FE', card: '#F5F6F8', up: '#E54D4D', down: '#3B74D6', button: '#1D212D', buttonInk: '#FFFFFF', skyFrom: '#DDF2FF', skyTo: '#FFFFFF' } as const;
const DARK = { ink: '#EEF0F5', sub: '#C2C6D0', mute: '#9095A1', accent: '#28B2FE', card: '#1D2027', up: '#F07E7E', down: '#7EA6EE', button: '#3A4152', buttonInk: '#FFFFFF', skyFrom: '#15283A', skyTo: '#121418' } as const;

const F = { medium: 'Pretendard-Medium', semibold: 'Pretendard-SemiBold', bold: 'Pretendard-Bold', heavy: 'Pretendard-ExtraBold' };

export function FortuneWidget({ props, dark, small }: { props: FortuneWidgetProps; dark: boolean; small: boolean }) {
  const c = dark ? DARK : LIGHT;
  const root = (clickAction: string, clickActionData?: Record<string, unknown>, children?: React.ReactNode) => (
    <FlexWidget
      clickAction={clickAction}
      clickActionData={clickActionData}
      style={{
        width: 'match_parent',
        height: 'match_parent',
        flexDirection: 'column',
        padding: 16,
        borderRadius: 22,
        backgroundGradient: { from: c.skyFrom as Hex, to: c.skyTo as Hex, orientation: 'TOP_BOTTOM' },
      }}
    >
      {children}
    </FlexWidget>
  );
  const text = (value: string, size: number, family: string, color: string, extra?: { maxLines?: number; clickAction?: string; clickActionData?: Record<string, unknown> }) => (
    <TextWidget
      text={value}
      maxLines={extra?.maxLines}
      truncate={extra?.maxLines ? 'END' : undefined}
      clickAction={extra?.clickAction}
      clickActionData={extra?.clickActionData}
      style={{ fontSize: size, fontFamily: family, color: color as Hex }}
    />
  );
  const header = (
    <FlexWidget style={{ flexDirection: 'row', flexGap: 4 }}>
      {text('운Pick', 12, F.bold, c.accent)}
      {text(props.dateLabel ?? '오늘의 운세', 12, F.medium, c.mute)}
    </FlexWidget>
  );
  const fill = <FlexWidget style={{ flex: 1 }} />;

  if (props.state !== 'ready') {
    const message = props.state === 'signedOut'
      ? '운Pick에서 프로필을 만들면\n매일 운세가 여기 떠요'
      : '앱을 열면 오늘의\n운세를 받아 올게요';
    return root('OPEN_APP', undefined, <>
      {header}
      {fill}
      {text(message, small ? 15 : 17, F.bold, c.ink, { maxLines: 2 })}
      {text('운Pick 열기 →', 12, F.semibold, c.accent)}
    </>);
  }

  if (!props.revealed) {
    return root('OPEN_APP', undefined, <>
      {header}
      {fill}
      {text(small ? '오늘의 운세가\n도착했어요' : '오늘의 운세가 도착했어요', small ? 17 : 19, F.bold, c.ink, { maxLines: 2 })}
      {small ? null : text('버튼을 누르면 오늘의 점수와 한 줄 요약을 보여 드려요', 13, F.medium, c.sub, { maxLines: 1 })}
      <FlexWidget
        clickAction="reveal"
        style={{
          marginTop: 8,
          height: 36,
          width: small ? 'match_parent' : 160,
          borderRadius: 18,
          backgroundColor: c.button as Hex,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {text('운세 뽑기', 14, F.bold, c.buttonInk, { clickAction: 'reveal' })}
      </FlexWidget>
    </>);
  }

  const delta = typeof props.delta === 'number' ? props.delta : null;
  const deltaText = delta === null ? null : delta === 0 ? '어제와 같아요' : `어제보다 ${delta > 0 ? '▲' : '▼'}${Math.abs(delta)}`;
  const deltaColor = delta === null || delta === 0 ? c.mute : delta > 0 ? c.up : c.down;
  const score = (
    <FlexWidget style={{ flexDirection: 'row', alignItems: 'flex-end', flexGap: 2 }}>
      {text(String(props.score ?? 0), small ? 38 : 42, F.heavy, c.ink)}
      <FlexWidget style={{ paddingBottom: 6 }}>{text('점', 15, F.bold, c.sub)}</FlexWidget>
    </FlexWidget>
  );
  const deltaView = deltaText === null ? null : text(deltaText, 11, F.semibold, deltaColor);
  const more = text('자세히 보기 →', 12, F.semibold, c.accent);

  if (small) {
    return root('OPEN_APP', undefined, <>
      {header}
      {score}
      {deltaView}
      {fill}
      {text(props.summary ?? '', 13, F.medium, c.ink, { maxLines: 2 })}
      {more}
    </>);
  }

  const lucky = [props.luckyColor, props.luckyNumber != null ? String(props.luckyNumber) : null, props.luckyTime].filter(Boolean).join(' · ');
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        width: 'match_parent',
        height: 'match_parent',
        flexDirection: 'row',
        flexGap: 14,
        padding: 16,
        borderRadius: 22,
        backgroundGradient: { from: c.skyFrom as Hex, to: c.skyTo as Hex, orientation: 'TOP_BOTTOM' },
      }}
    >
      <FlexWidget style={{ width: 104, height: 'match_parent', flexDirection: 'column' }}>
        {header}
        {score}
        {deltaView}
        {fill}
        {more}
      </FlexWidget>
      <FlexWidget style={{ flex: 1, height: 'match_parent', flexDirection: 'column', flexGap: 8 }}>
        {text(props.summary ?? '', 14, F.semibold, c.ink, { maxLines: 3 })}
        {fill}
        {props.keywords ? text(props.keywords, 12, F.medium, c.sub, { maxLines: 1 }) : null}
        {lucky ? (
          <FlexWidget style={{ backgroundColor: c.card as Hex, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 }}>
            {text(`행운 ${lucky}`, 11, F.semibold, c.sub, { maxLines: 1 })}
          </FlexWidget>
        ) : null}
      </FlexWidget>
    </FlexWidget>
  );
}
