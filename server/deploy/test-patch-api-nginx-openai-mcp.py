#!/usr/bin/env python3

from __future__ import annotations

import pathlib
import subprocess
import sys
import tempfile


SCRIPT = pathlib.Path(__file__).with_name('patch-api-nginx-openai-mcp.py')
INCLUDE = '/etc/nginx/snippets/alazab-openai-mcp.conf'

FIXTURE = r'''
server {
    listen 80;
    server_name api.alazab.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.alazab.com;

    ssl_certificate /etc/letsencrypt/live/api.alazab.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.alazab.com/privkey.pem;

    location /health {
        proxy_pass http://127.0.0.1:3004/health;
    }

    location /mcp {
        proxy_pass http://127.0.0.1:4005/mcp;
    }

    location = /.well-known/oauth-protected-resource {
        return 404;
    }

    location / {
        proxy_pass http://127.0.0.1:3004;
    }
}
'''.lstrip()


def run(config: pathlib.Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(SCRIPT), '--config', str(config), '--include', INCLUDE],
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def main() -> int:
    with tempfile.TemporaryDirectory() as tmp:
        config = pathlib.Path(tmp) / 'api.alazab.com.conf'
        config.write_text(FIXTURE, encoding='utf-8')

        first = run(config)
        assert_true(first.returncode == 0, first.stderr or first.stdout)
        once = config.read_text(encoding='utf-8')

        assert_true(once.count(f'include {INCLUDE};') == 1, 'include must appear exactly once')
        assert_true('127.0.0.1:4005/mcp' not in once, 'legacy public /mcp route must be removed')
        assert_true('location = /.well-known/oauth-protected-resource' not in once, 'old metadata route must be removed')
        assert_true('proxy_pass http://127.0.0.1:3004/health;' in once, 'unrelated health route changed')
        assert_true('proxy_pass http://127.0.0.1:3004;' in once, 'unrelated default route changed')
        assert_true('listen 80;' in once, 'HTTP redirect server changed')
        assert_true('listen 443 ssl http2;' in once, 'TLS server changed unexpectedly')

        second = run(config)
        assert_true(second.returncode == 0, second.stderr or second.stdout)
        twice = config.read_text(encoding='utf-8')
        assert_true(twice == once, 'patcher must be idempotent')

        ambiguous = pathlib.Path(tmp) / 'ambiguous.conf'
        ambiguous.write_text(FIXTURE + '\n' + FIXTURE.replace('listen 80;', 'listen 8080;', 1), encoding='utf-8')
        ambiguous_result = run(ambiguous)
        assert_true(ambiguous_result.returncode == 3, 'ambiguous TLS server must be refused')

    print('Nginx MCP patcher tests passed')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
