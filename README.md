Here’s a professional **GitHub README.md** you can use for your project based on your uploaded PDF *“Final Industry Project Report 2025 – Zero Trust Architecture for Small & Medium-scale Businesses.”*

---

# 🛡️ Zero Trust Architecture for Small and Medium Enterprises

This project implements an end-to-end **Zero Trust Security Framework** tailored for **Small and Medium-sized Businesses (SMBs)**. It demonstrates how open-source tools — **Keycloak**, **OpenZiti**, and a custom **Flask Gateway** — can be combined to achieve a cost-effective, scalable, and identity-driven Zero Trust model.

---

## 📘 Overview

Many SMBs still rely on **traditional VPNs** as their primary access control mechanism, which often results in excessive trust, lateral movement, and weak segmentation.
This project provides a **proof-of-concept (PoC)** demonstrating how Zero Trust principles can be applied practically and affordably.

The framework ensures:

* **Service cloaking** (no exposed ports)
* **Identity-based access control**
* **Continuous verification**
* **Granular network segmentation**

---

## 🧩 Architecture Components

| Component                       | Description                                                                                                                                        |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Keycloak**                    | Acts as the Identity Provider (IdP), issuing JWTs containing roles and attributes. Handles user authentication and access management.              |
| **OpenZiti**                    | Provides identity-based secure network overlay, service hiding, and segmentation. Ensures only authorized identities can reach protected services. |
| **Flask Gateway (app_ziti.py)** | Custom lightweight gateway that validates tokens, correlates Ziti identities, calculates a trust score, and enforces policy decisions.             |
| **Redis**                       | Used for caching session and behavior data to assist with trust scoring and audit logging.                                                         |

---

## 🧠 System Design

The system follows the **Zero Trust principles**:

* Never trust, always verify
* Enforce least privilege access
* Continuously monitor and log all access

**Workflow Summary:**

1. The client establishes a secure tunnel via **OpenZiti**.
2. User authenticates through **Keycloak**, receiving a signed JWT.
3. Requests pass through the **Flask Gateway**, which:

   * Verifies Ziti identity
   * Validates Keycloak token
   * Calculates trust score
   * Logs all access events
4. Only verified and authorized requests are forwarded to protected services.

---

## 🧰 Technologies Used

* **OpenZiti** – Identity-based secure network overlay
* **Keycloak** – Open-source Identity and Access Management
* **Flask (Python)** – Lightweight web gateway
* **Docker & Docker Compose** – Containerized deployment
* **Redis** – Caching and behavioral analysis

---

## ⚙️ Project Setup

### Prerequisites

* Docker & Docker Compose installed
* Basic understanding of Python and networking concepts

### Setup Instructions

```bash
# Clone the repository
git clone https://github.com/<yourusername>/zero-trust-sme.git
cd zero-trust-sme

# Start all services
docker-compose up -d

# Access Flask Gateway (inside Ziti network)
http://flask-gateway:7000

# Logs and audit data are stored under /out
```

---

## 🧪 Testing & Validation

The project includes **automated tests** that validate functionality, performance, and security compliance.

### ✅ Functional Tests (TC1–TC6)

| Test Case | Purpose                                                              |
| --------- | -------------------------------------------------------------------- |
| **TC1**   | Confirm Keycloak cannot be accessed directly (must go through Ziti). |
| **TC2**   | Verify Keycloak is accessible through OpenZiti tunnel.               |
| **TC3**   | Ensure Gateway rejects non-Ziti requests.                            |
| **TC4**   | Confirm valid Ziti + Keycloak token allows access.                   |
| **TC5**   | Reject invalid or malformed JWTs.                                    |
| **TC6**   | Detect mismatched Ziti and Keycloak identities.                      |

### 🚀 End-to-End Test (TC7)

Demonstrates a full access flow for a trusted user:

* Builds Ziti tunnel
* Authenticates via Keycloak
* Accesses resources via Gateway
* Audit trail generated for every request

### 📊 Performance Tests (TC8)

* **TC8-1**: Decision latency
* **TC8-2**: Concurrent request stability
* **TC8-3**: Container resource monitoring

All tests passed successfully in the proof-of-concept environment.

---

## 📈 Results Summary

* **Functional**: All Ziti and Keycloak integrations worked as intended.
* **Security**: Unauthorized access and lateral movement were successfully blocked.
* **Performance**: Low latency (<100ms P95) under light load, minimal CPU/memory overhead.
* **Feasibility**: The framework is lightweight, open-source, and suitable for SMB adoption.

---

## 🔒 Key Features

* 🧠 Dual-layer identity verification (Ziti + Keycloak)
* 🔐 Network cloaking — no exposed ports
* 🧾 Full audit and logging of access decisions
* ⚖️ Scalable and low-cost architecture
* 🧱 Easy Docker-based deployment

---

## 🚧 Limitations

* Tested only in a controlled local Docker environment
* No production-grade monitoring or HA features
* Limited trust score logic (simplified for MVP)
* Not stress-tested under heavy loads

---

## 🧭 Future Work

* Integrate **Prometheus/Grafana** for monitoring
* Add **multi-factor authentication (MFA)**
* Expand trust scoring with behavioral analytics
* Support **Kubernetes deployment**
* Conduct real-world testing in SME environments

---

## 👥 Project Team

| Name                          | Role                                                  |
| ----------------------------- | ----------------------------------------------------- |
| **Chandan Cherukuri**         | Developer & Security Engineer                         |
| **Boyuan Zhang**              | Network Engineer                                      |
| **Jianyu Wu**                 | Backend Developer                                     |
| **Nithishkumar Ramamourthy**  | Research & Testing                                    |
| **Supervisor:** Chen Li       | [chen.li-11@uts.edu.au](mailto:chen.li-11@uts.edu.au) |
| **Coordinator:** Rene Leveaux | UTS Faculty of Engineering & IT                       |

---

## 📚 References

* NIST SP 800-207 – *Zero Trust Architecture*
* CISA – *Zero Trust Maturity Model (2023)*
* Australian Signals Directorate (2024) – *Annual Cyber Threat Report*
* Keycloak & OpenZiti official documentation

---

## 🏁 Conclusion

This project demonstrates that **Zero Trust is achievable for SMEs** using open-source and lightweight tools.
The proposed model delivers practical network invisibility, least privilege enforcement, and comprehensive auditing — all within an affordable and replicable framework.

---

### 🧾 License

This project is released under the **MIT License**.
Feel free to fork, modify, and adapt it for your own research or business environment.

---

Would you like me to also include **badges (e.g., Docker build, Python version, MIT license)** and a **diagram (architecture or request flow)** section formatted in Markdown for visual appeal?
