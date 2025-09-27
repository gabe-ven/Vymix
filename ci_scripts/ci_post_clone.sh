#!/bin/sh
set -euo pipefail

echo "[ci_post_clone] Starting post-clone setup"

if ! command -v pod >/dev/null 2>&1; then
  echo "[ci_post_clone] CocoaPods not found; installing locally"
  sudo gem install cocoapods -N || true
fi

echo "[ci_post_clone] Installing iOS CocoaPods dependencies"
cd ios
pod install --repo-update
cd - >/dev/null

echo "[ci_post_clone] Post-clone setup complete"


