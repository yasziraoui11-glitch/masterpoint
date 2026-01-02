#!/usr/bin/env bash
set -euo pipefail

# Zweck:
# - prüft API-Liveness
# - loggt sich ein
# - legt Service + Kunde an
# - erstellt einen Termin (mit dynamischem Datum: morgen)
# - bestätigt + completed
# - holt Umsatzreport (Monatsbereich)
# - räumt wieder auf

BASE_URL="${BASE_URL:-http://localhost:8080}"
EMAIL="${EMAIL:-admin@example.com}"
PASSWORD="${PASSWORD:-admin123}"

# morgen (robust auf macOS + Linux via Python)
TERMIN_DATUM="${TERMIN_DATUM:-$(python3 -c 'import datetime as d; print((d.date.today()+d.timedelta(days=1)).isoformat())')}"
TERMIN_ZEIT="${TERMIN_ZEIT:-12:00}"

# Monatsrange für Umsatzreport: erster Tag dieses Monats bis letzter Tag dieses Monats
REPORT_FROM="${REPORT_FROM:-$(python3 -c 'import datetime as d; t=d.date.today(); f=t.replace(day=1); print(f.isoformat())')}"
REPORT_TO="${REPORT_TO:-$(python3 -c 'import datetime as d; t=d.date.today(); import calendar; last=calendar.monthrange(t.year,t.month)[1]; print(t.replace(day=last).isoformat())')}"

curl_raw() { curl -sS "$@"; }

# Erwartet JSON bei 2xx, sonst druckt es Status+Body und bricht ab
curl_json_required() {
  local resp body status
  resp="$(curl_raw -w "\n%{http_code}" "$@")"
  body="$(printf "%s" "$resp" | sed '$d')"
  status="$(printf "%s" "$resp" | tail -n 1)"
  if [[ "$status" != 2* ]]; then
    echo "http_status=$status"
    echo "http_body=$body"
    exit 2
  fi
  # zusätzlich: sicherstellen, dass body JSON ist
  python3 -c 'import sys,json; json.loads(sys.argv[1]); print(sys.argv[1])' "$body"
}

echo "[0/9] wait for api/health via web proxy"
for i in $(seq 1 60); do
  if curl -fsS "$BASE_URL/api/health" >/dev/null 2>&1; then
    echo "ready=yes"
    break
  fi
  sleep 1
done

echo "[1/9] health"
curl -fsS "$BASE_URL/api/health" | python3 -c 'import sys,json; print("ok=", json.load(sys.stdin).get("ok"))'

echo "[2/9] login -> token"
LOGIN_BODY="$(curl_json_required -X POST "$BASE_URL/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")"
TOKEN="$(python3 -c 'import json,sys; print(json.loads(sys.argv[1])["token"])' "$LOGIN_BODY")"
echo "token_prefix=$(printf "%s" "$TOKEN" | head -c 20)"

echo "[3/9] auth/me"
ME_BODY="$(curl_json_required "$BASE_URL/api/auth/me" -H "Authorization: Bearer $TOKEN")"
python3 -c 'import json,sys; u=json.loads(sys.argv[1])["user"]; print(u.get("email"), u.get("role"), u.get("tenantId"))' "$ME_BODY"

echo "[4/9] create service"
SERVICE_BODY="$(curl_json_required -X POST "$BASE_URL/api/services" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name":"SMOKE Service","dauerMinuten":30,"preis":49.99,"kategorie":"SMOKE"}')"
SID="$(python3 -c 'import json,sys; print(json.loads(sys.argv[1])["id"])' "$SERVICE_BODY")"
echo "SID=$SID"

echo "[5/9] create kunde"
KUNDE_BODY="$(curl_json_required -X POST "$BASE_URL/api/kunden" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name":"SMOKE Kunde","email":"smoke@kunde.local","telefon":"111"}')"
KID="$(python3 -c 'import json,sys; print(json.loads(sys.argv[1])["id"])' "$KUNDE_BODY")"
echo "KID=$KID"

echo "[6/9] create termin (datum=$TERMIN_DATUM zeit=$TERMIN_ZEIT)"
TERMIN_BODY="$(curl_json_required -X POST "$BASE_URL/api/termine" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "{\"datum\":\"$TERMIN_DATUM\",\"zeit\":\"$TERMIN_ZEIT\",\"kundeId\":\"$KID\",\"serviceId\":\"$SID\",\"notiz\":\"SMOKE Termin\"}")"
TID="$(python3 -c 'import json,sys; print(json.loads(sys.argv[1])["id"])' "$TERMIN_BODY")"
echo "TID=$TID"

echo "[7/9] confirm + complete termin"
curl_json_required -X POST "$BASE_URL/api/termine/$TID/confirm" -H "Authorization: Bearer $TOKEN" >/dev/null
curl_json_required -X POST "$BASE_URL/api/termine/$TID/complete" -H "Authorization: Bearer $TOKEN" >/dev/null
echo "termin_status=completed (expected)"

echo "[8/9] report umsatz (from=$REPORT_FROM to=$REPORT_TO)"
UMSATZ_BODY="$(curl_json_required "$BASE_URL/api/reports/umsatz?from=$REPORT_FROM&to=$REPORT_TO" -H "Authorization: Bearer $TOKEN")"
python3 -c 'import json,sys; r=json.loads(sys.argv[1]); print("total=", r.get("total"), "count=", r.get("count"))' "$UMSATZ_BODY"

echo "[9/9] cleanup (delete termin/service/kunde) -> expect 204"
curl_raw -o /dev/null -w "DELETE termin status=%{http_code}\n" -X DELETE "$BASE_URL/api/termine/$TID" -H "Authorization: Bearer $TOKEN"
curl_raw -o /dev/null -w "DELETE service status=%{http_code}\n" -X DELETE "$BASE_URL/api/services/$SID" -H "Authorization: Bearer $TOKEN"
curl_raw -o /dev/null -w "DELETE kunde status=%{http_code}\n" -X DELETE "$BASE_URL/api/kunden/$KID" -H "Authorization: Bearer $TOKEN"

echo "SMOKE TEST: PASS"
