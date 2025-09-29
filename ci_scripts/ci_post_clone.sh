#!/bin/sh

# This script sets up the Node.js environment for subsequent steps.
set -euo pipefail

# Load Node Version Manager and install/use the correct node version
. ~/.nvm/nvm.sh
nvm install
nvm use