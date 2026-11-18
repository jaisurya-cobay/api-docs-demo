#!/usr/bin/env bash
# Builds the docs site with one spec per environment and per release:
#   site/versions/prod.json, staging.json, qa.json   specs from the env branches (main/staging/qa)
#   site/versions/<tag>.json                          specs from each release tag v*
#   site/versions.json                                the dropdown list
# Each spec is generated from that branch's/tag's own code, then its "servers"
# is set to that environment's URL so "Test Request" calls the right server.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SITE="$ROOT/site"
rm -rf "$SITE" "$ROOT/.versions"
mkdir -p "$SITE/versions"
cp "$ROOT/docs/index.html" "$SITE/"
entries=""

# generate <git ref> <slug> <title> <version label> <server url> <server name>
generate() {
  local ref="$1" slug="$2" title="$3" version="$4" url="$5" name="$6"
  git -C "$ROOT" worktree add --quiet --detach "$ROOT/.versions/$slug" "$ref"
  API_VERSION="$version" node "$ROOT/.versions/$slug/scripts/export-openapi.js" "$SITE/versions/$slug.json"
  node -e '
    const fs = require("fs"); const [file, url, name] = process.argv.slice(1);
    const s = JSON.parse(fs.readFileSync(file, "utf8"));
    s.servers = [{ url, description: name }, { url: "http://localhost:3000", description: "Local (npm start)" }];
    fs.writeFileSync(file, JSON.stringify(s, null, 2));
  ' "$SITE/versions/$slug.json" "$url" "$name"
  entries="$entries${entries:+,}{\"title\":\"$title\",\"slug\":\"$slug\",\"url\":\"./versions/$slug.json\"}"
}

# Environments: the branch each env deploys from (example server URLs)
declare -A BRANCH=([prod]=main [staging]=staging [qa]=qa)
declare -A SERVER=([prod]=https://api.example.com [staging]=https://staging-api.example.com [qa]=https://qa-api.example.com)
for env in prod staging qa; do
  ref="origin/${BRANCH[$env]}"
  git -C "$ROOT" rev-parse --verify --quiet "$ref" >/dev/null || { echo "skip $env ($ref not found)"; continue; }
  sha="$(git -C "$ROOT" rev-parse --short "$ref")"
  generate "$ref" "$env" "$env @ $sha" "$env+$sha" "${SERVER[$env]}" "$env server"
done

# Releases: every tag v*, newest first
for tag in $(git -C "$ROOT" tag -l 'v*' --sort=-v:refname); do
  generate "$tag" "$tag" "release $tag" "${tag#v}" "${SERVER[prod]}" "prod server"
done

echo "[$entries]" > "$SITE/versions.json"
git -C "$ROOT" worktree prune
rm -rf "$ROOT/.versions"
echo "Built: $(grep -o '"title":"[^"]*"' "$SITE/versions.json" | cut -d'"' -f4 | paste -sd '|')"
