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
type Color = Hex | `rgba(${number}, ${number}, ${number}, ${number})`;
// 피그마 '사주앱' 위젯 시안과 같은 색 (iOS FortuneWidget.ios.tsx 와 같다)
const LIGHT = { ink: '#222222', score: '#363636', sub: '#666666', accent: '#28B2FE', up: '#F25555', chip: 'rgba(40, 178, 254, 0.2)', chipInk: '#000000', button: '#222222', buttonInk: '#FFFFFF', skyFrom: '#1DAEFC', skyTo: '#EAF6FF' } as const;
const DARK = { ink: '#FFFFFF', score: '#FFFFFF', sub: '#B8B8B8', accent: '#28B2FE', up: '#FF7A7A', chip: 'rgba(40, 178, 254, 0.2)', chipInk: '#FFFFFF', button: '#FFFFFF', buttonInk: '#0E1530', skyFrom: '#0E1638', skyTo: '#1B2A5E' } as const;

/** 앱과 같은 Pretendard (app.config.js 의 위젯 플러그인 fonts) */
const F = { medium: 'Pretendard-Medium', semibold: 'Pretendard-SemiBold', bold: 'Pretendard-Bold', heavy: 'Pretendard-ExtraBold' };
/** 운Pick 워드마크 (390×216) */
const LOGO = { light: require('../../assets/widget/logo-light.png'), dark: require('../../assets/widget/logo-dark.png') };
/** 피그마 시안의 구름 하늘 배경 */
const SKY = {
  small: { light: require('../../assets/widget/bg-small-light.jpg'), dark: require('../../assets/widget/bg-small-dark.jpg') },
  medium: { light: require('../../assets/widget/bg-medium-light.jpg'), dark: require('../../assets/widget/bg-medium-dark.jpg') },
};

/**
 * 피그마 시안(중간 545:2495 · 547:2704, 작은 547:2705)을 높이 170dp 기준으로 옮겼다 — iOS와 같은 수치.
 * 머리줄 워드마크 18dp · 날짜 12.5 / 점수 46(작은 44) ExtraBold · '점' 12.5 · 어제 대비 12.5 하늘색 /
 * 요약 14.5(작은 12.5) · 키워드 13 · 행운 칩 · '상세 풀이 보기 →'. 작은 위젯에는 키워드·칩·상세 풀이 보기가 없다.
 */
export function FortuneWidget({ props, dark, small, width, height }: { props: FortuneWidgetProps; dark: boolean; small: boolean; width: number; height: number }) {
  const c = dark ? DARK : LIGHT;
  const edge = small ? { top: 9.5, bottom: 16, left: 12, right: 12.5 } : { top: 10, bottom: 14, left: 19.5, right: 19.5 };
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
          paddingTop: edge.top,
          paddingBottom: edge.bottom,
          paddingLeft: edge.left,
          paddingRight: edge.right,
        }}
      >
        {children}
      </FlexWidget>
    </OverlapWidget>
  );
  // 시안 자간 -4% (점수는 -6%)
  const text = (value: string, size: number, family: string, color: Color, maxLines = 1, extra?: { lineHeight?: number; clickAction?: string; track?: number }) => (
    <TextWidget
      text={value}
      maxLines={maxLines}
      truncate="END"
      clickAction={extra?.clickAction}
      style={{ fontSize: size, fontFamily: family, color, lineHeight: extra?.lineHeight, letterSpacing: size * (extra?.track ?? -0.04) }}
    />
  );
  const fill = <FlexWidget style={{ flex: 1 }} />;
  const header = (
    <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'flex-end' }}>
      <ImageWidget image={dark ? LOGO.dark : LOGO.light} imageWidth={32.5} imageHeight={18} resizeMode="contain" />
      <FlexWidget style={{ flex: 1 }} />
      {text(props.dateLabel ?? '', 12.5, F.medium, c.sub)}
    </FlexWidget>
  );

  // 앱에 데이터가 없을 때 (프로필 전 · 일주일 넘게 앱을 안 열어 날짜가 지남)
  if (props.state !== 'ready') {
    const message = props.state === 'signedOut' ? '프로필을 만들면\n매일 운세가 여기 떠요' : '앱을 열면 오늘의\n운세를 받아 올게요';
    return col(<>
      {header}
      {fill}
      {text(message, small ? 15 : 17, F.bold, c.ink, 2, { lineHeight: small ? 21 : 24 })}
      <FlexWidget style={{ paddingTop: 6 }}>{text('운Pick 열기 →', 12.5, F.semibold, c.accent)}</FlexWidget>
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
          <FlexWidget style={{ paddingTop: 4 }}>{text('뽑으면 점수와 한 줄 요약을 보여 드려요', 13, F.medium, c.sub)}</FlexWidget>
        </>}
      {draw}
    </>);
  }

  // 뽑음: 점수 · 어제 대비 · 요약. 누르면 앱 홈
  const delta = typeof props.delta === 'number' ? props.delta : null;
  const deltaColor = delta !== null && delta > 0 ? c.up : c.accent;
  const deltaView = delta === null ? null : delta === 0 ? text('어제와 같아요', 12.5, F.semibold, c.accent) : (
    <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
      {text('어제보다', 12.5, F.semibold, deltaColor)}
      <FlexWidget style={{ paddingLeft: 7, paddingRight: 3 }}>{text(delta > 0 ? '▲' : '▼', 9, F.semibold, deltaColor)}</FlexWidget>
      {text(String(Math.abs(delta)), 12.5, F.semibold, deltaColor)}
    </FlexWidget>
  );
  const scoreSize = small ? 44 : 46;
  const score = (
    <FlexWidget style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
      {text(String(props.score ?? 0), scoreSize, F.heavy, c.score, 1, { lineHeight: scoreSize + 4, track: -0.06 })}
      <FlexWidget style={{ paddingLeft: 2, paddingBottom: 7 }}>{text('점', 12.5, F.medium, c.ink)}</FlexWidget>
    </FlexWidget>
  );

  if (small) {
    return col(<>
      {header}
      {fill}
      {score}
      {deltaView}
      <FlexWidget style={{ paddingTop: 7 }}>{text(props.summary ?? '', 12.5, F.medium, c.ink, 2, { lineHeight: 19 })}</FlexWidget>
    </>);
  }

  const lucky = [props.luckyColor, props.luckyNumber != null ? String(props.luckyNumber) : null, props.luckyTime].filter(Boolean).join(' · ');
  return col(<>
    {header}
    {/* 가운데: 왼쪽 점수 · 어제 대비, 오른쪽 요약 · 키워드 (아랫줄을 맞춘다) */}
    <FlexWidget style={{ width: 'match_parent', height: 74, marginTop: 12, flexDirection: 'row' }}>
      <FlexWidget style={{ width: 100.5, height: 'match_parent', flexDirection: 'column' }}>
        {score}
        {fill}
        {deltaView}
      </FlexWidget>
      <FlexWidget style={{ flex: 1, height: 'match_parent', flexDirection: 'column', paddingTop: 8.7 }}>
        {text(props.summary ?? '', 14.5, F.medium, c.ink, 2, { lineHeight: 19 })}
        {fill}
        {props.keywords ? text(props.keywords, 13, F.medium, c.sub) : null}
      </FlexWidget>
    </FlexWidget>
    {fill}
    <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center' }}>
      {lucky ? (
        <FlexWidget style={{ backgroundColor: c.chip, borderRadius: 13, paddingHorizontal: 8.5, paddingVertical: 2.5 }}>
          {text(lucky, 13, F.medium, c.chipInk)}
        </FlexWidget>
      ) : null}
      <FlexWidget style={{ flex: 1 }} />
      {text('상세 풀이 보기 →', 12.5, F.semibold, c.accent)}
    </FlexWidget>
  </>);
}
