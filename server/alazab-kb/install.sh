#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(dirname "$0")"
: "${AZ_KB_DATABASE_URL:?Set AZ_KB_DATABASE_URL to an existing PostgreSQL connection string first}"
export AZ_KB_PUBLIC_HOST="${AZ_KB_PUBLIC_HOST:-kb.alazab.com}"
command -v psql >/dev/null || { echo 'PostgreSQL client psql is required'; exit 1; }
command -v python3 >/dev/null || { echo 'python3 is required'; exit 1; }
psql "$AZ_KB_DATABASE_URL" -v ON_ERROR_STOP=1 -f schema.sql
sudo mkdir -p /opt/alazab-kb
sudo cp server.py requirements.txt /opt/alazab-kb/
sudo python3 -m venv /opt/alazab-kb/.venv
sudo /opt/alazab-kb/.venv/bin/python -m pip install --disable-pip-version-check -r /opt/alazab-kb/requirements.txt
sudo mkdir -p /etc/alazab-kb
# Keep sensitive DB connection string out of systemd unit output.
sudo install -m 600 /dev/null /etc/alazab-kb/service.env
printf 'AZ_KB_DATABASE_URL=%s\nAZ_KB_PUBLIC_HOST=%s\n' "$AZ_KB_DATABASE_URL" "$AZ_KB_PUBLIC_HOST" | sudo tee /etc/alazab-kb/service.env >/dev/null
sudo chmod 600 /etc/alazab-kb/service.env
sudo cp alazab-kb.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now alazab-kb
sleep 2
curl --fail --silent --show-error http://127.0.0.1:8189/health -H 'Host: 127.0.0.1:8189'
echo -e '\nService installed. Add the supplied nginx location to the existing canonical vhost, then configure TLS.'
