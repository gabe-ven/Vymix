#!/bin/sh
set -euo pipefail

echo "[ci_pre_xcodebuild] Installing JavaScript dependencies"

if command -v node >/dev/null 2>&1; then
  echo "[ci_pre_xcodebuild] Node version: $(node -v)"
else
  echo "[ci_pre_xcodebuild] Node is not available; Xcode Cloud runners normally include Node."
fi

if [ -f package-lock.json ]; then
  npm ci
else
  npm install --no-audit --no-fund
fi

echo "[ci_pre_xcodebuild] Dependencies installed"

echo "[ci_pre_xcodebuild] Installing iOS CocoaPods dependencies"
cd ios
if ! command -v pod >/dev/null 2>&1; then
  echo "[ci_pre_xcodebuild] CocoaPods not found; installing"
  sudo gem install cocoapods -N || true
fi
pod install --repo-update
cd - >/dev/null

echo "[ci_pre_xcodebuild] Pre-xcodebuild setup complete"


