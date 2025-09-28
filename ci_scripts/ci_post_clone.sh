#!/bin/sh
set -euo pipefail

# Resolve repo root from this script's directory
ROOT_DIR="$(cd "$(dirname "$0")"/.. && pwd)"
exec "$ROOT_DIR/ci_post_clone.sh"


