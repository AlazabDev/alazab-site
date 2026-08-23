#!/usr/bin/env python3
"""Validate and summarize the authoritative Daftra OpenAPI used by Azab Daftra MCP."""

import argparse
import collections
import hashlib
import json
from pathlib import Path

METHODS = {"get", "post", "put", "patch", "delete"}
HERE = Path(__file__).resolve().parent
DEFAULT_MANIFEST = HERE / "catalog" / "manifest.json"


def primary_group(tags):
    return next((x for x in tags if x.startswith("Endpoints/")), tags[0] if tags else "Untagged")


def domain(tags):
    tag = primary_group(tags)
    if tag.startswith("Endpoints/"):
        return tag[len("Endpoints/"):].strip().split("/")[0].strip() or "Other"
    return tag.split("/")[0].strip() or "Other"


def fail(label, expected, actual):
    if expected != actual:
        raise SystemExit(f"{label} mismatch: expected {expected!r}, got {actual!r}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("--expect", type=int, default=301)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--no-hash", action="store_true")
    args = parser.parse_args()

    raw = args.source.read_bytes()
    spec = json.loads(raw.decode("utf-8"))
    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))

    operations = []
    for api_path, path_item in (spec.get("paths") or {}).items():
        for method, operation in path_item.items():
            if method.lower() not in METHODS or not isinstance(operation, dict):
                continue
            tags = operation.get("tags") or []
            operations.append({
                "method": method.upper(),
                "path": api_path,
                "summary": operation.get("summary") or "",
                "group": primary_group(tags),
                "domain": domain(tags),
            })

    groups = collections.Counter(x["group"] for x in operations)
    domains = collections.Counter(x["domain"] for x in operations)
    methods = collections.Counter(x["method"] for x in operations)
    sha256 = hashlib.sha256(raw).hexdigest()

    fail("operation count", args.expect, len(operations))
    fail("manifest operation count", manifest.get("operation_count"), len(operations))
    fail("path count", manifest.get("path_count"), len(spec.get("paths") or {}))
    fail("group count", manifest.get("group_count"), len(groups))
    fail("domain count", manifest.get("domain_count"), len(domains))

    expected_methods = {k: int(v) for k, v in (manifest.get("methods") or {}).items()}
    actual_methods = {m: methods.get(m, 0) for m in ["GET", "POST", "PUT", "PATCH", "DELETE"]}
    fail("method counts", expected_methods, actual_methods)

    expected_groups = {x["name"]: int(x["count"]) for x in manifest.get("groups", [])}
    expected_domains = {x["name"]: int(x["count"]) for x in manifest.get("domains", [])}
    fail("group membership/counts", expected_groups, dict(sorted(groups.items())))
    fail("domain membership/counts", expected_domains, dict(sorted(domains.items())))

    if not args.no_hash:
        fail("SHA256", manifest.get("source_sha256"), sha256)

    report = {
        "ok": True,
        "source": str(args.source),
        "sha256": sha256,
        "paths": len(spec.get("paths") or {}),
        "operations": len(operations),
        "groups": len(groups),
        "domains": len(domains),
        "methods": actual_methods,
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
