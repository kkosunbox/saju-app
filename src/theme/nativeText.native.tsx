import React, { forwardRef, useContext } from 'react';
import * as RN from 'react-native';
import type { TextStyle } from 'react-native';
import { PRE } from './typography';

/**
 * 네이티브 기본 글꼴을 Pretendard로.
 * 웹은 +html.tsx 의 전역 CSS가 글꼴을 지정하지 않은 글자 전부에 Pretendard(자간 -0.2)를 깔아 주지만,
 * 네이티브는 fontFamily 가 없으면 시스템 글꼴(Apple SD Gothic Neo)로 그려 한글이 눈에 띄게 작아 보인다.
 * 스타일마다 sansW 를 붙이지 않은 곳(fontWeight 만 쓴 곳)이 많아, Text·TextInput 을 감싸 같은 규칙을 적용한다.
 * - 바깥 Text: 글꼴이 없으면 fontWeight 에 맞는 Pretendard 파일과 웹과 같은 자간을 넣는다
 * - 안쪽 Text: 부모 글꼴을 물려받고, fontWeight 를 따로 줬을 때만 그 굵기 파일로 바꾼다
 * - 시스템 글자 크기(iOS 텍스트 크기·Android 글꼴 크기)는 따르지 않는다. 웹과 같은 크기로 디자인대로 보이게 (화면에서 allowFontScaling 을 주면 그 값을 쓴다)
 */
const BaseText = RN.Text;
const BaseTextInput = RN.TextInput;
const TextAncestor = RN.unstable_TextAncestorContext;
const WEB_LETTER_SPACING = -0.2;

const WEIGHT: Record<string, keyof typeof PRE> = { normal: '400', bold: '700', '100': '400', '200': '400', '300': '400', '900': '800' };
const fileOf = (w: TextStyle['fontWeight']) => PRE[WEIGHT[String(w)] ?? String(w)] ?? PRE['400'];

/** 글꼴을 지정하지 않은 스타일에 Pretendard를 채운다. 지정했으면 undefined (그대로 둔다) */
function pretendard(style: RN.StyleProp<TextStyle>, nested: boolean): TextStyle | undefined {
  const flat = RN.StyleSheet.flatten(style) ?? {};
  if (flat.fontFamily) return undefined;
  if (nested) return flat.fontWeight == null ? undefined : { fontFamily: fileOf(flat.fontWeight) };
  return { fontFamily: fileOf(flat.fontWeight), ...(flat.letterSpacing == null && { letterSpacing: WEB_LETTER_SPACING }) };
}

const Text = forwardRef<React.ComponentRef<typeof BaseText>, RN.TextProps>((props, ref) => {
  const add = pretendard(props.style, useContext(TextAncestor));
  return <BaseText ref={ref} allowFontScaling={false} {...props} style={add ? [add, props.style] : props.style} />;
});
Text.displayName = 'Text';

const TextInput = forwardRef<React.ComponentRef<typeof BaseTextInput>, RN.TextInputProps>((props, ref) => {
  const add = pretendard(props.style, false);
  return <BaseTextInput ref={ref} allowFontScaling={false} {...props} style={add ? [add, props.style] : props.style} />;
});
TextInput.displayName = 'TextInput';
// 포커스 관리(TextInput.State)는 그대로 쓰게 한다
(TextInput as unknown as { State: typeof BaseTextInput.State }).State = BaseTextInput.State;

// react-native 의 Text·TextInput 내보내기를 바꿔 끼운다. 화면 모듈은 그릴 때 이 값을 읽으므로 앱이 그려지기 전에만 불러오면 된다.
// `import * as` 는 복사본일 수 있어 require 로 실제 exports 객체를 고친다
// eslint-disable-next-line @typescript-eslint/no-require-imports
const exportsOfRN = require('react-native');
Object.defineProperty(exportsOfRN, 'Text', { configurable: true, enumerable: true, get: () => Text });
Object.defineProperty(exportsOfRN, 'TextInput', { configurable: true, enumerable: true, get: () => TextInput });
