#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source_model="$project_root/assets/cinematic/danny-gallery-360.glb"
output_model="$project_root/assets/cinematic/danny-gallery-360-ktx2.glb"
temporary_directory="$(mktemp -d)"
trap 'rm -rf "$temporary_directory"' EXIT

if ! command -v ktx >/dev/null 2>&1 || ! command -v toktx >/dev/null 2>&1; then
  echo "KTX-Software 4.x is required (both ktx and toktx must be on PATH)." >&2
  exit 1
fi

npx --yes @gltf-transform/cli@4.3.0 png \
  "$source_model" "$temporary_directory/gallery-png.glb" \
  --formats webp --effort 5

npx --yes @gltf-transform/cli@4.3.0 etc1s \
  "$temporary_directory/gallery-png.glb" "$temporary_directory/gallery-ktx2.glb" \
  --quality 220

npx --yes @gltf-transform/cli@4.3.0 meshopt \
  "$temporary_directory/gallery-ktx2.glb" "$output_model" \
  --level medium

ls -lh "$source_model" "$output_model"
