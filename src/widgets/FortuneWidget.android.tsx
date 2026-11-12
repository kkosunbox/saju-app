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
import { FlexWidget, ImageWidget, OverlapWidget, TextWidget } from 'react-native-android-widget';
import type { FortuneWidgetProps } from './fortuneWidgetProps';

type Hex = `#${string}`;
const LIGHT = { chip: '#D3ECFC', ink: '#1D212D', sub: '#3F4B5A', mute: '#2F4256', accent: '#0E8FE0', up: '#E54D4D', down: '#2F6AD0', button: '#1D212D', buttonInk: '#FFFFFF', skyFrom: '#3DB8FE', skyTo: '#DDF2FF' } as const;
const DARK = { chip: '#22344A', ink: '#EEF0F5', sub: '#C2C6D0', mute: '#A9B4C4', accent: '#5CC6FF', up: '#F07E7E', down: '#8CB4F5', button: '#EEF0F5', buttonInk: '#1D212D', skyFrom: '#164A6E', skyTo: '#121418' } as const;

/** 앱과 같은 Pretendard (app.config.js 의 위젯 플러그인 fonts) */
const F = { medium: 'Pretendard-Medium', semibold: 'Pretendard-SemiBold', bold: 'Pretendard-Bold', heavy: 'Pretendard-ExtraBold' };
/** 운Pick 워드마크 (앱 로고 그대로, 390×216) */
const LOGO = { light: require('../../assets/widget/logo-light.png'), dark: require('../../assets/widget/logo-dark.png') };
/** 앱 홈의 구름 하늘 배경 (iOS와 같은 그림) */
const SKY = {
  small: { light: require('../../assets/widget/bg-small-light.jpg'), dark: require('../../assets/widget/bg-small-dark.jpg') },
  medium: { light: require('../../assets/widget/bg-medium-light.jpg'), dark: require('../../assets/widget/bg-medium-dark.jpg') },
};

/**
 * 디자인 규칙은 iOS와 같다 — 머리줄 11 · 본문 13(작은)/15(중간) · 보조 12 · 점수 38(작은)/44(중간),
 * 머리줄은 맨 위 한 줄(왼쪽 워드마크, 오른쪽 날짜), 작은 위젯에는 '상세 풀이 보기'를 두지 않는다.
 */
export function FortuneWidget({ props, dark, small, width, height }: { props: FortuneWidgetProps; dark: boolean; small: boolean; width: number; height: number }) {
  const c = dark ? DARK : LIGHT;
  // 구름 하늘 그림을 깔고 그 위에 내용을 올린다 (그림은 위젯 크기에 맞춰 늘린다)
  const col = (children: React.ReactNode, clickAction = 'OPEN_APP') => (
    <OverlapWidget
      clickAction={clickAction}
      style={{
        width: 'match_parent',
        height: 'match_parent',
        borderRadius: 22,
        overflow: 'hidden',
        backgroundGradient: { from: c.skyFrom as Hex, to: c.skyTo as Hex, orientation: 'TOP_BOTTOM' },
      }}
    >
      <ImageWidget
        image={SKY[small ? 'small' : 'medium'][dark ? 'dark' : 'light']}
        imageWidth={Math.max(1, Math.round(width))}
        imageHeight={Math.max(1, Math.round(height))}
        resizeMode="cover"
        style={{ width: 'match_parent', height: 'match_parent' }}
      />
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
        }}
      >
        {children}
      </FlexWidget>
    </OverlapWidget>
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
