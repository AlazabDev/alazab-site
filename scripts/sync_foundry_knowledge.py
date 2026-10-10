#!/usr/bin/env python3
"""Sync the authoritative Alazab /knowledge Markdown into existing Foundry IQ file source.

Read-only by default. Requires Azure CLI signed in and Python requests.
Run from any directory:
    python scripts/sync_foundry_knowledge.py
    python scripts/sync_foundry_knowledge.py --apply
"""
import argparse
import json
import re
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import requests

SEARCH = "aisearchazabrgai136311"
GROUP = "azab-rg-ai"
SOURCE = "ks-file-177"
INDEX = "ks-file-177-index"
KB = "az-knowledge"
API = "2026-05-01-preview"
CANONICAL = "https://alazab.com/knowledge"
REPO_URL = "https://github.com/AlazabDev/alazab-site.git"


def cli(*args):
    return subprocess.check_output(["az", *args], text=True, stderr=subprocess.PIPE).strip()


def published_markdown(folder):
    output = []
    for path in sorted(folder.glob("*.md")):
        text = path.read_text(encoding="utf-8-sig")
        match = re.match(r"\A---\r?\n([\s\S]*?)\r?\n---\r?\n?", text)
        if not match:
            continue
        header = match.group(1)
        def meta(key):
            m = re.search(rf"(?m)^{re.escape(key)}:\s*[\"']?(.+?)[\"']?\s*$", header)
            return m.group(1).strip().strip('"').strip("'") if m else ""
        if meta("published").lower() != "true":
            continue
        slug = meta("slug") or path.stem
        if not re.fullmatch(r"[a-z0-9-]+", slug):
            raise ValueError(f"Unexpected slug: {slug!r} in {path}")
        canonical_url = f"{CANONICAL}/{slug}"
        title = meta("title") or slug
        # Keep the original article plus its permanent canonical URL.
        payload = f"Source URL: {canonical_url}\nDocument title: {title}\n\n{text}"
        output.append((f"{slug}.md", payload.encode("utf-8"), canonical_url))
    return output


def request(session, method, route, **kwargs):
    r = session.request(
        method, f"https://{SEARCH}.search.windows.net{route}",
        params={"api-version": API}, timeout=90, **kwargs
    )
    return r


def must_ok(response, what):
    if not response.ok:
        raise RuntimeError(f"{what}: HTTP {response.status_code}: {response.text[:900]}")
    return response


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="Upload missing published articles")
    ap.add_argument("--site-dir", type=Path, help="Local alazab-site checkout (otherwise shallow clone)")
    args = ap.parse_args()

    key = cli("search", "admin-key", "show", "-g", GROUP,
              "--service-name", SEARCH, "--query", "primaryKey", "-o", "tsv")
    if not key:
        raise RuntimeError("Azure AI Search key unavailable")
    session = requests.Session()
    session.headers["api-key"] = key

    with tempfile.TemporaryDirectory(prefix="alazab-knowledge-") as temp:
        repo = args.site_dir
        if repo is None:
            repo = Path(temp) / "alazab-site"
            subprocess.run(["git", "clone", "--depth", "1", "--quiet", REPO_URL,
                            str(repo)], check=True)
        folder = repo / "src/content/knowledge"
        if not folder.is_dir():
            raise RuntimeError(f"Knowledge directory missing: {folder}")
        articles = published_markdown(folder)
        if not articles:
            raise RuntimeError("No published knowledge Markdown found; nothing changed")

        source = must_ok(request(session, "GET", f"/knowledgesources/{SOURCE}"),
                         "Read source").json()
        if source.get("kind") != "file":
            raise RuntimeError("Existing knowledge source is not of type 'file'")
        kb = must_ok(request(session, "GET", f"/knowledgebases/{KB}"), "Read KB").json()
        if SOURCE not in [s.get("name") for s in kb.get("knowledgeSources", [])]:
            raise RuntimeError("Knowledge base does not reference expected file source")

        files_url = f"/knowledgesources('{SOURCE}')/files"
        existing_data = must_ok(request(session, "GET", files_url),
                                "List knowledge files").json()
        existing = {f.get("fileName") for f in existing_data.get("value", [])}
        index_r = request(session, "GET", f"/indexes/{INDEX}/docs/$count")
        must_ok(index_r, "Read document count")
        initial_count = int(index_r.text)
        pending = [(name, payload, url) for name, payload, url in articles if name not in existing]

        print(f"SOURCE: {CANONICAL}")
        print(f"PUBLISHED ARTICLES: {len(articles)}")
        print(f"FILES ALREADY PRESENT: {len(articles) - len(pending)}")
        print(f"FILES TO UPLOAD: {len(pending)}")
        print(f"INDEX DOCUMENTS BEFORE: {initial_count}")
        if not args.apply:
            print("MODE: AUDIT ONLY (no Azure changes); use --apply to upload")
            return 0
        if len(pending) + len(existing) > 100:
            raise RuntimeError("File knowledge source 100-file limit; no upload started")

        for name, payload, canonical in pending:
            r = request(session, "POST", files_url,
                        headers={"Content-Type": "application/octet-stream",
                                 "Content-Disposition": f'attachment; filename="{name}"'},
                        data=payload)
            must_ok(r, f"Upload {name}")
            print(f"UPLOADED: {name} -> {canonical}")

        # Indexing after upload is asynchronous; avoid misreporting an immediate zero.
        count = initial_count
        for attempt in range(12):
            r = request(session, "GET", f"/indexes/{INDEX}/docs/$count")
            must_ok(r, "Check index count")
            count = int(r.text)
            if count > 0:
                break
            if attempt < 11:
                time.sleep(10)
        print(f"INDEX DOCUMENTS AFTER: {count}")

        retrieval = request(session, "POST", f"/knowledgebases/{KB}/retrieve",
                            json={"intents":[{"type":"semantic",
                                               "search":"ما هي سياسة توجيه طلبات الصيانة في مجموعة العزب؟"}],
                                  "includeActivity": True, "maxRuntimeInSeconds": 60})
        must_ok(retrieval, "Knowledge retrieval")
        data = retrieval.json()
        refs = data.get("references") or []
        print(f"RETRIEVAL HTTP: {retrieval.status_code}")
        print(f"REFERENCES: {len(refs)}")
        if not refs:
            print("NOT VERIFIED: File processing may still be underway, or retrieval requires investigation")
            return 2
        print("KNOWLEDGE RETRIEVAL: PASS")
        return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (RuntimeError, subprocess.CalledProcessError, requests.RequestException, ValueError) as exc:
        print(f"BLOCKED: {exc}", file=sys.stderr)
        sys.exit(1)
