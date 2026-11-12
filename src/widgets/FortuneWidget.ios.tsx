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
 *   서버의 뽑기(POST daily/draw, AI 문장)는 부르지 않는다 — 자세히 보기로 앱의 종합풀이를 열 때 그 화면이 부른다.
 * - ready + 뽑음: 점수 · 어제 대비 · 요약. 위젯을 누르면 종합풀이(/combined).
 * - stale: 앱이 넣어 둔 날짜가 지났다 (앱을 이틀 넘게 안 열었음). 누르면 앱 홈.
 * - signedOut: 프로필이 없다. 누르면 앱 홈.
 */
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import { Button, HStack, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  background, buttonStyle, containerBackground, font, foregroundStyle, frame, lineLimit, lineSpacing,
  minimumScaleFactor, monospacedDigit, padding, shapes, widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import type { JSX } from 'react';
import type { FortuneWidgetProps } from './fortuneWidgetProps';

// 함수 안에는 TS 문법(타입 표기·as const)을 두지 않는다 — 함수 본문이 문자열로 옮겨져 위젯에서 그대로 돈다
const FortuneWidgetLayout: (props: FortuneWidgetProps, env: WidgetEnvironment) => JSX.Element = (props, env) => {
  'widget';
  const dark = env.colorScheme === 'dark';
  const c = dark
    ? { bg: '#121418', card: '#1D2027', ink: '#EEF0F5', sub: '#C2C6D0', mute: '#9095A1', accent: '#28B2FE', accentSoft: '#15283A', up: '#F07E7E', down: '#7EA6EE', button: '#3A4152', buttonInk: '#FFFFFF' }
    : { bg: '#FFFFFF', card: '#F5F6F8', ink: '#222222', sub: '#4F4F4F', mute: '#777777', accent: '#28B2FE', accentSoft: '#EAF7FF', up: '#E54D4D', down: '#3B74D6', button: '#1D212D', buttonInk: '#FFFFFF' };
  // 앱 홈처럼 위는 하늘색, 아래로 갈수록 바탕색
  const sky = () => containerBackground(
    { type: 'linearGradient', colors: dark ? ['#15283A', '#121418'] : ['#DDF2FF', '#FFFFFF'], startPoint: { x: 0.5, y: 0 }, endPoint: { x: 0.5, y: 0.7 } },
    'widget',
  );
  const small = env.widgetFamily !== 'systemMedium';
  const app = 'woonpick://';
  const full = () => frame({ maxWidth: 10000, maxHeight: 10000, alignment: 'topLeading' });

  const header = (
    <HStack spacing={4}>
      <Text modifiers={[font({ size: 12, weight: 'bold' }), foregroundStyle(c.accent)]}>운Pick</Text>
      <Text modifiers={[font({ size: 12, weight: 'medium' }), foregroundStyle(c.mute)]}>{props.dateLabel ?? '오늘의 운세'}</Text>
      <Spacer />
    </HStack>
  );

  // 앱에 데이터가 없을 때 (로그인 전 · 이틀 넘게 앱을 안 열어 날짜가 지남)
  if (props.state !== 'ready') {
    const message = props.state === 'signedOut'
      ? '운Pick에서 프로필을 만들면\n매일 운세가 여기 떠요'
      : '앱을 열면 오늘의\n운세를 받아 올게요';
    return (
      <VStack alignment="leading" spacing={8} modifiers={[full(), sky(), widgetURL(app)]}>
        {header}
        <Spacer />
        <Text modifiers={[font({ size: small ? 15 : 17, weight: 'bold' }), foregroundStyle(c.ink), lineSpacing(2)]}>{message}</Text>
        <Text modifiers={[font({ size: 12, weight: 'semibold' }), foregroundStyle(c.accent)]}>운Pick 열기 →</Text>
      </VStack>
    );
  }

  // 오늘 운세가 있지만 아직 안 뽑음: 위젯 안에서 뽑기 (점수·요약만, AI 없음)
  if (!props.revealed) {
    return (
      <VStack alignment="leading" spacing={small ? 6 : 8} modifiers={[full(), sky(), widgetURL(app)]}>
        {header}
        <Spacer />
        <Text modifiers={[font({ size: small ? 17 : 19, weight: 'bold' }), foregroundStyle(c.ink), lineSpacing(2), lineLimit(2)]}>
          {small ? '오늘의 운세가\n도착했어요' : '오늘의 운세가 도착했어요'}
        </Text>
        {small ? null : (
          <Text modifiers={[font({ size: 13 }), foregroundStyle(c.sub), lineLimit(1)]}>버튼을 누르면 오늘의 점수와 한 줄 요약을 보여 드려요</Text>
        )}
        <Button
          target="reveal"
          onPress={() => ({ revealed: true })}
          modifiers={[buttonStyle('plain')]}
        >
          <Text
            modifiers={[
              font({ size: 14, weight: 'bold' }),
              foregroundStyle(c.buttonInk),
              frame({ maxWidth: small ? 10000 : 160, minHeight: 36 }),
              background(c.button, shapes.capsule()),
            ]}
          >
            운세 뽑기
          </Text>
        </Button>
      </VStack>
    );
  }

  // 뽑음: 점수 · 어제 대비 · 요약. 누르면 종합풀이 (거기서 AI 문장을 쓴다)
  const delta = typeof props.delta === 'number' ? props.delta : null;
  const deltaText = delta === null ? null : delta === 0 ? '어제와 같아요' : `어제보다 ${delta > 0 ? '▲' : '▼'}${Math.abs(delta)}`;
  const deltaColor = delta === null || delta === 0 ? c.mute : delta > 0 ? c.up : c.down;
  const score = (
    <HStack alignment="lastTextBaseline" spacing={2}>
      <Text modifiers={[font({ size: small ? 40 : 44, weight: 'heavy', design: 'rounded' }), monospacedDigit(), foregroundStyle(c.ink)]}>{String(props.score ?? 0)}</Text>
      <Text modifiers={[font({ size: 15, weight: 'bold' }), foregroundStyle(c.sub)]}>점</Text>
    </HStack>
  );
  const deltaView = deltaText === null ? null : (
    <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle(deltaColor)]}>{deltaText}</Text>
  );
  const more = <Text modifiers={[font({ size: 12, weight: 'semibold' }), foregroundStyle(c.accent)]}>자세히 보기 →</Text>;
  const detailUrl = `${app}combined`;

  if (small) {
    return (
      <VStack alignment="leading" spacing={4} modifiers={[full(), sky(), widgetURL(detailUrl)]}>
        {header}
        {score}
        {deltaView}
        <Spacer />
        <Text modifiers={[font({ size: 13, weight: 'medium' }), foregroundStyle(c.ink), lineLimit(2), minimumScaleFactor(0.9)]}>{props.summary ?? ''}</Text>
        {more}
      </VStack>
    );
  }

  const lucky = [props.luckyColor, props.luckyNumber != null ? String(props.luckyNumber) : null, props.luckyTime].filter(Boolean).join(' · ');
  return (
    <HStack alignment="top" spacing={14} modifiers={[full(), sky(), widgetURL(detailUrl)]}>
      <VStack alignment="leading" spacing={4} modifiers={[frame({ width: 104, alignment: 'topLeading' })]}>
        {header}
        {score}
        {deltaView}
        <Spacer />
        {more}
      </VStack>
      <VStack alignment="leading" spacing={8} modifiers={[full()]}>
        <Text modifiers={[font({ size: 14, weight: 'semibold' }), foregroundStyle(c.ink), lineLimit(3), lineSpacing(2), minimumScaleFactor(0.9)]}>{props.summary ?? ''}</Text>
        <Spacer />
        {props.keywords ? (
          <Text modifiers={[font({ size: 12, weight: 'medium' }), foregroundStyle(c.sub), lineLimit(1)]}>{props.keywords}</Text>
        ) : null}
        {lucky ? (
          <ZStack alignment="leading">
            <Text
              modifiers={[
                font({ size: 11, weight: 'semibold' }),
                foregroundStyle(c.sub),
                lineLimit(1),
                padding({ horizontal: 8, vertical: 4 }),
                background(c.card, shapes.capsule()),
              ]}
            >
              {`행운 ${lucky}`}
            </Text>
          </ZStack>
        ) : null}
      </VStack>
    </HStack>
  );
};

/** 앱이 처음 데이터를 넣기 전(설치 직후 위젯 갤러리)에 보이는 모습 */
const fortuneWidget = createWidget<FortuneWidgetProps>('FortuneWidget', FortuneWidgetLayout, { state: 'stale' });

export default fortuneWidget;
