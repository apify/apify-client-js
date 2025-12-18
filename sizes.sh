#!/usr/bin/env bash

set -euo pipefail

PKG="${1:?Usage: $0 <npm-package-name>}"

# Fetch all versions, select the last 20
VERSIONS=$(npm view "$PKG" versions --json | jq -r '.[-20:][]')

printf "%-15s %12s\n" "VERSION" "SIZE (KB)"
printf "%-15s %12s\n" "-------" "---------"

for v in $VERSIONS; do
  SIZE_BYTES=$(npm view "$PKG@$v" dist.unpackedSize --json 2>/dev/null || echo "null")

  if [[ "$SIZE_BYTES" == "null" || -z "$SIZE_BYTES" ]]; then
    printf "%-15s %12s\n" "$v" "N/A"
  else
    SIZE_KB=$(awk "BEGIN { printf \"%.1f\", $SIZE_BYTES / 1024 }")
    printf "%-15s %12s\n" "$v" "$SIZE_KB"
  fi
done
