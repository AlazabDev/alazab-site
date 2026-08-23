#!/usr/bin/env python3
"""Validate and summarize the Daftra OpenAPI document used by Azab Daftra MCP."""

import argparse
import collections
import hashlib
import json
from pathlib import Path

METHODS = {"get", "post", "put", "patch", "delete"}


def primary_group(tags):
    return next((x for x in tags if x.startswith("Endpoints/")), tags[0] if tags else "Untagged")


def domain(tags):
    tag = primary_group(tags)
    if tag.startswith("Endpoints/"):
        return tag[len("Endpoints/"):].strip().split("/")[0].strip() or "Other"
    return tag.split("/")[0].strip() or "Other"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("--expect", type=int, default=301)
    args = parser.parse_args()

    raw = args.source.read_bytes()
    spec = json.loads(raw.decode("utf-8"))
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

    if len(operations) != args.expect:
        raise SystemExit(f"operation count mismatch: expected {args.expect}, got {len(operations)}")

    groups = collections.Counter(x["group"] for x in operations)
    domains = collections.Counter(x["domain"] for x in operations)
    methods = collections.Counter(x["method"] for x in operations)
    report = {
        "source": str(args.source),
        "sha256": hashlib.sha256(raw).hexdigest(),
        "paths": len(spec.get("paths") or {}),
        "operations": len(operations),
        "groups": len(groups),
        "domains": len(domains),
        "methods": dict(methods),
        "group_counts": dict(sorted(groups.items())),
        "domain_counts": dict(sorted(domains.items())),
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
