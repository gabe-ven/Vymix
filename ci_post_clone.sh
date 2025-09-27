#!/bin/sh
set -euo pipefail

# Forward to the repo script (keeps logic in one place)
bash "$(dirname "$0")/ci_scripts/ci_post_clone.sh"


