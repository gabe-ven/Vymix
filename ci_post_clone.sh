#!/bin/sh
set -euo pipefail

echo "[ci_post_clone] Starting post-clone setup"

if ! command -v pod >/dev/null 2>&1; then
  echo "[ci_post_clone] CocoaPods not found; installing locally"
  sudo gem install cocoapods -N || true
fi

echo "[ci_post_clone] Installing JavaScript dependencies"
if command -v node >/dev/null 2>&1; then
  echo "[ci_post_clone] Node version: $(node -v)"
else
  echo "[ci_post_clone] Node is not available; attempting to continue"
fi

if [ -f package-lock.json ]; then
  npm ci || npm install --no-audit --no-fund || true
else
  npm install --no-audit --no-fund || true
fi

echo "[ci_post_clone] Installing iOS CocoaPods dependencies"
cd ios
pod install --repo-update
cd - >/dev/null

echo "[ci_post_clone] Post-clone setup complete"


