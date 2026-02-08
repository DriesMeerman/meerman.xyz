#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="static/assets"
TARGET_DIR="static/g/assets"
SIZES=(400 306)

if ! command -v magick >/dev/null 2>&1 && ! command -v convert >/dev/null 2>&1; then
  echo "ImageMagick not found. Install it to generate optimized images." >&2
  exit 1
fi

if ! command -v cwebp >/dev/null 2>&1; then
  echo "cwebp not found. Install webp tools to generate .webp variants." >&2
  exit 1
fi

MAGICK_BIN="magick"
if ! command -v magick >/dev/null 2>&1; then
  MAGICK_BIN="convert"
fi

rm -rf "$TARGET_DIR"
mkdir -p "$TARGET_DIR"

while IFS= read -r -d '' src; do
  rel="${src#${SOURCE_DIR}/}"
  ext="${src##*.}"
  ext_lc="$(echo "$ext" | tr '[:upper:]' '[:lower:]')"
  rel_dir="$(dirname "$rel")"
  out_dir="$TARGET_DIR/$rel_dir"
  mkdir -p "$out_dir"

  cp "$src" "$TARGET_DIR/$rel"

  if [[ "$ext_lc" != "png" && "$ext_lc" != "jpg" && "$ext_lc" != "jpeg" ]]; then
    continue
  fi

  base="$TARGET_DIR/${rel%.*}"

  for size in "${SIZES[@]}"; do
    native_out="${base}-${size}.${ext_lc}"
    webp_out="${base}-${size}.webp"

    "$MAGICK_BIN" "$src" -resize "${size}x>" -strip "$native_out"

    width="$("$MAGICK_BIN" identify -format "%w" "$src" 2>/dev/null || identify -format "%w" "$src")"
    if [[ "$width" -le "$size" ]]; then
      cwebp -quiet -q 82 "$src" -o "$webp_out"
    else
      cwebp -quiet -q 82 -resize "$size" 0 "$src" -o "$webp_out"
    fi
  done
done < <(find "$SOURCE_DIR" -type f ! -name '.DS_Store' -print0)

echo "Generated optimized images in $TARGET_DIR"
