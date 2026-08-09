#!/usr/bin/env python3
"""Safely attach the Alazab OpenAI MCP nginx snippet to api.alazab.com.

The patch is intentionally narrow:
- exactly one TLS server block must contain api.alazab.com;
- direct /mcp and /.well-known/oauth-protected-resource location blocks in that
  server are removed so they cannot conflict with the new include;
- exactly one include directive is inserted;
- unrelated server blocks and locations are preserved.

The caller is responsible for taking a backup and running `nginx -t` before
reload. This script is idempotent.
"""

from __future__ import annotations

import argparse
import pathlib
import re
import sys
from dataclasses import dataclass


TARGET_HOST = "api.alazab.com"
TARGET_PATHS = {"/mcp", "/.well-known/oauth-protected-resource"}


@dataclass(frozen=True)
class Block:
    keyword_start: int
    brace_start: int
    brace_end: int


def mask_non_code(text: str) -> str:
    """Mask comments and quoted strings while preserving offsets/newlines."""
    chars = list(text)
    i = 0
    quote: str | None = None
    escaped = False
    in_comment = False

    while i < len(chars):
        ch = chars[i]

        if in_comment:
            if ch == "\n":
                in_comment = False
            else:
                chars[i] = " "
            i += 1
            continue

        if quote:
            if escaped:
                escaped = False
                if ch != "\n":
                    chars[i] = " "
                i += 1
                continue
            if ch == "\\":
                escaped = True
                chars[i] = " "
                i += 1
                continue
            if ch == quote:
                quote = None
                chars[i] = " "
                i += 1
                continue
            if ch != "\n":
                chars[i] = " "
            i += 1
            continue

        if ch == "#":
            in_comment = True
            chars[i] = " "
            i += 1
            continue
        if ch in {"'", '"'}:
            quote = ch
            chars[i] = " "
            i += 1
            continue
        i += 1

    return "".join(chars)


def matching_brace(masked: str, opening: int) -> int:
    depth = 0
    for idx in range(opening, len(masked)):
        ch = masked[idx]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return idx
    raise ValueError(f"Unmatched opening brace at offset {opening}")


def find_blocks(text: str, keyword: str) -> list[Block]:
    masked = mask_non_code(text)
    result: list[Block] = []
    pattern = re.compile(rf"\b{re.escape(keyword)}\s*\{{")
    for match in pattern.finditer(masked):
        brace_start = masked.find("{", match.start(), match.end())
        if brace_start < 0:
            continue
        result.append(Block(match.start(), brace_start, matching_brace(masked, brace_start)))
    return result


def is_tls_api_server(text: str, block: Block) -> bool:
    segment = mask_non_code(text[block.keyword_start : block.brace_end + 1])
    host = re.search(r"\bserver_name\s+[^;]*\bapi\.alazab\.com\b[^;]*;", segment)
    tls = re.search(r"\blisten\s+[^;]*\b443\b[^;]*;", segment) or re.search(
        r"\bssl\s+on\s*;", segment
    )
    return bool(host and tls)


def line_start(text: str, index: int) -> int:
    pos = text.rfind("\n", 0, index)
    return 0 if pos < 0 else pos + 1


def line_end(text: str, index: int) -> int:
    pos = text.find("\n", index)
    return len(text) if pos < 0 else pos + 1


def normalize_location_header(header: str) -> str:
    return re.sub(r"\s+", " ", header.strip())


def location_target(header: str) -> str | None:
    normalized = normalize_location_header(header)
    # We deliberately patch only non-regex locations for the two exact paths.
    match = re.fullmatch(r"(?:(?:=|\^~)\s+)?(/[^\s]+)", normalized)
    return match.group(1) if match else None


def direct_location_ranges(server_text: str) -> list[tuple[int, int]]:
    masked = mask_non_code(server_text)
    ranges: list[tuple[int, int]] = []
    pattern = re.compile(r"\blocation\s+([^\{]+)\{")

    for match in pattern.finditer(masked):
        target = location_target(match.group(1))
        if target not in TARGET_PATHS:
            continue
        brace_start = masked.find("{", match.start(), match.end())
        brace_end = matching_brace(masked, brace_start)
        start = line_start(server_text, match.start())
        end = line_end(server_text, brace_end + 1)
        ranges.append((start, end))

    return ranges


def server_inner_indent(full_text: str, block: Block) -> str:
    start = line_start(full_text, block.keyword_start)
    server_indent = re.match(r"[ \t]*", full_text[start:block.keyword_start]).group(0)
    return server_indent + "    "


def patch_config(text: str, include_path: str) -> str:
    candidates = [block for block in find_blocks(text, "server") if is_tls_api_server(text, block)]
    if len(candidates) != 1:
        raise ValueError(
            f"Expected exactly one TLS server block for {TARGET_HOST}; found {len(candidates)}"
        )

    block = candidates[0]
    server_text = text[block.keyword_start : block.brace_end + 1]

    # Remove direct conflicting location blocks from the target server only.
    for start, end in sorted(direct_location_ranges(server_text), reverse=True):
        server_text = server_text[:start] + server_text[end:]

    include_re = re.compile(
        rf"(?m)^[ \t]*include\s+{re.escape(include_path)}\s*;[ \t]*(?:\n|$)"
    )
    server_text = include_re.sub("", server_text)

    closing = server_text.rfind("}")
    if closing < 0:
        raise ValueError("Target server block has no closing brace")

    indent = server_inner_indent(text, block)
    directive = f"{indent}include {include_path};\n"
    before = server_text[:closing].rstrip() + "\n"
    after = server_text[closing:]
    patched_server = before + directive + after

    return text[: block.keyword_start] + patched_server + text[block.brace_end + 1 :]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True, help="nginx config file containing api.alazab.com")
    parser.add_argument(
        "--include",
        default="/etc/nginx/snippets/alazab-openai-mcp.conf",
        help="absolute nginx snippet path to include",
    )
    parser.add_argument("--check", action="store_true", help="validate only; do not write")
    args = parser.parse_args()

    config = pathlib.Path(args.config)
    if not config.is_file():
        print(f"Config not found: {config}", file=sys.stderr)
        return 2

    original = config.read_text(encoding="utf-8")
    try:
        patched = patch_config(original, args.include)
    except ValueError as error:
        print(f"Refusing nginx modification: {error}", file=sys.stderr)
        return 3

    if args.check:
        print(f"OK: exactly one TLS {TARGET_HOST} block can be patched in {config}")
        return 0

    if patched != original:
        config.write_text(patched, encoding="utf-8")
        print(f"Patched: {config}")
    else:
        print(f"Already configured: {config}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
