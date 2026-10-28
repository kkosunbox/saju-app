/**
 * iOS: 카카오톡 · 네이버 앱에서 로그인하고 돌아오는 URL을 각 SDK에 넘긴다.
 * Expo 58은 URL을 AppDelegate가 아니라 SceneDelegate(scene(_:openURLContexts:))로 받는데,
 * 두 라이브러리의 config plugin은 AppDelegate에만 코드를 넣어서 여기서 SceneDelegate에 넣는다.
 * (구글은 라이브러리가 Expo AppDelegate subscriber로 받아서 따로 할 일이 없다.)
 */
const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('expo/config-plugins');

const MARK = '// woonpick: social login urls';

const sceneCode = naverUrlScheme => `  ${MARK}
  override func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    let rest = URLContexts.filter { context in
      let url = context.url
      if RNCKakaoUserUtil.isKakaoTalkLoginUrl(url) {
        _ = RNCKakaoUserUtil.handleOpen(url)
        return false
      }
      if url.scheme == "${naverUrlScheme}" {
        _ = NaverThirdPartyLoginConnection.getSharedInstance().application(UIApplication.shared, open: url, options: [:])
        return false
      }
      return true
    }
    if !rest.isEmpty {
      super.scene(scene, openURLContexts: rest)
    }
  }
`;

module.exports = function withSocialLoginScene(config, { naverUrlScheme }) {
  return withDangerousMod(config, [
    'ios',
    async config => {
      const { platformProjectRoot, projectName } = config.modRequest;
      const file = path.join(platformProjectRoot, projectName, 'SceneDelegate.swift');
      let contents = fs.readFileSync(file, 'utf8');
      if (contents.includes(MARK)) return config;
      const anchor = 'class SceneDelegate: ExpoAppSceneDelegate {';
      if (!contents.includes(anchor)) throw new Error(`[withSocialLoginScene] '${anchor}' not found in ${file}`);
      contents = contents
        .replace('internal import Expo', 'internal import Expo\nimport RNCKakaoUser\nimport NaverThirdPartyLogin')
        .replace(anchor, `${anchor}\n${sceneCode(naverUrlScheme)}`);
      fs.writeFileSync(file, contents);
      return config;
    },
  ]);
};
