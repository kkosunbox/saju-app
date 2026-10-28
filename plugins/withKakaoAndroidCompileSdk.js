/**
 * Android: @react-native-kakao 모듈은 compileSdk 를 자기 package.json 의 33으로 고정하는데,
 * react-native 0.88 · androidx 는 34 이상으로 컴파일해야 해서 checkAarMetadata 에서 빌드가 멈춘다.
 * 카카오 모듈만 앱과 같은 compileSdk 로 맞춘다. (subprojects 블록은 루트가 먼저 평가되므로
 * 각 모듈의 AGP보다 먼저 afterEvaluate 에 걸려, AGP가 설정을 잠그기 전에 바뀐다.)
 */
const { withProjectBuildGradle } = require('expo/config-plugins');

const MARK = '// woonpick: kakao compileSdk';

const block = `
${MARK}
subprojects { p ->
  if (p.name.startsWith('react-native-kakao')) {
    def fix = { p.android.compileSdkVersion(rootProject.ext.has('compileSdkVersion') ? rootProject.ext.compileSdkVersion : 36) }
    if (p.state.executed) fix() else p.afterEvaluate(fix)
  }
}
`;

module.exports = function withKakaoAndroidCompileSdk(config) {
  return withProjectBuildGradle(config, config => {
    if (config.modResults.language !== 'groovy') throw new Error('[withKakaoAndroidCompileSdk] expected a Groovy build.gradle');
    if (!config.modResults.contents.includes(MARK)) config.modResults.contents += block;
    return config;
  });
};
