// Learn more https://docs.expo.dev/guides/customizing-metro
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

/**
 * 네이티브에서 앱 코드(src/)가 불러오는 'react-native'를 src/nativeText 로 바꿔 준다.
 * 그 모듈은 react-native 를 그대로 다시 내보내되 Text·TextInput 만 Pretendard 기본 글꼴 · 시스템 글자 크기 무시 버전으로 바꾼다.
 * (react-native 의 exports 를 실행 중에 바꿔 끼우는 방식은 화면 코드까지 닿지 않았다)
 * 웹은 +html.tsx 의 전역 CSS가 같은 일을 하므로 건드리지 않는다.
 * nativeText 는 다른 파일이 없는 폴더에 둔다. Metro가 해석 결과를 폴더 단위로 재사용해, 같은 폴더의 파일이 바뀐 'react-native'를 받으면
 * nativeText 자신도 진짜 react-native 대신 자기를 받는다.
 */
const SRC = path.join(__dirname, 'src') + path.sep;
const NATIVE_TEXT_DIR = path.join(__dirname, 'src', 'nativeText') + path.sep;
const NATIVE_TEXT = path.join(NATIVE_TEXT_DIR, 'index.native.tsx');
const upstream = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const from = context.originModulePath;
  if (moduleName === 'react-native' && platform !== 'web' && from.startsWith(SRC) && !from.startsWith(NATIVE_TEXT_DIR)) {
    return { type: 'sourceFile', filePath: NATIVE_TEXT };
  }
  return upstream ? upstream(context, moduleName, platform) : context.resolveRequest(context, moduleName, platform);
};

/**
 * 앱 코드가 쓰지 않는 큰 폴더는 Metro가 훑지 않게 한다.
 * dist(웹 빌드 결과)·output(이미지 생성 작업물)·ios 빌드·docs·타로 원본 PNG는 수백 MB라
 * 파일 목록과 감시에 메모리를 크게 먹어 `npm run web` 이 heap out of memory 로 꺼졌다.
 */
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SEP = '[\\\\/]';
const IGNORED = ['dist', 'output', 'docs', 'example', `ios${SEP}build`, `assets${SEP}tarot${SEP}source`];
config.resolver.blockList = [
  ...[].concat(config.resolver.blockList || []),
  new RegExp(`^${escapeRe(__dirname)}${SEP}(${IGNORED.join('|')})(${SEP}.*)?$`),
];

module.exports = config;
