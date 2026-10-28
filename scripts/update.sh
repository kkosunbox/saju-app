#!/bin/sh
# EAS Update로 JS만 내보낸다: scripts/update.sh <store-test|production> "메시지"
# eas update 는 eas.json 빌드 프로필의 env 를 읽지 않고 저장소에는 .env 가 없어, 채널마다 API 주소를 여기서 정한다
# (그냥 eas update 를 돌리면 API 주소가 localhost 로 들어간다).
# package.json scripts 에 두지 않는 이유: scripts 는 런타임 버전(fingerprint)에 들어가 이미 나간 빌드가 업데이트를 못 받게 된다.
set -e
case "$1" in
  store-test) API=https://api-dev.woonpick.com WEB=https://dev.woonpick.com ENV=preview ;;
  production) API=https://api.woonpick.com WEB=https://woonpick.com ENV=production ;;
  *) echo "usage: scripts/update.sh <store-test|production> \"message\"" >&2; exit 1 ;;
esac
[ -n "$2" ] || { echo "message required" >&2; exit 1; }
EXPO_PUBLIC_API_URL=$API EXPO_PUBLIC_WEB_URL=$WEB npx eas-cli@latest update --channel "$1" --environment "$ENV" --message "$2"
