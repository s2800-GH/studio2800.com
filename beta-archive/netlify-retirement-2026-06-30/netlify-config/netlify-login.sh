#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
export HOME="$ROOT_DIR/.tools/home"
export PATH="$ROOT_DIR/.tools/node/bin:$ROOT_DIR/.tools/netlify-cli/node_modules/.bin:$PATH"

netlify login
