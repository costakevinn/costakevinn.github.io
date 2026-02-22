#!/usr/bin/env bash
set -euo pipefail

BASE="https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons"

echo "[INFO] Downloading social icons (brand-colored SVGs)..."

download() {
  local url="$1"
  local out="$2"
  curl -fLsS "$url" -o "$out"
}

colorize_currentColor() {
  local file="$1"
  local hex="$2"
  sed -i "s/fill=\"currentColor\"/fill=\"#${hex}\"/g" "$file"
}

# name|primary_url|fallback_url|hex|mode
# mode: simpleicons => replace fill="currentColor"
#       generic     => try replacing currentColor if present (otherwise keep as-is)
ICONS=(
  "github|${BASE}/github.svg||181717|simpleicons"
  "whatsapp|${BASE}/whatsapp.svg||25D366|simpleicons"
  "telegram|${BASE}/telegram.svg||26A5E4|simpleicons"
  "gmail|${BASE}/gmail.svg||EA4335|simpleicons"
  "linkedin|${BASE}/linkedin.svg|https://upload.wikimedia.org/wikipedia/commons/8/81/LinkedIn_icon.svg|0A66C2|generic"
)

for item in "${ICONS[@]}"; do
  IFS="|" read -r name primary fallback hex mode <<< "$item"
  out="${name}.svg"

  echo "[DL] ${out}"

  if download "$primary" "$out"; then
    :
  else
    if [[ -n "${fallback:-}" ]]; then
      echo "     ↳ primary failed, using fallback"
      download "$fallback" "$out"
    else
      echo "[ERR] Failed to download ${name} (no fallback)"
      exit 1
    fi
  fi

  if [[ "$mode" == "simpleicons" ]]; then
    colorize_currentColor "$out" "$hex"
  else
    # Fallback icons may already be colored; only replace currentColor if present
    sed -i "s/fill=\"currentColor\"/fill=\"#${hex}\"/g" "$out" || true
  fi
done

echo "[DONE] Files:"
ls -1 *.svg