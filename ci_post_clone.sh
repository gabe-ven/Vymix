#!/bin/sh
set -euo pipefail

echo "[ci_post_clone] Starting post-clone setup (CWD: $(pwd))"

if ! command -v pod >/dev/null 2>&1; then
  echo "[ci_post_clone] CocoaPods not found; installing locally"
  sudo gem install cocoapods -N || true
fi

echo "[ci_post_clone] Installing JavaScript dependencies"
if command -v node >/dev/null 2>&1; then
  echo "[ci_post_clone] Node version: $(node -v)"
else
  echo "[ci_post_clone] Node is not available; Xcode Cloud runners normally include Node."
fi

if [ -f package-lock.json ]; then
  npm ci
else
  npm install --no-audit --no-fund
fi

# Verify critical headers exist to prevent later lstat failures
if [ ! -f node_modules/@react-native-community/slider/ios/RNCSlider.h ]; then
  echo "[ci_post_clone][ERROR] Missing slider headers after npm install."
  ls -la node_modules/@react-native-community/slider || true
  exit 1
fi
if [ ! -f node_modules/@react-native-community/slider/common/cpp/react/renderer/components/RNCSlider/RNCSliderMeasurementsManager.h ]; then
  echo "[ci_post_clone][ERROR] Missing Fabric slider headers after npm install."
  ls -la node_modules/@react-native-community/slider/common/cpp/react/renderer/components/RNCSlider || true
  exit 1
fi

echo "[ci_post_clone] Installing iOS CocoaPods dependencies"
cd ios
pod install --repo-update
cd - >/dev/null

echo "[ci_post_clone] Post-clone setup complete"


