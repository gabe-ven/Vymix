#!/bin/sh
set -euo pipefail

echo "[ci_pre_xcodebuild] CWD: $(pwd)"
echo "[ci_pre_xcodebuild] Forcing Legacy Architecture (disables New Arch/Fabric)"
export RCT_NEW_ARCH_ENABLED=0

echo "[ci_pre_xcodebuild] Ensuring JavaScript dependencies (node_modules)"
if command -v node >/dev/null 2>&1; then
  echo "[ci_pre_xcodebuild] Node version: $(node -v)"
else
  echo "[ci_pre_xcodebuild] Node is not available; Xcode Cloud runners normally include Node."
fi

if [ -f package-lock.json ]; then
  npm ci || npm install --no-audit --no-fund
else
  npm install --no-audit --no-fund
fi

echo "[ci_pre_xcodebuild] Reinstalling CocoaPods cleanly"
cd ios
if ! command -v pod >/dev/null 2>&1; then
  echo "[ci_pre_xcodebuild] CocoaPods not found; installing"
  sudo gem install cocoapods -N || true
fi

# Clean Pods and lockfile to avoid stale references to Fabric headers
rm -rf Pods Podfile.lock
pod install --repo-update
cd - >/dev/null

echo "[ci_pre_xcodebuild] Pre-xcodebuild setup complete"


