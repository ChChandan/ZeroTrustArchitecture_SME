# run_all.py — Get token → Run 3 request groups → Generate out/decisions.csv & out/summary.csv
import os, time, csv, json
import requests
from collections import Counter, defaultdict
from datetime import datetime

# ====== Configuration ======
KC_BASE    = os.getenv("KC_BASE", "http://localhost:8080")
REALM      = os.getenv("KC_REALM", "my-company")
CLIENT_ID  = os.getenv("KC_CLIENT_ID", "my-app")
USERNAME   = os.getenv("KC_USERNAME", "alice")
PASSWORD   = os.getenv("KC_PASSWORD", "alicepwd")

# Optional client secret (for confidential clients)
CLIENT_SECRET = os.getenv("KC_CLIENT_SECRET", None)

API_URL    = os.getenv("GATEWAY_URL", "http://localhost:5000/api/access-request")
OUT_DIR    = "out"
DETAIL_CSV = os.path.join(OUT_DIR, "decisions.csv")
SUMMARY_CSV= os.path.join(OUT_DIR, "summary.csv")

GROUPS = [
    ("OK",     "/finance/report", 50, 0.00, {}),                 
    ("STEPUP", "/admin/panel",    50, 0.10, {}),                 
    ("DENY",   "/admin/panel",    50, 0.00, {                    
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NewUA",
        "Accept-Language": "fr-FR"
    }),
]

# ====== Helper functions ======
def get_token():
    url = f"{KC_BASE}/realms/{REALM}/protocol/openid-connect/token"
    data = {
        "client_id": CLIENT_ID,
        "grant_type": "password",
        "username": USERNAME,
        "password": PASSWORD,
    }
    if CLIENT_SECRET:
        data["client_secret"] = CLIENT_SECRET
    r = requests.post(url, data=data, timeout=15)
    r.raise_for_status()
    return r.json()["access_token"]

def ensure_csv_header(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if not os.path.exists(path):
        with open(path, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["ts","group","user_id","trust_score","resource","action","reason","latency_ms","http_status"])

def post_once(token, resource, extra_headers=None):
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    if extra_headers:
        headers.update(extra_headers)
    body = {"resource": resource}
    t0 = time.perf_counter()
    try:
        resp = requests.post(API_URL, headers=headers, json=body, timeout=10)
        latency_ms = int((time.perf_counter() - t0) * 1000)
        try:
            data = resp.json()
        except Exception:
            data = {}
        return resp.status_code, latency_ms, data
    except requests.RequestException as e:
        latency_ms = int((time.perf_counter() - t0) * 1000)
        return "ERR", latency_ms, {"error": str(e)}

# ====== Main process ======
def main():
    token = get_token()
    ensure_csv_header(DETAIL_CSV)

    summary = defaultdict(Counter)

    with open(DETAIL_CSV, "a", newline="", encoding="utf-8") as f:
        w = csv.writer(f)

        for name, resource, times, sleep_s, extra_h in GROUPS:
            print(f"==> Running {name}: {resource} x{times}")
            for i in range(times):
                code, latency_ms, data = post_once(token, resource, extra_h)
                action  = data.get("access_decision") or ""
                reason  = data.get("reason") or ""
                user_id = data.get("user_id") or ""
                trust   = data.get("trust_score") if isinstance(data.get("trust_score"), int) else ""
                w.writerow([datetime.now().isoformat(), name, user_id, trust, resource, action, reason, latency_ms, code])
                summary[name][code] += 1
                if sleep_s > 0:
                    time.sleep(sleep_s)

    with open(SUMMARY_CSV, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["group","http_status","count"])
        for g, cnt in summary.items():
            for code, n in sorted(cnt.items(), key=lambda x: str(x[0])):
                w.writerow([g, code, n])

    print("\n✅ Completed.")
    print(f" - {DETAIL_CSV} (Detailed results: action/reason/latency_ms)")
    print(f" - {SUMMARY_CSV} (Per-group HTTP status summary)")

if __name__ == "__main__":
    main()
