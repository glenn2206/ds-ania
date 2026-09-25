#!/usr/bin/env bash

set -Eeuo pipefail

APP_DIR="${APP_DIR:-/home/myaniaco/ania-app}"
REPO_DIR="${REPO_DIR:-/home/myaniaco/ania-repo}"
NODE_ENV_DIR="${NODE_ENV_DIR:-/home/myaniaco/nodevenv/ania-app/20}"
DEFAULT_SITE_URL="https://conscientious-rose-beaver.180-235-151-42.cpanel.site"
DEPLOY_SHA="${1:-$(git -C "$REPO_DIR" rev-parse HEAD)}"

set +u
source "$NODE_ENV_DIR/bin/activate"
set -u
export PUBLIC_SITE_URL="$DEFAULT_SITE_URL"

cd "$REPO_DIR"
npm ci
npm run build

rm -rf "$APP_DIR/dist.next"
cp -a "$REPO_DIR/dist" "$APP_DIR/dist.next"
cp "$REPO_DIR/app.mjs" "$REPO_DIR/package.json" "$REPO_DIR/package-lock.json" "$APP_DIR/"

rm -rf "$APP_DIR/db" "$APP_DIR/scripts"
cp -a "$REPO_DIR/db" "$REPO_DIR/scripts" "$APP_DIR/"

mkdir -p "$APP_DIR/src/data" "$APP_DIR/tmp"
cp "$REPO_DIR/src/data/products.generated.json" "$APP_DIR/src/data/"

cd "$APP_DIR"
npm ci --omit=dev

rm -rf "$APP_DIR/dist.prev"
if [[ -d "$APP_DIR/dist" ]]; then
  mv "$APP_DIR/dist" "$APP_DIR/dist.prev"
fi
mv "$APP_DIR/dist.next" "$APP_DIR/dist"

printf '%s\n' "$DEPLOY_SHA" > "$APP_DIR/.deployed-sha"
touch "$APP_DIR/tmp/restart.txt"

rm -rf "$APP_DIR/dist.prev" "$REPO_DIR/node_modules"
printf 'Deploy OK: %s (%s)\n' "$DEPLOY_SHA" "$(date -Is)"
