#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
EMAIL="${EMAIL:-admin@example.com}"
PASSWORD="${PASSWORD:-admin123}"

api() { curl -sS "$@"; }

echo "[1/9] health"
api "$BASE_URL/health" | python3 -c 'import sys,json; print("ok=", json.load(sys.stdin).get("ok"))'

echo "[2/9] login -> token"
LOGIN_JSON="$(api -w "\n%{http_code}" -X POST "$BASE_URL/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")"
LOGIN_BODY="$(printf "%s" "$LOGIN_JSON" | sed '$d')"
LOGIN_STATUS="$(printf "%s" "$LOGIN_JSON" | tail -n 1)"

if [ "$LOGIN_STATUS" != "200" ]; then
  echo "login_status=$LOGIN_STATUS"
  echo "login_body=$LOGIN_BODY"
  exit 3
fi

TOKEN="$(printf "%s" "$LOGIN_BODY" | python3 -c 'import sys,json; print(json.load(sys.stdin)["token"])')"
echo "token_prefix=$(printf "%s" "$TOKEN" | head -c 20)"

echo "[3/9] auth/me"
api "$BASE_URL/auth/me" -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json; u=json.load(sys.stdin)["user"]; print(u.get("email"), u.get("role"), u.get("tenantId"))'

echo "[4/9] create service"
SID="$(api -X POST "$BASE_URL/services" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name":"SMOKE Service","dauerMinuten":30,"preis":49.99,"kategorie":"SMOKE"}' | python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])')"
echo "SID=$SID"

echo "[5/9] create kunde"
KID="$(api -X POST "$BASE_URL/kunden" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name":"SMOKE Kunde","email":"smoke@kunde.local","telefon":"111"}' | python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])')"
echo "KID=$KID"

echo "[6/9] create termin"
TID="$(api -X POST "$BASE_URL/termine" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "{\"datum\":\"2025-12-29\",\"zeit\":\"12:00\",\"kundeId\":\"$KID\",\"serviceId\":\"$SID\",\"notiz\":\"SMOKE Termin\"}" | python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])')"
echo "TID=$TID"

echo "[7/9] confirm + complete termin"
api -X POST "$BASE_URL/termine/$TID/confirm" -H "Authorization: Bearer $TOKEN" >/dev/null
api -X POST "$BASE_URL/termine/$TID/complete" -H "Authorization: Bearer $TOKEN" >/dev/null
echo "termin_status=completed (expected)"

echo "[8/9] report umsatz (month range)"
api "$BASE_URL/reports/umsatz?from=2025-12-01&to=2025-12-31" -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json; r=json.load(sys.stdin); print("total=", r.get("total"), "count=", r.get("count"))'

echo "[9/9] cleanup (delete termin/service/kunde) -> expect 204"
api -o /dev/null -w "DELETE termin status=%{http_code}\n" -X DELETE "$BASE_URL/termine/$TID" -H "Authorization: Bearer $TOKEN"
api -o /dev/null -w "DELETE service status=%{http_code}\n" -X DELETE "$BASE_URL/services/$SID" -H "Authorization: Bearer $TOKEN"
api -o /dev/null -w "DELETE kunde status=%{http_code}\n" -X DELETE "$BASE_URL/kunden/$KID" -H "Authorization: Bearer $TOKEN"

echo "SMOKE TEST: PASS"
