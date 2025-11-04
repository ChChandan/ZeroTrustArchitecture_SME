import os
import csv
import time
import json
import hashlib
from datetime import datetime
from functools import wraps

from flask import Flask, request, jsonify, render_template
import jwt
import redis

# ========== Environment Variables ==========
KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://localhost:8080")
REALM = os.getenv("REALM", "my-company")
CLIENT_ID = os.getenv("CLIENT_ID", "my-app")
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
CSV_PATH = os.getenv("CSV_PATH", "out/decisions.csv")

# ========== Prometheus Metrics ==========
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
DECISIONS = Counter("zt_decisions_total", "Zero Trust decisions", ["action", "reason"])
LATENCY = Histogram("zt_decision_latency_seconds", "Decision latency seconds")

# ========== Flask & Redis ==========
app = Flask(__name__)
redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

# ========== Optional: Strict JWT Verification for Production ==========
# from jwt import PyJWKClient
# OIDC_ISSUER = f"{KEYCLOAK_URL}/realms/{REALM}"
# JWKS_URL = f"{OIDC_ISSUER}/protocol/openid-connect/certs"
# _jwk_client = PyJWKClient(JWKS_URL)
# def decode_and_verify(token: str):
#     key = _jwk_client.get_signing_key_from_jwt(token).key
#     return jwt.decode(
#         token, key, algorithms=["RS256"],
#         audience=CLIENT_ID, issuer=OIDC_ISSUER,
#         options={"require": ["exp", "iat", "nbf"], "verify_signature": True}
#     )

# ========== Utility Functions ==========
def read_bearer_token(req, body_token=None):
    h = req.headers.get("Authorization", "")
    if h.startswith("Bearer "):
        return h.replace("Bearer ", "", 1).strip()
    return (body_token or "").strip()

def get_client_ip(req):
    xff = req.headers.get("X-Forwarded-For", "")
    if xff:
        return xff.split(",")[0].strip()
    return req.remote_addr or "0.0.0.0"

def ensure_csv_header(path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if not os.path.exists(path):
        with open(path, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["ts", "user_id", "trust_score", "resource", "action", "reason"])

# ========== Core Class ==========
class ZeroTrustGateway:
    def __init__(self):
        self.suspicious_ips = set()
        self.user_behavior = {}

    def calculate_trust_score(self, user_id, request_context):
        score = 100

        # IP change
        last_ip = redis_client.get(f"user:{user_id}:last_ip")
        current_ip = request_context.get("ip")
        if last_ip and last_ip != current_ip:
            score -= 20

        # Time range
        current_hour = datetime.now().hour
        if current_hour < 6 or current_hour > 23:
            score -= 15

        # Access frequency
        key_ac = f"user:{user_id}:access_count"
        access_count = redis_client.incr(key_ac)
        redis_client.expire(key_ac, 60)
        if access_count > 30:
            score -= 30

        # Sensitive operation
        if request_context.get("sensitive_operation"):
            score -= 10

        # Device fingerprint
        device_fingerprint = self._get_device_fingerprint(request_context)
        known_device = redis_client.sismember(f"user:{user_id}:devices", device_fingerprint)
        if not known_device:
            score -= 25
            redis_client.sadd(f"user:{user_id}:devices", device_fingerprint)

        redis_client.set(f"user:{user_id}:last_ip", current_ip)
        redis_client.set(f"user:{user_id}:trust_score", score)

        return max(0, min(100, score))

    def _get_device_fingerprint(self, context):
        raw = "|".join([
            context.get("user_agent", ""),
            context.get("accept_language", ""),
            context.get("platform", ""),
            context.get("timezone", ""),
        ])
        return hashlib.sha256(raw.encode()).hexdigest()

    def enforce_zero_trust_policy(self, user_id, trust_score, resource):
        if trust_score >= 80:
            policy = {
                "action": "allow",
                "restrictions": None,
                "monitoring_level": "normal",
                "reason": "low_risk",
            }
        elif trust_score >= 60:
            policy = {
                "action": "allow_restricted",
                "restrictions": ["read_only"],
                "monitoring_level": "enhanced",
                "reason": "mid_risk_readonly",
            }
        elif trust_score >= 40:
            policy = {
                "action": "require_mfa",
                "restrictions": ["minimal_access"],
                "monitoring_level": "strict",
                "reason": "high_risk_stepup",
            }
        else:
            policy = {
                "action": "deny",
                "restrictions": ["blocked"],
                "monitoring_level": "alert",
                "reason": "very_high_risk",
            }

        self._log_access_decision(user_id, trust_score, resource, policy)
        return policy

    def _log_access_decision(self, user_id, trust_score, resource, decision):
        entry = {
            "timestamp": datetime.now().isoformat(),
            "user_id": user_id,
            "trust_score": trust_score,
            "resource": resource,
            "decision": decision.get("action", ""),
            "reason": decision.get("reason", ""),
        }
        redis_client.lpush("access_logs", json.dumps(entry))
        redis_client.ltrim("access_logs", 0, 999)

gateway = ZeroTrustGateway()

# ========== Decorators ==========
def verify_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = read_bearer_token(request)
        if not token:
            return jsonify({"error": "Missing authentication token"}), 401
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
            request.user = payload
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({"error": f"Invalid token: {str(e)}"}), 401
    return decorated

# ========== Routes ==========
@app.route("/")
def index():
    return "<h3>Zero-Trust Gateway (MVP / Report Mode)</h3>"

@app.route("/metrics")
def metrics():
    return generate_latest(), 200, {"Content-Type": CONTENT_TYPE_LATEST}

@app.route("/healthz")
def healthz():
    try:
        redis_client.ping()
        return jsonify({"status": "ok"}), 200
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500

@app.route("/api/access-request", methods=["POST"])
def access_request():
    started = time.time()
    ensure_csv_header(CSV_PATH)

    data = request.get_json(force=True, silent=True) or {}
    token = read_bearer_token(request, data.get("token"))

    if not token:
        return jsonify({"error": "Authentication token required"}), 401

    try:
        user_info = jwt.decode(token, options={"verify_signature": False})
        user_id = user_info.get("preferred_username", "unknown")
        roles = user_info.get("realm_access", {}).get("roles", [])
    except Exception as e:
        return jsonify({"error": f"Invalid token: {str(e)}"}), 401

    request_context = {
        "ip": get_client_ip(request),
        "user_agent": request.headers.get("User-Agent", ""),
        "accept_language": request.headers.get("Accept-Language", ""),
        "sensitive_operation": (data.get("resource", "") or "/").startswith("/admin"),
        "platform": data.get("platform", ""),
        "timezone": data.get("timezone", ""),
    }

    trust_score = gateway.calculate_trust_score(user_id, request_context)
    resource = data.get("resource", "/")
    policy = gateway.enforce_zero_trust_policy(user_id, trust_score, resource)

    LATENCY.observe(time.time() - started)
    DECISIONS.labels(policy["action"], policy.get("reason", "unknown")).inc()

    try:
        with open(CSV_PATH, "a", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow([datetime.now().isoformat(), user_id, trust_score, resource, policy["action"], policy.get("reason", "")])
    except Exception:
        pass

    response = {
        "user_id": user_id,
        "roles": roles,
        "trust_score": trust_score,
        "access_decision": policy["action"],
        "restrictions": policy.get("restrictions", []),
        "monitoring_level": policy["monitoring_level"],
        "reason": policy.get("reason", ""),
        "timestamp": datetime.now().isoformat(),
    }

    action = policy["action"]
    if action == "deny":
        code = 403
    elif action == "require_mfa":
        code = 428
    else:
        code = 200

    return jsonify(response), code

@app.route("/api/user-behavior/<user_id>", methods=["GET"])
@verify_token
def get_user_behavior(user_id):
    trust_score = redis_client.get(f"user:{user_id}:trust_score") or 100
    last_ip = redis_client.get(f"user:{user_id}:last_ip") or "unknown"
    access_count = redis_client.get(f"user:{user_id}:access_count") or 0

    return jsonify({
        "user_id": user_id,
        "current_trust_score": int(trust_score),
        "last_known_ip": last_ip,
        "recent_access_count": int(access_count),
        "risk_level": "high" if int(trust_score) < 60 else "medium" if int(trust_score) < 80 else "low"
    })

@app.route("/api/simulate-attack", methods=["POST"])
def simulate_attack():
    attack_type = (request.json or {}).get("type", "brute_force")
    if attack_type == "location_change":
        gateway.calculate_trust_score("john", {
            "ip": "203.0.113.0",
            "user_agent": request.headers.get("User-Agent", ""),
            "accept_language": "en-US"
        })
    return jsonify({"message": f"Simulated {attack_type} attack"})

# ========== Main ==========
if __name__ == "__main__":
    os.makedirs(os.path.dirname(CSV_PATH), exist_ok=True)
    print("🚀 Zero-Trust Gateway started: http://localhost:5000")
    print("   Health check:      /healthz")
    print("   Prometheus metrics: /metrics")
    app.run(host="0.0.0.0", port=5000, debug=True)
