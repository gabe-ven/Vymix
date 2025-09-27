#!/bin/sh
set -euo pipefail

# Forward to the repo script (keeps logic in one place)
bash "$(dirname "$0")/ci_scripts/ci_pre_xcodebuild.sh"


