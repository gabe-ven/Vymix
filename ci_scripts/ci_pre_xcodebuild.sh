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


