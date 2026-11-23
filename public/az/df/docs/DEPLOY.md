# Deploy to alazab.com

Upload the **contents** of `df/` into the website directory `/df/` while preserving hierarchy.

Expected URLs:
- https://alazab.com/df/index.html
- https://alazab.com/df/vars.json
- https://alazab.com/df/dashboard.html
- https://alazab.com/df/config/modules.json

Require HTTPS and correct MIME (`application/json` for `.json`). Clear CDN cache after updating JSON. HTML must be served via a web server, not `file://`.

### Quick check (PowerShell)

```powershell
@('index.html','vars.json','dashboard.html','config/modules.json') | ForEach-Object { $u="https://alazab.com/df/$_"; try { $r=Invoke-WebRequest -Uri $u -ErrorAction Stop; "${u} : $($r.StatusCode) / $($r.RawContentLength) bytes" } catch { "${u} : ERROR $($_.Exception.Message)" } }
```

### Deployment policy

Do not expose private configuration, credentials or account data from Daftra in the public hosting directory. `modules.json` contains only public module registry metadata.
