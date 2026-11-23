#!/usr/bin/env python3
"""Validate the public Daftra Toolkit without third-party packages."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
vars=json.loads((ROOT/'vars.json').read_text(encoding='utf-8'))
modules=json.loads((ROOT/'config/modules.json').read_text(encoding='utf-8'))
assert isinstance(vars.get('sections'),list)
assert len(vars['sections'])==vars['section_count'], 'Section count mismatch'
count=sum(len(s['variables']) for s in vars['sections'])
assert count==vars['variable_count'], 'Variable count mismatch'
assert all(isinstance(x.get('label'),str) and isinstance(x.get('code'),str) for s in vars['sections'] for x in s['variables'])
assert len(set(m['id'] for m in modules['modules']))==len(modules['modules'])
for m in modules['modules']:
    assert m['status'] in ('ready','planned')
    if m['status']=='ready':
        assert (ROOT/m['entry']).is_file(),f"Missing entry: {m['entry']}"
assert (ROOT/'index.html').is_file() and (ROOT/'dashboard.html').is_file()
assert "fetch('./vars.json'" in (ROOT/'index.html').read_text(encoding='utf-8')
print(f'PASS: {len(vars["sections"])} sections; {count} variables; {len(modules["modules"])} registered modules')
