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
import { Button, HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  aspectRatio, background, buttonStyle, containerBackground, fixedSize, font, foregroundStyle, frame, lineLimit, lineSpacing,
  monospacedDigit, padding, resizable, shapes, widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import type { JSX } from 'react';
import type { FortuneWidgetProps } from './fortuneWidgetProps';

// 함수 본문은 TS 타입을 걷어 낸 뒤 문자열로 옮겨져 위젯에서 그대로 돈다
//
// 디자인 규칙 (iOS · Android 같음)
// - 글자: 머리줄 11 · 본문 13(작은)/15(중간) · 보조 12 · 점수 38(작은)/44(중간). 한 줄로 끝나야 하는 글은 lineLimit(1)
// - 두 줄 요약은 fixedSize(vertical)로 높이를 지켜서, 자리가 빠듯해도 한 줄로 잘리지 않게 한다
// - 머리줄은 위젯 맨 위 한 줄: 왼쪽 운Pick 워드마크(앱 로고 그대로), 오른쪽 날짜
// - 위젯 전체를 누르면 앱 홈이 열리므로 작은 위젯에는 '상세 풀이 보기'를 두지 않는다
const FortuneWidgetLayout: (props: FortuneWidgetProps, env: WidgetEnvironment) => JSX.Element = (props, env) => {
  'widget';
  const dark = env.colorScheme === 'dark';
  const c = dark
    ? { chip: '#2A2E38', ink: '#EEF0F5', sub: '#C2C6D0', mute: '#9095A1', accent: '#28B2FE', up: '#F07E7E', down: '#7EA6EE', button: '#EEF0F5', buttonInk: '#1D212D' }
    : { chip: '#EEF1F5', ink: '#222222', sub: '#4F4F4F', mute: '#777777', accent: '#28B2FE', up: '#E54D4D', down: '#3B74D6', button: '#1D212D', buttonInk: '#FFFFFF' };
  // 앱 홈처럼 위는 하늘색, 아래로 갈수록 바탕색
  const sky = () => containerBackground(
    { type: 'linearGradient', colors: dark ? ['#15283A', '#121418'] : ['#DDF2FF', '#FFFFFF'], startPoint: { x: 0.5, y: 0 }, endPoint: { x: 0.5, y: 0.75 } },
    'widget',
  );
  const small = env.widgetFamily !== 'systemMedium';
  const app = 'woonpick://';
  const root = () => [frame({ maxWidth: 10000, maxHeight: 10000, alignment: 'topLeading' }), sky(), widgetURL(app)];
  const one = (size: number, weight: 'medium' | 'semibold' | 'bold' | 'heavy', color: string) => [font({ size, weight }), foregroundStyle(color), lineLimit(1)];

  const logo = dark ? props.logoDark : props.logo;
  const header = (
    <HStack spacing={4}>
      {logo ? (
        <Image uiImage={logo} modifiers={[resizable(), aspectRatio({ contentMode: 'fit' }), frame({ height: 18 })]} />
      ) : (
        <Text modifiers={one(12, 'heavy', c.ink)}>운Pick</Text>
      )}
      <Spacer />
      <Text modifiers={one(11, 'medium', c.mute)}>{props.dateLabel ?? ''}</Text>
    </HStack>
  );

  // 앱에 데이터가 없을 때 (프로필 전 · 일주일 넘게 앱을 안 열어 날짜가 지남)
  if (props.state !== 'ready') {
    const message = props.state === 'signedOut' ? '프로필을 만들면\n매일 운세가 여기 떠요' : '앱을 열면 오늘의\n운세를 받아 올게요';
    return (
      <VStack alignment="leading" spacing={0} modifiers={root()}>
        {header}
        <Spacer />
        <Text modifiers={[font({ size: small ? 15 : 17, weight: 'bold' }), foregroundStyle(c.ink), lineSpacing(3), lineLimit(2)]}>{message}</Text>
        <Text modifiers={[...one(12, 'semibold', c.accent), padding({ top: 6 })]}>운Pick 열기 →</Text>
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
      return (
        <VStack alignment="leading" spacing={0} modifiers={root()}>
          {header}
          <Spacer />
          <Text modifiers={[font({ size: 16, weight: 'bold' }), foregroundStyle(c.ink), lineSpacing(3), lineLimit(2)]}>{'오늘의 운세가\n도착했어요'}</Text>
          <VStack modifiers={[padding({ top: 12 })]}>{draw(10000)}</VStack>
        </VStack>
      );
    }
    return (
      <VStack alignment="leading" spacing={0} modifiers={root()}>
        {header}
        <Spacer />
        <HStack alignment="center" spacing={12}>
          <VStack alignment="leading" spacing={4}>
            <Text modifiers={one(17, 'bold', c.ink)}>오늘의 운세가 도착했어요</Text>
            <Text modifiers={one(12, 'medium', c.sub)}>뽑으면 점수와 한 줄 요약을 보여 드려요</Text>
          </VStack>
          <Spacer />
        </HStack>
        <HStack modifiers={[padding({ top: 12 })]}>
          {draw(150)}
          <Spacer />
        </HStack>
      </VStack>
    );
  }

  // 뽑음: 점수 · 어제 대비 · 요약. 누르면 앱 홈 (뽑기·AI 문장은 홈에서 마스코트를 눌렀을 때)
  const delta = typeof props.delta === 'number' ? props.delta : null;
  const deltaText = delta === null ? null : delta === 0 ? '어제와 같아요' : `어제보다 ${delta > 0 ? '▲' : '▼'}${Math.abs(delta)}`;
  const deltaColor = delta === null || delta === 0 ? c.mute : delta > 0 ? c.up : c.down;
  const score = (
    <VStack alignment="leading" spacing={2}>
      <HStack alignment="lastTextBaseline" spacing={2}>
        <Text modifiers={[font({ size: small ? 38 : 44, weight: 'heavy', design: 'rounded' }), monospacedDigit(), foregroundStyle(c.ink), lineLimit(1)]}>{String(props.score ?? 0)}</Text>
        <Text modifiers={one(15, 'bold', c.sub)}>점</Text>
      </HStack>
      {deltaText === null ? null : <Text modifiers={one(12, 'semibold', deltaColor)}>{deltaText}</Text>}
    </VStack>
  );

  if (small) {
    return (
      <VStack alignment="leading" spacing={0} modifiers={root()}>
        {header}
        <Spacer />
        {score}
        <Text modifiers={[font({ size: 13, weight: 'medium' }), foregroundStyle(c.ink), lineSpacing(2), lineLimit(2), fixedSize({ horizontal: false, vertical: true }), padding({ top: 6 })]}>{props.summary ?? ''}</Text>
      </VStack>
    );
  }

  const lucky = [props.luckyColor, props.luckyNumber != null ? String(props.luckyNumber) : null, props.luckyTime].filter(Boolean).join(' · ');
  return (
    <VStack alignment="leading" spacing={0} modifiers={root()}>
      {header}
      <Spacer />
      <HStack alignment="center" spacing={16}>
        {score}
        <VStack alignment="leading" spacing={6}>
          <Text modifiers={[font({ size: 15, weight: 'semibold' }), foregroundStyle(c.ink), lineSpacing(3), lineLimit(2), fixedSize({ horizontal: false, vertical: true })]}>{props.summary ?? ''}</Text>
          {props.keywords ? <Text modifiers={one(12, 'medium', c.sub)}>{props.keywords}</Text> : null}
        </VStack>
        <Spacer />
      </HStack>
      <Spacer />
      <HStack alignment="center" spacing={8}>
        {lucky ? (
          <Text modifiers={[...one(11, 'semibold', c.sub), padding({ horizontal: 8, vertical: 4 }), background(c.chip, shapes.capsule())]}>{lucky}</Text>
        ) : null}
        <Spacer />
        <Text modifiers={one(12, 'semibold', c.accent)}>상세 풀이 보기 →</Text>
      </HStack>
    </VStack>
  );
};

/** 앱이 처음 데이터를 넣기 전(설치 직후 위젯 갤러리)에 보이는 모습 */
const fortuneWidget = createWidget<FortuneWidgetProps>('FortuneWidget', FortuneWidgetLayout, { state: 'stale' });

export default fortuneWidget;
