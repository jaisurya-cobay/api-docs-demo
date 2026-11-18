#!/usr/bin/env bash
# Builds the docs site with one spec per release:
#   site/index.html                 Scalar page (reads versions.json → version dropdown)
#   site/versions/latest.json       spec from the current commit (main)
#   site/versions/<tag>.json        spec regenerated from each git tag v*
#   site/versions.json              list of the above, newest first
# Old versions are rebuilt from their tags, so nothing has to be stored between deploys.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SITE="$ROOT/site"
rm -rf "$SITE" "$ROOT/.versions"
mkdir -p "$SITE/versions"
cp "$ROOT/docs/index.html" "$SITE/"

SHA="$(git -C "$ROOT" rev-parse --short HEAD)"
API_VERSION="main+$SHA" node "$ROOT/scripts/export-openapi.js" "$SITE/versions/latest.json"
entries="{\"title\":\"latest (main @ $SHA)\",\"slug\":\"latest\",\"url\":\"./versions/latest.json\"}"

for tag in $(git -C "$ROOT" tag -l 'v*' --sort=-v:refname); do
  # Check out the tag's code in a sub-folder (it reuses the root node_modules)
  git -C "$ROOT" worktree add --quiet --detach "$ROOT/.versions/$tag" "$tag"
  API_VERSION="${tag#v}" node "$ROOT/.versions/$tag/scripts/export-openapi.js" "$SITE/versions/$tag.json"
  entries="$entries,{\"title\":\"$tag\",\"slug\":\"$tag\",\"url\":\"./versions/$tag.json\"}"
done

echo "[$entries]" > "$SITE/versions.json"
git -C "$ROOT" worktree prune
rm -rf "$ROOT/.versions"
echo "Built site with: $(cat "$SITE/versions.json" | grep -o '"title":"[^"]*"' | cut -d'"' -f4 | paste -sd ', ')"
