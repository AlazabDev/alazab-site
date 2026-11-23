Daftra variables directory — Alazab Construction

Upload the entire contents of df/ to the website root's df/ directory.

Public URLs:
  https://alazab.com/df/index.html
  https://alazab.com/df/vars.json

vars.json is the ONLY source of variable definitions.
index.html loads ./vars.json using fetch() and never embeds a second copy.
Serve over HTTPS. Do not open index.html from file:// because browsers may block fetch().
Static web hosting is enough; no backend or database required.
Ensure the web server serves .json as application/json and UTF-8.
If CDN caching is used, invalidate /df/vars.json after updates.

PowerShell health check:
  (Invoke-WebRequest 'https://alazab.com/df/vars.json').StatusCode
  (Invoke-WebRequest 'https://alazab.com/df/index.html').StatusCode
