/**
 * iOS 홈 화면 위젯 '오늘의 운세' (expo-widgets).
 *
 * 아래 'widget' 함수는 앱이 아니라 위젯 확장 안의 작은 JS 런타임에서 돈다. 그래서
 * - 함수 바깥(이 파일의 상수·다른 모듈)을 참조할 수 없다. 필요한 값은 모두 함수 안에 두거나 props로 받는다.
 * - 훅·비동기·네트워크를 쓸 수 없다. 데이터는 앱이 props로 넣어 준다 (services/widget).
 * - VStack·Text·font(...) 같은 이름은 위젯 런타임이 @expo/ui/swift-ui 를 전역으로 넣어 준다.
 *
 * 상태
 * - ready + 안 뽑음: '오늘의 운세 뽑기' 버튼 (iOS 17+). 누르면 앱을 열지 않고 위젯 안에서 점수·요약을 보여 준다.
 *   규칙 엔진 운세만 보여 주고 서버의 뽑기(POST daily/draw, AI 문장)는 부르지 않는다. 앱의 뽑기 상태도 바꾸지 않아서,
 *   AI 문장은 앱 홈에서 마스코트를 꾹 눌러 뽑을 때만 쓴다.
 * - ready + 뽑음: 점수 · 어제 대비 · 요약. 위젯을 누르면 앱 홈 (종합풀이로 바로 가면 그 화면이 뽑기를 해 버린다).
 * - stale: 앱이 넣어 둔 날짜가 지났다 (앱을 일주일 넘게 안 열었음). 누르면 앱 홈.
 * - signedOut: 프로필이 없다. 누르면 앱 홈.
 */
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import { Button, HStack, Image, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  aspectRatio, background, buttonStyle, containerBackground, fixedSize, font, foregroundStyle, frame, kerning, lineLimit, lineSpacing, offset,
  monospacedDigit, padding, resizable, shapes, widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import type { JSX } from 'react';
import type { FortuneWidgetProps } from './fortuneWidgetProps';

// 함수 본문은 TS 타입을 걷어 낸 뒤 문자열로 옮겨져 위젯에서 그대로 돈다
//
// 디자인: 피그마 '사주앱' 위젯 (중간 545:2495 · 547:2704, 작은 547:2705). 시안은 높이 887px = 위젯 170pt 기준이라
// 1px ≈ 0.19pt 로 옮겼다. 시스템 기본 여백(content margins) 대신 시안의 여백을 쓴다.
// - 머리줄: 운PICK 워드마크(18pt 높이) · 오른쪽 날짜 12.5pt
// - 점수 46pt(작은 44pt) ExtraBold · '점' 12.5pt · 어제 대비 12.5pt 하늘색
// - 요약 14.5pt(작은 12.5pt) · 키워드 13pt · 행운 칩(하늘색 20% 바탕) · '상세 풀이 보기 →'
// - 위젯 전체를 누르면 앱 홈이 열리므로 작은 위젯에는 '상세 풀이 보기'를 두지 않는다
const FortuneWidgetLayout: (props: FortuneWidgetProps, env: WidgetEnvironment) => JSX.Element = (props, env) => {
  'widget';
  const dark = env.colorScheme === 'dark';
  const c = dark
    ? { ink: '#FFFFFF', score: '#FFFFFF', sub: '#B8B8B8', accent: '#28B2FE', up: '#FF7A7A', chip: '#28B2FE33', chipInk: '#FFFFFF', button: '#FFFFFF', buttonInk: '#0E1530' }
    : { ink: '#222222', score: '#363636', sub: '#666666', accent: '#28B2FE', up: '#F25555', chip: '#28B2FE33', chipInk: '#000000', button: '#222222', buttonInk: '#FFFFFF' };
  const small = env.widgetFamily !== 'systemMedium';
  const app = 'woonpick://';
  // 그림이 없을 때만 보이는 바탕 (시안 하늘 · 밤하늘 색)
  const sky = containerBackground(
    { type: 'linearGradient', colors: dark ? ['#0E1638', '#1B2A5E'] : ['#1DAEFC', '#EAF6FF'], startPoint: { x: 0.5, y: 0 }, endPoint: { x: 0.5, y: 1 } },
    'widget',
  );
  // 시스템 여백을 걷어 내고 시안의 여백을 준다
  const m = env.widgetContentMargins ?? { top: 16, bottom: 16, leading: 16, trailing: 16 };
  const edge = small ? { top: 9.5, bottom: 16, leading: 12, trailing: 12.5 } : { top: 10, bottom: 14, leading: 19.5, trailing: 19.5 };
  const art = props.art
    ? <Image
        uiImage={`${props.art}bg-${small ? 'small' : 'medium'}-${dark ? 'dark' : 'light'}.jpg`}
        modifiers={[resizable(), frame({ maxWidth: 10000, maxHeight: 10000 }), padding({ top: -m.top, bottom: -m.bottom, leading: -m.leading, trailing: -m.trailing })]}
      />
    : null;
  const wrap = (content: JSX.Element) => (
    <ZStack alignment="topLeading" modifiers={[sky, widgetURL(app)]}>
      {art}
      {content}
    </ZStack>
  );
  const root = () => [
    frame({ maxWidth: 10000, maxHeight: 10000, alignment: 'topLeading' }),
    padding({ top: edge.top - m.top, bottom: edge.bottom - m.bottom, leading: edge.leading - m.leading, trailing: edge.trailing - m.trailing }),
  ];
  type W = 'medium' | 'semibold' | 'bold' | 'heavy';
  // 시안 자간 -4% (점수는 -6%)
  const t = (size: number, weight: W, color: string, track = -0.04) => [font({ size, weight }), foregroundStyle(color), kerning(size * track)];
  const one = (size: number, weight: W, color: string) => [...t(size, weight, color), lineLimit(1)];

  const logo = props.art ? `${props.art}logo-${dark ? 'dark' : 'light'}.png` : null;
  // 날짜는 말풍선이 아니라 '운PICK' 글자 아랫줄에 맞춘다
  const header = (
    <HStack spacing={4} alignment="bottom">
      {logo ? (
        <Image uiImage={logo} modifiers={[resizable(), aspectRatio({ contentMode: 'fit' }), frame({ height: 18 })]} />
      ) : (
        <Text modifiers={one(13, 'heavy', c.ink)}>운PICK</Text>
      )}
      <Spacer />
      <Text modifiers={[...one(12.5, 'medium', c.sub), padding({ bottom: 0.5 })]}>{props.dateLabel ?? ''}</Text>
    </HStack>
  );

  // 앱에 데이터가 없을 때 (프로필 전 · 일주일 넘게 앱을 안 열어 날짜가 지남)
  if (props.state !== 'ready') {
    const message = props.state === 'signedOut' ? '프로필을 만들면\n매일 운세가 여기 떠요' : '앱을 열면 오늘의\n운세를 받아 올게요';
    return wrap(
      <VStack alignment="leading" spacing={0} modifiers={root()}>
        {header}
        <Spacer />
        <Text modifiers={[...t(small ? 15 : 17, 'bold', c.ink), lineSpacing(3), lineLimit(2)]}>{message}</Text>
        <Text modifiers={[...one(12.5, 'semibold', c.accent), padding({ top: 6 })]}>운Pick 열기 →</Text>
      </VStack>
    );
  }

  // 오늘 운세가 있지만 아직 안 뽑음: 위젯 안에서 뽑기 (점수·요약만, AI 없음)
  if (!props.revealed) {
    const draw = (width: number) => (
      <Button target="reveal" onPress={() => ({ revealed: true })} modifiers={[buttonStyle('plain')]}>
        <Text modifiers={[...one(14, 'bold', c.buttonInk), frame({ maxWidth: width, minHeight: 36 }), background(c.button, shapes.capsule())]}>
          운세 뽑기
        </Text>
      </Button>
    );
    if (small) {
      return wrap(
        <VStack alignment="leading" spacing={0} modifiers={root()}>
          {header}
          <Spacer />
          <Text modifiers={[...t(16, 'bold', c.ink), lineSpacing(3), lineLimit(2)]}>{'오늘의 운세가\n도착했어요'}</Text>
          <VStack modifiers={[padding({ top: 12 })]}>{draw(10000)}</VStack>
        </VStack>
      );
    }
    return wrap(
      <VStack alignment="leading" spacing={0} modifiers={root()}>
        {header}
        <Spacer />
        <Text modifiers={one(17, 'bold', c.ink)}>오늘의 운세가 도착했어요</Text>
        <Text modifiers={[...one(13, 'medium', c.sub), padding({ top: 4 })]}>뽑으면 점수와 한 줄 요약을 보여 드려요</Text>
        <HStack modifiers={[padding({ top: 12 })]}>
          {draw(150)}
          <Spacer />
        </HStack>
      </VStack>
    );
  }

  // 뽑음: 점수 · 어제 대비 · 요약. 누르면 앱 홈 (뽑기·AI 문장은 홈에서 마스코트를 눌렀을 때)
  const delta = typeof props.delta === 'number' ? props.delta : null;
  const deltaColor = delta !== null && delta > 0 ? c.up : c.accent;
  const deltaView = delta === null ? null : delta === 0 ? (
    <Text modifiers={one(12.5, 'semibold', c.accent)}>어제와 같아요</Text>
  ) : (
    <HStack spacing={0} alignment="center">
      <Text modifiers={one(12.5, 'semibold', deltaColor)}>어제보다</Text>
      <Text modifiers={[...one(9, 'semibold', deltaColor), padding({ leading: 7, trailing: 3 })]}>{delta > 0 ? '▲' : '▼'}</Text>
      <Text modifiers={one(12.5, 'semibold', deltaColor)}>{String(Math.abs(delta))}</Text>
    </HStack>
  );
  const score = (
    <HStack alignment="lastTextBaseline" spacing={2}>
      <Text modifiers={[...t(small ? 44 : 46, 'heavy', c.score, -0.06), monospacedDigit(), lineLimit(1)]}>{String(props.score ?? 0)}</Text>
      <Text modifiers={one(12.5, 'medium', c.ink)}>점</Text>
    </HStack>
  );

  if (small) {
    return wrap(
      <VStack alignment="leading" spacing={0} modifiers={root()}>
        {header}
        <Spacer />
        {score}
        {deltaView}
        <Text modifiers={[...t(12.5, 'medium', c.ink), lineSpacing(4), lineLimit(2), fixedSize({ horizontal: false, vertical: true }), padding({ top: 7 })]}>{props.summarySmall ?? props.summary ?? ''}</Text>
      </VStack>
    );
  }

  const lucky = [props.luckyColor, props.luckyNumber != null ? String(props.luckyNumber) : null, props.luckyTime].filter(Boolean).join(' · ');
  return wrap(
    <VStack alignment="leading" spacing={0} modifiers={root()}>
      {header}
      {/* 가운데: 왼쪽 점수 · 어제 대비, 오른쪽 요약 · 키워드 (아랫줄을 맞춘다) */}
      <HStack alignment="top" spacing={0} modifiers={[frame({ height: 74 }), padding({ top: 12 })]}>
        <VStack alignment="leading" spacing={0} modifiers={[frame({ width: 100.5, alignment: 'topLeading' })]}>
          {score}
          <Spacer />
          {deltaView}
        </VStack>
        {/* 요약 글자 윗선을 점수 숫자 윗선에, 키워드를 '어제보다' 줄에 맞춘다 (시뮬레이터에서 픽셀로 잰 값) */}
        <VStack alignment="leading" spacing={0} modifiers={[padding({ top: 8.7 })]}>
          <Text modifiers={[...t(14.5, 'medium', c.ink), lineSpacing(1.5), lineLimit(2), fixedSize({ horizontal: false, vertical: true })]}>{props.summary ?? ''}</Text>
          <Spacer />
          {props.keywords ? <Text modifiers={[...one(13, 'medium', c.sub), offset({ y: 4.7 })]}>{props.keywords}</Text> : null}
        </VStack>
        <Spacer />
      </HStack>
      <Spacer />
      <HStack alignment="center" spacing={8}>
        {lucky ? (
          <Text modifiers={[...one(13, 'medium', c.chipInk), padding({ horizontal: 8.5, vertical: 2.5 }), background(c.chip, shapes.capsule())]}>{lucky}</Text>
        ) : null}
        <Spacer />
        <Text modifiers={one(12.5, 'semibold', c.accent)}>상세 풀이 보기 →</Text>
      </HStack>
    </VStack>
  );
};

/** 앱이 처음 데이터를 넣기 전(설치 직후 위젯 갤러리)에 보이는 모습 */
const fortuneWidget = createWidget<FortuneWidgetProps>('FortuneWidget', FortuneWidgetLayout, { state: 'stale' });

export default fortuneWidget;
