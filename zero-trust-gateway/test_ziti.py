import os
import time
import json
import requests
from datetime import datetime
import pandas as pd
import matplotlib.pyplot as plt

# Configuration
KC_BASE = os.getenv("KC_BASE", "http://localhost:8080")
REALM = os.getenv("KC_REALM", "my-company")
CLIENT_ID = os.getenv("KC_CLIENT_ID", "my-app")
USERNAME = os.getenv("KC_USERNAME", "alice")
PASSWORD = os.getenv("KC_PASSWORD", "alicepwd")

STANDARD_GATEWAY = "http://localhost:5000/api/access-request"
ZITI_GATEWAY = "http://localhost:5001/api/access-request"


class ZitiTester:
    def __init__(self):
        self.token = None
        self.results = {"standard": [], "ziti": []}

    def get_token(self):
        """Obtain token from Keycloak"""
        url = f"{KC_BASE}/realms/{REALM}/protocol/openid-connect/token"
        data = {
            "client_id": CLIENT_ID,
            "grant_type": "password",
            "username": USERNAME,
            "password": PASSWORD,
        }
        r = requests.post(url, data=data, timeout=15)
        r.raise_for_status()
        self.token = r.json()["access_token"]
        print("✅ Token retrieved successfully")
        return self.token

    def test_standard_mode(self, resource="/finance/report", count=10):
        """Test standard gateway mode"""
        print(f"\n📊 Testing Standard Mode - {resource}")
        headers = {"Authorization": f"Bearer {self.token}"}

        for i in range(count):
            body = {"resource": resource}
            t0 = time.perf_counter()
            try:
                resp = requests.post(STANDARD_GATEWAY, headers=headers, json=body, timeout=10)
                latency_ms = int((time.perf_counter() - t0) * 1000)
                data = resp.json()
                self.results["standard"].append({
                    "timestamp": datetime.now().isoformat(),
                    "resource": resource,
                    "trust_score": data.get("trust_score", 0),
                    "app_score": data.get("app_trust_score", 0),
                    "network_score": data.get("network_trust_score", 0),
                    "decision": data.get("access_decision", ""),
                    "reason": data.get("reason", ""),
                    "latency_ms": latency_ms,
                    "status_code": resp.status_code
                })
                print(f"  [{i+1}/{count}] Trust: {data.get('trust_score')} | Decision: {data.get('access_decision')} | Latency: {latency_ms}ms")
            except Exception as e:
                print(f"  ❌ Error: {e}")
            if i < count - 1:
                time.sleep(0.1)

    def test_ziti_mode(self, resource="/finance/report", count=10):
        """Test OpenZiti-integrated gateway mode"""
        print(f"\n🔐 Testing OpenZiti Mode - {resource}")
        headers = {
            "Authorization": f"Bearer {self.token}",
            "X-Via-Ziti": "true",
            "X-Openziti-Identity": f"{USERNAME}@openziti"
        }

        for i in range(count):
            body = {"resource": resource}
            t0 = time.perf_counter()
            try:
                resp = requests.post(ZITI_GATEWAY, headers=headers, json=body, timeout=10)
                latency_ms = int((time.perf_counter() - t0) * 1000)
                data = resp.json()
                self.results["ziti"].append({
                    "timestamp": datetime.now().isoformat(),
                    "resource": resource,
                    "trust_score": data.get("trust_score", 0),
                    "app_score": data.get("app_trust_score", 0),
                    "network_score": data.get("network_trust_score", 0),
                    "decision": data.get("access_decision", ""),
                    "reason": data.get("reason", ""),
                    "latency_ms": latency_ms,
                    "status_code": resp.status_code
                })
                print(f"  [{i+1}/{count}] Trust: {data.get('trust_score')} (Net: {data.get('network_trust_score')}, App: {data.get('app_trust_score')}) | Decision: {data.get('access_decision')} | Latency: {latency_ms}ms")
            except Exception as e:
                print(f"  ❌ Error: {e}")
            if i < count - 1:
                time.sleep(0.1)

    def test_attack_scenarios(self):
        """Simulate various attack or risk scenarios"""
        print("\n⚔️ Testing attack scenarios")

        scenarios = [
            {
                "name": "Normal Access",
                "headers": {"Authorization": f"Bearer {self.token}"},
                "resource": "/finance/report"
            },
            {
                "name": "High-Frequency Access (DDoS Simulation)",
                "headers": {"Authorization": f"Bearer {self.token}"},
                "resource": "/admin/panel",
                "rapid": True
            },
            {
                "name": "Device Change (New User-Agent)",
                "headers": {
                    "Authorization": f"Bearer {self.token}",
                    "User-Agent": "Suspicious-Bot/1.0"
                },
                "resource": "/admin/panel"
            },
            {
                "name": "Suspicious Access via OpenZiti",
                "headers": {
                    "Authorization": f"Bearer {self.token}",
                    "X-Via-Ziti": "true",
                    "X-Openziti-Identity": "suspicious@ziti",
                    "User-Agent": "Suspicious-Bot/1.0"
                },
                "resource": "/admin/panel"
            }
        ]

        for scenario in scenarios:
            print(f"\n  🎯 {scenario['name']}")

            # Standard gateway test
            if scenario.get("rapid"):
                for _ in range(35):
                    requests.post(
                        STANDARD_GATEWAY,
                        headers=scenario["headers"],
                        json={"resource": scenario["resource"]},
                        timeout=5
                    )
                resp = requests.post(
                    STANDARD_GATEWAY,
                    headers=scenario["headers"],
                    json={"resource": scenario["resource"]},
                    timeout=5
                )
            else:
                resp = requests.post(
                    STANDARD_GATEWAY,
                    headers=scenario["headers"],
                    json={"resource": scenario["resource"]},
                    timeout=10
                )
            std_data = resp.json() if resp.status_code != 403 else {"access_decision": "deny"}
            print(f"    Standard Mode: Trust={std_data.get('trust_score', 'N/A')} Decision={std_data.get('access_decision')}")

            # Ziti gateway test
            if "X-Via-Ziti" in scenario.get("headers", {}):
                resp = requests.post(
                    ZITI_GATEWAY,
                    headers=scenario["headers"],
                    json={"resource": scenario["resource"]},
                    timeout=10
                )
                ziti_data = resp.json() if resp.status_code != 403 else {"access_decision": "deny"}
                print(f"    Ziti Mode: Trust={ziti_data.get('trust_score', 'N/A')} (Net={ziti_data.get('network_trust_score', 'N/A')}, App={ziti_data.get('app_trust_score', 'N/A')}) Decision={ziti_data.get('access_decision')}")

    def generate_report(self):
        """Generate comparison report"""
        print("\n📈 Generating comparison report")

        os.makedirs("out/reports", exist_ok=True)
        df_standard = pd.DataFrame(self.results["standard"])
        df_ziti = pd.DataFrame(self.results["ziti"])

        if not df_standard.empty and not df_ziti.empty:
            stats = {
                "Standard Mode": {
                    "Avg Trust Score": df_standard["trust_score"].mean(),
                    "Avg Latency (ms)": df_standard["latency_ms"].mean(),
                    "Allow Rate": (df_standard["decision"] == "allow").mean() * 100,
                    "Deny Rate": (df_standard["decision"] == "deny").mean() * 100
                },
                "OpenZiti Mode": {
                    "Avg Trust Score": df_ziti["trust_score"].mean(),
                    "Avg Network Score": df_ziti["network_score"].mean(),
                    "Avg App Score": df_ziti["app_score"].mean(),
                    "Avg Latency (ms)": df_ziti["latency_ms"].mean(),
                    "Allow Rate": (df_ziti["decision"] == "allow").mean() * 100,
                    "Deny Rate": (df_ziti["decision"] == "deny").mean() * 100
                }
            }

            with open("out/reports/ziti_comparison.json", "w") as f:
                json.dump(stats, f, indent=2)

            print("\n📊 Summary Statistics:")
            for mode, data in stats.items():
                print(f"\n  {mode}:")
                for key, value in data.items():
                    print(f"    {key}: {value:.2f}")

            # Visualization
            try:
                fig, axes = plt.subplots(2, 2, figsize=(12, 8))

                # Trust score comparison
                axes[0, 0].bar(["Standard", "OpenZiti"],
                               [stats["Standard Mode"]["Avg Trust Score"],
                                stats["OpenZiti Mode"]["Avg Trust Score"]])
                axes[0, 0].set_title("Average Trust Score")
                axes[0, 0].set_ylabel("Score")

                # Latency comparison
                axes[0, 1].bar(["Standard", "OpenZiti"],
                               [stats["Standard Mode"]["Avg Latency (ms)"],
                                stats["OpenZiti Mode"]["Avg Latency (ms)"]])
                axes[0, 1].set_title("Average Latency (ms)")
                axes[0, 1].set_ylabel("Milliseconds")

                # Decision distribution - Standard
                axes[1, 0].pie([stats["Standard Mode"]["Allow Rate"],
                                stats["Standard Mode"]["Deny Rate"]],
                               labels=["Allow", "Deny"], autopct='%1.1f%%')
                axes[1, 0].set_title("Standard Mode Decisions")

                # Decision distribution - Ziti
                axes[1, 1].pie([stats["OpenZiti Mode"]["Allow Rate"],
                                stats["OpenZiti Mode"]["Deny Rate"]],
                               labels=["Allow", "Deny"], autopct='%1.1f%%')
                axes[1, 1].set_title("OpenZiti Mode Decisions")

                plt.suptitle("Zero Trust Gateway - OpenZiti Integration Comparison")
                plt.tight_layout()
                plt.savefig("out/reports/ziti_comparison.png")
                print("\n✅ Report saved to out/reports/")
            except Exception as e:
                print(f"\n⚠️ Failed to generate charts: {e}")
        else:
            print("\n⚠️ Not enough data to generate report")


def main():
    print("=" * 60)
    print("Zero Trust Gateway - OpenZiti Integration Test")
    print("=" * 60)

    tester = ZitiTester()
    tester.get_token()
    tester.test_standard_mode("/finance/report", 10)
    tester.test_standard_mode("/admin/panel", 10)
    tester.test_ziti_mode("/finance/report", 10)
    tester.test_ziti_mode("/admin/panel", 10)
    tester.test_attack_scenarios()
    tester.generate_report()

    print("\n" + "=" * 60)
    print("Test Completed!")
    print("=" * 60)


if __name__ == "__main__":
    main()
