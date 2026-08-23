#!/usr/bin/env bash
set -euo pipefail

EXPECTED_SHA='c264e9df687a75f7aec5f06e1d25c5f931cf01937069ae4003c1802eb0102c63'
EXPECTED_OPS='301'
SOURCE="${1:-}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="$HERE/openapi/Default module.openapi.json"

if [[ -z "$SOURCE" || ! -f "$SOURCE" ]]; then
  echo "Usage: $0 /path/to/'Default module.openapi.json'" >&2
  exit 2
fi

ACTUAL_SHA="$(sha256sum "$SOURCE" | awk '{print $1}')"
if [[ "$ACTUAL_SHA" != "$EXPECTED_SHA" ]]; then
  echo "ERROR: OpenAPI SHA256 mismatch" >&2
  echo "expected=$EXPECTED_SHA" >&2
  echo "actual=$ACTUAL_SHA" >&2
  exit 3
fi

mkdir -p "$(dirname "$DEST")"
install -m 0644 "$SOURCE" "$DEST"

python3 "$HERE/generate-catalog.py" "$DEST" --expect "$EXPECTED_OPS" >/tmp/azab-daftra-openapi-report.json
cat /tmp/azab-daftra-openapi-report.json
rm -f /tmp/azab-daftra-openapi-report.json

echo "INSTALLED: $DEST"
echo "SHA256: $ACTUAL_SHA"
