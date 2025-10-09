#!/usr/bin/env bash
set -euo pipefail

echo "[ci_post_clone] Starting dependency setup"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

REPO_ROOT="$(cd "$(dirname "$0")"/.. && pwd)"
cd "$REPO_ROOT"

echo "[ci_post_clone] Installing JS dependencies"
if [ -f package-lock.json ]; then
  npm ci --no-audit --no-fund || npm install --no-audit --no-fund
else
  npm install --no-audit --no-fund
fi

echo "[ci_post_clone] Installing CocoaPods"
cd ios
pod install --repo-update || pod install

echo "[ci_post_clone] Done"
#!/bin/sh

# This script sets up the Node.js environment for subsequent steps.
set -euo pipefail

# Load Node Version Manager and install/use the correct node version
. ~/.nvm/nvm.sh
nvm install
nvm use