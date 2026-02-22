# 🛡️ Guardian AI – Hybrid Real-Time Phishing & Social Engineering Detection Engine

Guardian AI is a real-time hybrid cybersecurity platform that detects phishing URLs, malicious emails, and advanced social engineering attacks by combining Machine Learning, Large Language Models (LLMs), and live Threat Intelligence feeds into a unified explainable risk engine.

---

# 🎯 Vision

Guardian is designed to be:

- Real-time
- Explainable
- Hybrid AI-powered (ML + LLM)
- Threat-intelligence integrated
- API-first
- Dashboard-driven
- Deployable via Docker & Kubernetes

---

# 🧠 Core Detection Architecture

Guardian operates through multiple integrated layers:

## 1️⃣ Machine Learning Layer (Structured Detection)

### URL-Based Signals

- URL length
- Suspicious characters (@, -, //)
- Excessive subdomains
- IP-based URLs
- Entropy score
- Suspicious TLDs (.xyz, .top, .click, etc.)
- HTTPS presence
- SSL certificate mismatch
- Domain age (WHOIS)
- DNS anomalies

### Output

- ML Risk Score (0–100)
- Phishing probability
- Feature importance explanation

---

## 2️⃣ LLM Semantic Intelligence Layer

### Email & Webpage Text Analysis

Detects:

- Urgency manipulation
- Authority impersonation
- Fear-based coercion
- Reward baiting
- Credential harvesting prompts
- Brand impersonation
- Suspicious tone patterns

### Screenshot Analysis (OCR)

- Fake login detection
- Brand cloning detection
- Suspicious form prompts

### Output

- Semantic Risk Score (0–100)
- Attack type classification
- Human-readable explanation

---

## 3️⃣ Threat Intelligence Layer

### Integrations

- VirusTotal
- Google Safe Browsing
- WHOIS lookup
- IP Geolocation
- ASN analysis

### Output

- External Threat Score
- Known malicious indicator flag

---

## 4️⃣ Risk Fusion Engine

Weighted aggregation of detection sources:

| Component       | Weight |
|----------------|----------|
| ML Model        | 40% |
| LLM Analysis    | 30% |
| Threat Intel    | 20% |
| Domain Age Risk | 10% |

### Final Output

- Unified Risk Score (0–100)
- Classification:
  - Safe
  - Suspicious
  - High Risk
  - Confirmed Phishing
- Confidence percentage
- Full breakdown by source

---

# 🚀 Real-Time Capabilities

## Live URL Scanner

- Instant URL analysis
- Full detection pipeline triggered

## Email Scanner Mode

- Manual email input
- IMAP inbox monitoring
- Real-time phishing alerts

## Website Screenshot Analyzer

- Headless browser loading
- Screenshot capture
- OCR extraction
- LLM-based login page analysis

---

# 🧠 Explainable AI

Guardian provides full transparency.

### ML Explanation

- Domain age indicators
- Suspicious TLD detection
- IP-based URL usage
- Entropy anomalies

### LLM Explanation

- Urgency detection
- Account suspension threats
- Credential harvesting prompts
- Emotional manipulation patterns

---

# 📊 SOC-Style Dashboard

Dashboard includes:

- Total scans
- Phishing detected
- Suspicious vs Safe ratio
- Real-time scan logs
- Geo-location mapping
- Attack category distribution
- Detection trends over time

---

# 🌐 Browser Extension

## Features

- Automatic scanning on website visit
- Real-time status indicator:
  - 🟢 Safe
  - ⚠ Suspicious
  - 🔴 Phishing
- Popup with detailed explanation
- Risk breakdown display

---

# 🔐 Security Architecture

Guardian follows a microservice-ready architecture:

- API Gateway
- ML Service
- LLM Service
- Threat Intelligence Service
- Risk Fusion Engine
- Dashboard Frontend

---

# 🐳 Deployment

Guardian is deployable using:

- Docker containers
- Kubernetes orchestration
- Network policies (e.g., Calico)
- Horizontal scaling support

---

# 📡 API Capabilities

Guardian exposes REST endpoints for:

- URL scanning
- Email analysis
- Screenshot analysis
- Risk report retrieval
- Real-time monitoring integration

---

# 🧪 Optional Advanced Features (Post-MVP)

## Phishing Simulation Mode

- Generate phishing templates
- Explain detection triggers
- Awareness training mode

## Red Team Analysis Mode

- Analyze Nmap scans
- Identify exploitation patterns
- Suggest mitigation steps

## Zero-Day Detection Mode

- Autoencoder-based anomaly detection
- Unknown phishing pattern detection

---

# ✅ Final MVP Capabilities Checklist

Guardian AI MVP supports:

- ✔ URL scanning
- ✔ Email analysis
- ✔ Screenshot analysis
- ✔ ML-based detection
- ✔ LLM-based semantic analysis
- ✔ Threat intelligence integration
- ✔ Unified risk scoring
- ✔ Explainable AI breakdown
- ✔ SOC-style dashboard
- ✔ REST API
- ✔ Optional browser extension
- ✔ Docker & Kubernetes deployment

---

# 🎖️ Resume Description

Built Guardian AI — a hybrid machine learning and LLM-powered phishing detection platform integrating real-time threat intelligence, semantic analysis, explainable risk scoring, and deployable microservice architecture.