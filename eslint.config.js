// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // SDK 58 의 eslint-config-expo 가 새로 켠 React Compiler 규칙 — 기존 코드(useRef(new Animated.Value()).current 등)를
    // 한꺼번에 막지 않도록 경고로 두고, 고칠 때마다 줄여 간다
    rules: {
      "react-hooks/refs": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);
