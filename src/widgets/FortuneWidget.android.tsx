/**
 * Android 홈 화면 위젯 '오늘의 운세' (react-native-android-widget).
 * iOS(FortuneWidget.ios.tsx)와 같은 상태·문구를 쓴다. 그리는 일은 fortuneWidgetTask.android.tsx 가 한다.
 * - 안 뽑음: '운세 뽑기'(clickAction 'reveal') — 앱을 열지 않고 위젯 안에서 점수·요약을 보여 준다 (규칙 엔진, AI 없음).
 *   앱의 뽑기 상태는 바꾸지 않는다 — AI 문장은 앱 홈에서 마스코트를 꾹 눌러 뽑을 때만.
 * - 뽑음: 누르면 앱 홈 (종합풀이로 바로 가면 그 화면이 뽑기를 해 버린다)
 * - 그 밖: 누르면 앱
 * 디자인 수정은 OTA로 반영된다 (위젯을 JS로 그림). 새 글꼴·크기 설정은 새 빌드가 필요하다.
 */
import React from 'react';
import { FlexWidget, ImageWidget, TextWidget } from 'react-native-android-widget';
import type { FortuneWidgetProps } from './fortuneWidgetProps';

type Hex = `#${string}`;
const LIGHT = { chip: '#EEF1F5', ink: '#222222', sub: '#4F4F4F', mute: '#777777', accent: '#28B2FE', up: '#E54D4D', down: '#3B74D6', button: '#1D212D', buttonInk: '#FFFFFF', skyFrom: '#DDF2FF', skyTo: '#FFFFFF' } as const;
const DARK = { chip: '#2A2E38', ink: '#EEF0F5', sub: '#C2C6D0', mute: '#9095A1', accent: '#28B2FE', up: '#F07E7E', down: '#7EA6EE', button: '#EEF0F5', buttonInk: '#1D212D', skyFrom: '#15283A', skyTo: '#121418' } as const;

/** 앱과 같은 Pretendard (app.config.js 의 위젯 플러그인 fonts) */
const F = { medium: 'Pretendard-Medium', semibold: 'Pretendard-SemiBold', bold: 'Pretendard-Bold', heavy: 'Pretendard-ExtraBold' };
/** 운Pick 워드마크 (앱 로고 그대로, 390×216) */
const LOGO = { light: require('../../assets/widget/logo-light.png'), dark: require('../../assets/widget/logo-dark.png') };

/**
 * 디자인 규칙은 iOS와 같다 — 머리줄 11 · 본문 13(작은)/15(중간) · 보조 12 · 점수 38(작은)/44(중간),
 * 머리줄은 맨 위 한 줄(왼쪽 워드마크, 오른쪽 날짜), 작은 위젯에는 '상세 풀이 보기'를 두지 않는다.
 */
export function FortuneWidget({ props, dark, small }: { props: FortuneWidgetProps; dark: boolean; small: boolean }) {
  const c = dark ? DARK : LIGHT;
  const col = (children: React.ReactNode, clickAction = 'OPEN_APP') => (
    <FlexWidget
      clickAction={clickAction}
      style={{
        width: 'match_parent',
        height: 'match_parent',
        flexDirection: 'column',
        // 워드마크의 말풍선이 글자 위로 솟아 있어 위쪽 여백이 넓어 보인다 — 위만 4dp 줄여 위·아래가 같아 보이게
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 16,
        borderRadius: 22,
        backgroundGradient: { from: c.skyFrom as Hex, to: c.skyTo as Hex, orientation: 'TOP_BOTTOM' },
      }}
    >
      {children}
    </FlexWidget>
  );
  const text = (value: string, size: number, family: string, color: string, maxLines = 1, extra?: { lineHeight?: number; clickAction?: string }) => (
    <TextWidget
      text={value}
      maxLines={maxLines}
      truncate="END"
      clickAction={extra?.clickAction}
      style={{ fontSize: size, fontFamily: family, color: color as Hex, lineHeight: extra?.lineHeight }}
    />
  );
  const fill = <FlexWidget style={{ flex: 1 }} />;
  const header = (
    <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'flex-end' }}>
      <ImageWidget image={dark ? LOGO.dark : LOGO.light} imageWidth={32} imageHeight={18} resizeMode="contain" />
      <FlexWidget style={{ flex: 1 }} />
      {text(props.dateLabel ?? '', 11, F.medium, c.mute)}
    </FlexWidget>
  );

  // 앱에 데이터가 없을 때 (프로필 전 · 일주일 넘게 앱을 안 열어 날짜가 지남)
  if (props.state !== 'ready') {
    const message = props.state === 'signedOut' ? '프로필을 만들면\n매일 운세가 여기 떠요' : '앱을 열면 오늘의\n운세를 받아 올게요';
    return col(<>
      {header}
      {fill}
      {text(message, small ? 15 : 17, F.bold, c.ink, 2, { lineHeight: small ? 21 : 24 })}
      <FlexWidget style={{ paddingTop: 6 }}>{text('운Pick 열기 →', 12, F.semibold, c.accent)}</FlexWidget>
    </>);
  }

  // 오늘 운세가 있지만 아직 안 뽑음: 위젯 안에서 뽑기 (점수·요약만, AI 없음)
  if (!props.revealed) {
    const draw = (
      <FlexWidget
        clickAction="reveal"
        style={{ marginTop: 12, height: 36, width: small ? 'match_parent' : 150, borderRadius: 18, backgroundColor: c.button as Hex, justifyContent: 'center', alignItems: 'center' }}
      >
        {text('운세 뽑기', 14, F.bold, c.buttonInk, 1, { clickAction: 'reveal' })}
      </FlexWidget>
    );
    return col(<>
      {header}
      {fill}
      {small
        ? text('오늘의 운세가\n도착했어요', 16, F.bold, c.ink, 2, { lineHeight: 22 })
        : <>
          {text('오늘의 운세가 도착했어요', 17, F.bold, c.ink)}
          <FlexWidget style={{ paddingTop: 4 }}>{text('뽑으면 점수와 한 줄 요약을 보여 드려요', 12, F.medium, c.sub)}</FlexWidget>
        </>}
      {draw}
    </>);
  }

  // 뽑음: 점수 · 어제 대비 · 요약. 누르면 앱 홈
  const delta = typeof props.delta === 'number' ? props.delta : null;
  const deltaText = delta === null ? null : delta === 0 ? '어제와 같아요' : `어제보다 ${delta > 0 ? '▲' : '▼'}${Math.abs(delta)}`;
  const deltaColor = delta === null || delta === 0 ? c.mute : delta > 0 ? c.up : c.down;
  const score = (
    <FlexWidget style={{ flexDirection: 'column' }}>
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'flex-end', flexGap: 2 }}>
        {text(String(props.score ?? 0), small ? 38 : 44, F.heavy, c.ink, 1, { lineHeight: small ? 42 : 48 })}
        <FlexWidget style={{ paddingBottom: 7 }}>{text('점', 15, F.bold, c.sub)}</FlexWidget>
      </FlexWidget>
      {deltaText === null ? null : text(deltaText, 12, F.semibold, deltaColor)}
    </FlexWidget>
  );

  if (small) {
    return col(<>
      {header}
      {fill}
      {score}
      <FlexWidget style={{ paddingTop: 6 }}>{text(props.summary ?? '', 13, F.medium, c.ink, 2, { lineHeight: 18 })}</FlexWidget>
    </>);
  }

  const lucky = [props.luckyColor, props.luckyNumber != null ? String(props.luckyNumber) : null, props.luckyTime].filter(Boolean).join(' · ');
  return col(<>
    {header}
    {fill}
    <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center', flexGap: 16 }}>
      {score}
      <FlexWidget style={{ flex: 1, flexDirection: 'column', flexGap: 6 }}>
        {text(props.summary ?? '', 15, F.semibold, c.ink, 2, { lineHeight: 21 })}
        {props.keywords ? text(props.keywords, 12, F.medium, c.sub) : null}
      </FlexWidget>
    </FlexWidget>
    {fill}
    <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center' }}>
      {lucky ? (
        <FlexWidget style={{ backgroundColor: c.chip as Hex, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 }}>
          {text(lucky, 11, F.semibold, c.sub)}
        </FlexWidget>
      ) : null}
      <FlexWidget style={{ flex: 1 }} />
      {text('상세 풀이 보기 →', 12, F.semibold, c.accent)}
    </FlexWidget>
  </>);
}
