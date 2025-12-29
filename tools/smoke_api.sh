#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"

echo "[1/9] health"
HEALTH_JSON="$(curl -fsS "${BASE_URL}/api/health")"
OK="$(printf '%s' "$HEALTH_JSON" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("ok"))')"
echo "ok= ${OK}"
if [ "${OK}" != "True" ]; then
  echo "Health not ok. Body:"
  echo "$HEALTH_JSON"
  exit 1
fi

echo "[2/9] login -> token"
LOGIN_PAYLOAD='{"email":"admin@example.com","password":"admin123"}'

# capture body + status
LOGIN_RAW="$(curl -sS -w $'\n%{http_code}' -H "Content-Type: application/json" -d "$LOGIN_PAYLOAD" "${BASE_URL}/api/auth/login")"
LOGIN_BODY="$(printf '%s' "$LOGIN_RAW" | sed '$d')"
LOGIN_CODE="$(printf '%s' "$LOGIN_RAW" | tail -n 1)"

echo "login_status=${LOGIN_CODE}"
echo "login_body=${LOGIN_BODY}"

TOKEN="$(
  printf '%s' "$LOGIN_BODY" | python3 -c 'import sys,json
try:
  d=json.load(sys.stdin)
except Exception as e:
  print("", end="")
  sys.exit(2)

# try common token keys
for k in ("token","accessToken","access_token","jwt"):
  v=d.get(k)
  if isinstance(v,str) and v:
    print(v, end="")
    sys.exit(0)

# sometimes nested
u=d.get("data") if isinstance(d.get("data"),dict) else None
if u:
  for k in ("token","accessToken","access_token","jwt"):
    v=u.get(k)
    if isinstance(v,str) and v:
      print(v, end="")
      sys.exit(0)

print("", end="")
sys.exit(3)
'
)"

if [ -z "${TOKEN}" ]; then
  echo "ERROR: Login did not return a usable token (expected token/accessToken/access_token/jwt)."
  echo "HTTP ${LOGIN_CODE}"
  echo "Body: ${LOGIN_BODY}"
  exit 1
fi

echo "token_prefix=$(echo "$TOKEN" | head -c 24)"

echo "[3/9] /auth/me"
curl -fsS "${BASE_URL}/api/auth/me" -H "Authorization: Bearer ${TOKEN}" | python3 -m json.tool >/dev/null
echo "me=ok"

echo "[4/9] list services"
curl -fsS "${BASE_URL}/api/services" -H "Authorization: Bearer ${TOKEN}" | python3 -m json.tool >/dev/null
echo "services=ok"

echo "[5/9] list kunden"
curl -fsS "${BASE_URL}/api/kunden" -H "Authorization: Bearer ${TOKEN}" | python3 -m json.tool >/dev/null
echo "kunden=ok"

echo "[6/9] list termine"
curl -fsS "${BASE_URL}/api/termine?page=1&limit=5" -H "Authorization: Bearer ${TOKEN}" | python3 -m json.tool >/dev/null
echo "termine=ok"

echo "[7/9] openapi.json"
curl -fsS "${BASE_URL}/api/openapi.json" | python3 -m json.tool >/dev/null
echo "openapi_json=ok"

echo "[8/9] openapi.yaml"
curl -fsS "${BASE_URL}/api/openapi.yaml" >/dev/null
echo "openapi_yaml=ok"

echo "[9/9] done"
