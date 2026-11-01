#!/usr/bin/env bash
# Prints docs/manual/garge-manual.html to public/garge-manual.pdf and checks that it has two pages.
# Needs Google Chrome or Chromium, and uv for the page check. Set CHROME to the browser's path if it is not found.
# Pass a folder as the first argument to also save a PNG preview of each page there.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source_html="$here/garge-manual.html"
output_pdf="$here/../../public/garge-manual.pdf"
preview_dir="${1:-}"

find_chrome() {
  if [ -n "${CHROME:-}" ]; then
    printf '%s\n' "$CHROME"
    return
  fi
  local candidate
  for candidate in \
    "${PROGRAMFILES:-C:/Program Files}/Google/Chrome/Application/chrome.exe" \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "$(command -v google-chrome || true)" \
    "$(command -v google-chrome-stable || true)" \
    "$(command -v chromium || true)" \
    "$(command -v chromium-browser || true)"; do
    if [ -n "$candidate" ] && [ -x "$candidate" ]; then
      printf '%s\n' "$candidate"
      return
    fi
  done
  echo "Chrome not found. Set CHROME to its path." >&2
  exit 1
}

# Chrome on Windows needs Windows paths, also when it runs from Git Bash.
native_path() {
  if command -v cygpath >/dev/null 2>&1; then
    cygpath -m "$1"
  else
    printf '%s\n' "$1"
  fi
}

chrome="$(find_chrome)"
source_path="$(native_path "$source_html")"
case "$source_path" in
  /*) source_url="file://$source_path" ;;
  *) source_url="file:///$source_path" ;;
esac

"$chrome" --headless=new --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$(native_path "$output_pdf")" "${source_url// /%20}" 2>/dev/null

uv run --quiet --with pymupdf python -I -W ignore -c '
import sys
import pymupdf

document = pymupdf.open(sys.argv[1])
if len(document) != 2:
    sys.exit(f"Expected 2 pages, got {len(document)}")
if sys.argv[2]:
    for number, page in enumerate(document, start=1):
        page.get_pixmap(dpi=150).save(f"{sys.argv[2]}/page-{number}.png")
print("Wrote 2 pages")
' "$(native_path "$output_pdf")" "$(if [ -n "$preview_dir" ]; then native_path "$preview_dir"; fi)"
