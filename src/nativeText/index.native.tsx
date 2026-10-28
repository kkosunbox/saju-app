/* eslint-disable @typescript-eslint/no-require-imports */
import type { StyleProp, TextInputProps, TextProps, TextStyle } from 'react-native';

/**
 * 네이티브에서 앱 코드가 불러오는 'react-native' (metro.config.js 가 이 모듈로 바꿔 준다).
 * react-native 를 그대로 다시 내보내고 Text·TextInput 만 아래 규칙을 더한 버전으로 바꾼다.
 *
 * 웹은 +html.tsx 의 전역 CSS가 글꼴을 지정하지 않은 글자 전부에 Pretendard(자간 -0.2)를 깔아 주지만,
 * 네이티브는 fontFamily 가 없으면 시스템 글꼴(Apple SD Gothic Neo)로 그려 한글이 눈에 띄게 작아 보인다.
 * - 바깥 Text: 글꼴이 없으면 fontWeight 에 맞는 Pretendard 파일과 웹과 같은 자간을 넣는다
 * - 안쪽 Text: 부모 글꼴을 물려받고, fontWeight 를 따로 줬을 때만 그 굵기 파일로 바꾼다
 * - 시스템 글자 크기(iOS 텍스트 크기·Android 글꼴 크기)는 따르지 않는다. 웹과 같은 크기로 디자인대로 보이게 (화면에서 allowFontScaling 을 주면 그 값을 쓴다)
 *
 * react-native 의 내보내기는 처음 읽을 때 모듈을 불러오는 getter 라서, export * 대신 getter 를 그대로 옮겨 담는다
 * (export * 는 모든 모듈을 한 번에 불러와 쓰지 않는 네이티브 모듈까지 깨운다)
 */
const React = require('react') as typeof import('react');
const RN = require('react-native') as typeof import('react-native');

const BaseText = RN.Text;
const BaseTextInput = RN.TextInput;
const TextAncestor = RN.unstable_TextAncestorContext;
const WEB_LETTER_SPACING = -0.2;

// 굵기 → Pretendard 파일 (theme/typography.ts 의 sansW 와 같은 표). 이 모듈은 react-native 자리를 대신하므로
// react-native 를 불러오는 앱 모듈(typography 등)을 불러오면 서로를 기다리는 순환이 생겨 여기 따로 둔다
const PRE: Record<string, string> = { '400': 'Pretendard-Regular', '500': 'Pretendard-Medium', '600': 'Pretendard-SemiBold', '700': 'Pretendard-Bold', '800': 'Pretendard-Bold' };

const WEIGHT: Record<string, string> = { normal: '400', bold: '700', '100': '400', '200': '400', '300': '400', '900': '800' };
const fileOf = (w: TextStyle['fontWeight']) => PRE[WEIGHT[String(w)] ?? String(w)] ?? PRE['400'];

/** 글꼴을 지정하지 않은 스타일에 Pretendard를 채운다. 지정했으면 undefined (그대로 둔다) */
function pretendard(style: StyleProp<TextStyle>, nested: boolean): TextStyle | undefined {
  const flat = RN.StyleSheet.flatten(style) ?? {};
  if (flat.fontFamily) return undefined;
  if (nested) return flat.fontWeight == null ? undefined : { fontFamily: fileOf(flat.fontWeight) };
  return { fontFamily: fileOf(flat.fontWeight), ...(flat.letterSpacing == null && { letterSpacing: WEB_LETTER_SPACING }) };
}

const Text = React.forwardRef<React.ComponentRef<typeof BaseText>, TextProps>((props, ref) => {
  const add = pretendard(props.style, React.useContext(TextAncestor));
  return React.createElement(BaseText, { ref, allowFontScaling: false, ...props, style: add ? [add, props.style] : props.style });
});
Text.displayName = 'Text';

const TextInput = React.forwardRef<React.ComponentRef<typeof BaseTextInput>, TextInputProps>((props, ref) => {
  const add = pretendard(props.style, false);
  return React.createElement(BaseTextInput, { ref, allowFontScaling: false, ...props, style: add ? [add, props.style] : props.style });
});
TextInput.displayName = 'TextInput';

const shim = Object.defineProperties({}, Object.getOwnPropertyDescriptors(RN));
Object.defineProperty(shim, 'Text', { enumerable: true, value: Text });
// 포커스 관리(TextInput.State)는 그대로 쓰게 한다
Object.defineProperty(shim, 'TextInput', { enumerable: true, value: Object.assign(TextInput, { State: BaseTextInput.State }) });
module.exports = shim;
