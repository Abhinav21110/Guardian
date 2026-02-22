# 🛡️ Guardian AI

> **Production-ready hybrid cybersecurity platform** combining Machine Learning, Large Language Models, and live Threat Intelligence to detect phishing URLs, malicious emails, and social engineering attacks in real-time.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-ISC-yellow)](LICENSE)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Contributing](#contributing)

---

## 🎯 Overview

Guardian AI is a comprehensive threat detection solution that combines:

- **Machine Learning** - 25+ URL features for structural analysis
- **LLM Intelligence** - GPT-4o-mini for semantic threat detection
- **Threat Intelligence** - Real-time feeds from VirusTotal, Google Safe Browsing, WHOIS
- **Risk Fusion** - Weighted scoring engine with explainable AI
- **Real-time Analysis** - Instant URL and email scanning
- **SOC Dashboard** - Enterprise-grade monitoring and reporting

### Key Capabilities

✅ Real-time URL phishing detection  
✅ Email content analysis and spoofing detection  
✅ Homoglyph and brand impersonation detection  
✅ Urgency manipulation and social engineering detection  
✅ Threat intelligence integration  
✅ Explainable AI with detailed risk breakdowns  
✅ Production-ready with Docker & Kubernetes support  

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          GUARDIAN AI PLATFORM                           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                            PRESENTATION LAYER                           │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  React 18 SPA (Vite + TypeScript)                                 │  │
│  │  • Dashboard  • Scanner  • Reports  • Threats  • Settings         │  │
│  │  • shadcn/ui + Tailwind CSS  • React Query  • React Router        │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ HTTPS / REST API
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            API GATEWAY LAYER                            │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  Express 5 + TypeScript                                           │  │
│  │  • Rate Limiting  • API Key Auth  • CORS  • Helmet Security       │  │
│  │  • Request Validation (Zod)  • Error Handling  • Logging (Pino)   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         ANALYSIS ENGINE LAYER                           │
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────┐   │
│  │  ML ANALYZER     │  │  LLM ANALYZER    │  │  THREAT INTEL      │   │
│  │  ────────────    │  │  ─────────────   │  │  ──────────────    │   │
│  │  • URL Features  │  │  • OpenAI GPT-4o │  │  • VirusTotal v3   │   │
│  │  • Entropy       │  │  • Semantic      │  │  • Google Safe     │   │
│  │  • Homoglyphs    │  │    Analysis      │  │    Browsing v4     │   │
│  │  • TLD Risk      │  │  • Intent        │  │  • WHOIS Lookup    │   │
│  │  • Brand Match   │  │    Detection     │  │  • IP Geolocation  │   │
│  │  • 25+ Features  │  │  • Attack        │  │  • Reputation DB   │   │
│  │                  │  │    Category      │  │                    │   │
│  │  Risk: 0-100     │  │  Risk: 0-100     │  │  Risk: 0-100       │   │
│  │  Weight: 35%     │  │  Weight: 35%     │  │  Weight: 30%       │   │
│  └──────────────────┘  └──────────────────┘  └────────────────────┘   │
│           │                     │                       │              │
│           └─────────────────────┼───────────────────────┘              │
│                                 ▼                                       │
│                    ┌─────────────────────────┐                         │
│                    │   RISK FUSION ENGINE    │                         │
│                    │   ──────────────────    │                         │
│                    │   • Weighted Average    │                         │
│                    │   • Hard Overrides      │                         │
│                    │   • Tier Classification │                         │
│                    │   • Confidence Scoring  │                         │
│                    │   • Attack Categorization│                        │
│                    └─────────────────────────┘                         │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATA PERSISTENCE LAYER                         │
│                                                                         │
│  ┌──────────────────────────┐         ┌──────────────────────────┐     │
│  │  POSTGRESQL 16           │         │  REDIS 7                 │     │
│  │  ────────────            │         │  ────────                │     │
│  │  • Scan History          │         │  • Result Cache (5min)   │     │
│  │  • Threat Database       │         │  • Session Storage       │     │
│  │  • Analytics Data        │         │  • Rate Limit Counters   │     │
│  │  • User Reports          │         │  • In-Memory Fallback    │     │
│  │  • Indexed Queries       │         │                          │     │
│  └──────────────────────────┘         └──────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          OPTIONAL SERVICES                              │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  Blockchain Anchoring (EVM-compatible)                            │  │
│  │  • Immutable audit trail  • Hash anchoring  • Proof of scan       │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### Core Detection Capabilities

| Feature | Description | Status |
|---------|-------------|--------|
| **ML URL Analysis** | 25+ structural features including entropy, homoglyphs, TLD risk, subdomain depth, IP detection, brand similarity | ✅ |
| **LLM Semantic Analysis** | GPT-4o-mini analyzes URLs/emails for urgency manipulation, authority impersonation, credential harvesting | ✅ |
| **Threat Intelligence** | Real-time queries to VirusTotal v3, Google Safe Browsing v4, WHOIS, IP geolocation | ✅ |
| **Risk Fusion Engine** | Weighted combination (ML 35% + LLM 35% + TI 30%) with hard overrides for known threats | ✅ |
| **Email Analysis** | Header anomaly detection, spoofing indicators, URL extraction + sub-scanning | ✅ |
| **SOC Dashboard** | Live statistics, tier breakdowns, recent scans feed, processing metrics | ✅ |
| **Caching** | Redis-backed result cache (5 min TTL) with in-memory fallback | ✅ |
| **Persistence** | PostgreSQL with full scan history, indexed for analytics | ✅ |
| **Blockchain Anchoring** | Optional EVM-compatible hash anchoring for audit trails | ✅ |

### Risk Tiers

| Score | Tier | Action |
|-------|------|--------|
| 0–34  | SAFE | No significant indicators detected |
| 35–59 | SUSPICIOUS | Verify authenticity before interacting |
| 60–79 | HIGH_RISK | Clear attack patterns detected |
| 80–100 | CONFIRMED_PHISHING | Block immediately and report |

---

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI library
- **TypeScript 5.8** - Type-safe development
- **Vite 5.4** - Lightning-fast build tool
- **shadcn/ui** - Beautiful component library
- **Tailwind CSS 3.4** - Utility-first styling
- **React Query 5** - Server state management
- **React Router 6** - Client-side routing
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Recharts** - Data visualization
- **Lucide React** - Icon library

### Backend
- **Node.js 18+** - JavaScript runtime
- **Express 5** - Web framework
- **TypeScript 5.9** - Type safety
- **PostgreSQL 16** - Relational database
- **Redis 7** - In-memory cache
- **OpenAI GPT-4o-mini** - LLM analysis
- **Helmet** - Security headers
- **CORS** - Cross-origin support
- **Pino** - Structured logging
- **Zod** - Request validation
- **Ethers.js** - Blockchain integration

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Kubernetes** - Container orchestration
- **Nginx** - Reverse proxy & static file serving
- **PostgreSQL** - Data persistence
- **Redis** - Caching layer

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker & Docker Compose (optional)
- PostgreSQL 16 (optional - uses in-memory fallback)
- Redis 7 (optional - uses in-memory fallback)

### Local Development

```bash
# 1. Clone the repository
git clone <repository-url>
cd guardian-ai

# 2. Install dependencies
npm install
cd server && npm install --legacy-peer-deps && cd ..

# 3. Configure environment (optional)
cp server/.env.example server/.env
# Edit server/.env with your API keys

# 4. Start backend (Terminal 1)
cd server
npm run dev
# Backend runs on http://localhost:8080

# 5. Start frontend (Terminal 2)
npm run dev
# Frontend runs on http://localhost:5173
```

### Docker Compose (Recommended)

```bash
# 1. Configure environment
cp .env.example .env
cp server/.env.example server/.env
# Edit .env files with your credentials

# 2. Start all services
docker compose up --build

# Access:
# Frontend: http://localhost:3000
# API: http://localhost:8080
# PostgreSQL: localhost:5432
# Redis: localhost:6379
```

### Kubernetes Deployment

```bash
# 1. Edit secrets
# Edit k8s/01-secrets.yaml and replace all placeholder values

# 2. Apply manifests in order
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-secrets.yaml
kubectl apply -f k8s/02-configmap.yaml
kubectl apply -f k8s/03-postgres.yaml
kubectl apply -f k8s/04-redis.yaml
kubectl apply -f k8s/05-api-server.yaml
kubectl apply -f k8s/06-frontend.yaml
kubectl apply -f k8s/07-ingress-network.yaml
```

---

## 📡 API Documentation

### Base URL
```
http://localhost:8080/api
```

### Authentication
Optional API key authentication via `x-api-key` header.

### Endpoints

#### Health Checks
```http
GET /api/health              # Liveness check
GET /api/health/ready        # Readiness probe
GET /api/health/live         # Kubernetes liveness
```

#### URL Scanning
```http
POST /api/scan/url           # Scan single URL
POST /api/scan/batch         # Scan multiple URLs (max 10)
GET  /api/scan/:id           # Retrieve scan by ID
```

#### Email Analysis
```http
POST /api/email/analyse      # Analyze email content
```

#### Dashboard
```http
GET /api/dashboard/stats     # Get dashboard statistics
GET /api/dashboard/recent    # Get recent scans
```

#### Reports
```http
GET /api/reports             # List scan history (paginated)
GET /api/reports/:id         # Get specific scan report
```

#### Threats
```http
GET /api/threats/feed        # Get high-risk threat feed
GET /api/threats/stats       # Get threat statistics
```

### Example: Scan URL

**Request:**
```bash
curl -X POST http://localhost:8080/api/scan/url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://paypa1-verification.tk/login"
  }'
```

**Response:**
```json
{
  "scanId": "550e8400-e29b-41d4-a716-446655440000",
  "input": "https://paypa1-verification.tk/login",
  "inputType": "URL",
  "timestamp": "2026-02-21T14:30:00.000Z",
  "fusion": {
    "unifiedRiskScore": 94,
    "tier": "CONFIRMED_PHISHING",
    "confidence": 0.97,
    "breakdown": {
      "mlScore": 85,
      "llmScore": 92,
      "threatIntelScore": 88
    },
    "topIndicators": [
      "Homoglyph brand impersonation (paypa1 vs paypal)",
      "Suspicious TLD (.tk)",
      "Login keyword in URL",
      "Newly registered domain"
    ],
    "attackCategory": "CREDENTIAL_HARVESTING",
    "recommendation": "BLOCK IMMEDIATELY. This resource has been classified as a confirmed phishing attempt..."
  },
  "processingMs": 1247
}
```

---

## ⚙️ Configuration

### Environment Variables

#### Backend (`server/.env`)

```bash
# Server
NODE_ENV=development
PORT=8080
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:5173

# Database (optional)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=guardian_ai
DB_USER=guardian
DB_PASSWORD=your_password

# Redis (optional)
REDIS_URL=redis://localhost:6379
CACHE_TTL_SECONDS=300

# API Keys (optional)
OPENAI_API_KEY=sk-...
VIRUSTOTAL_API_KEY=...
GOOGLE_SAFE_BROWSING_API_KEY=...
IPINFO_TOKEN=...

# Security
API_KEY=your_api_key
API_KEY_HEADER=x-api-key

# Feature Flags
ENABLE_ML=true
ENABLE_LLM=true
ENABLE_THREAT_INTEL=true
ENABLE_BLOCKCHAIN=false
```

#### Frontend (`.env`)

```bash
VITE_API_BASE_URL=http://localhost:8080
VITE_API_KEY=
```

### Graceful Degradation

Guardian AI works without external dependencies:
- **No PostgreSQL?** Uses in-memory storage
- **No Redis?** Uses in-memory cache
- **No API keys?** ML analysis still works fully
- **No LLM key?** Skips semantic analysis
- **No Threat Intel keys?** Skips external checks

---

## 📁 Project Structure

```
guardian-ai/
├── src/                        # Frontend source code
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── Scanner.tsx         # URL/Email scanner
│   │   ├── Dashboard.tsx       # SOC dashboard
│   │   └── ...
│   ├── pages/                  # Route pages
│   ├── lib/
│   │   ├── api.ts              # API client
│   │   └── utils.ts            # Utilities
│   └── data/                   # Sample data
├── server/src/                 # Backend source code
│   ├── services/               # Core business logic
│   │   ├── ml-analyzer.ts      # ML URL analysis
│   │   ├── llm-analyzer.ts     # LLM semantic analysis
│   │   ├── threat-intelligence.ts  # External threat feeds
│   │   ├── risk-fusion.ts      # Risk scoring engine
│   │   ├── email-analyzer.ts   # Email analysis
│   │   ├── cache.ts            # Redis caching
│   │   ├── database.ts         # PostgreSQL
│   │   └── blockchain.ts       # Blockchain anchoring
│   ├── routes/                 # API endpoints
│   ├── middleware/             # Express middleware
│   ├── config/                 # Configuration
│   └── types/                  # TypeScript types
├── k8s/                        # Kubernetes manifests
├── public/                     # Static assets
├── docker-compose.yml          # Docker Compose config
├── Dockerfile                  # Frontend Docker image
├── server/Dockerfile           # Backend Docker image
└── README.md                   # This file
```

---

## 🧪 Testing

```bash
# Frontend
npm run lint
npm run build

# Backend
cd server
npm run typecheck
npm run lint
npm run build
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

## 🙏 Acknowledgments

- OpenAI for GPT-4o-mini
- VirusTotal for threat intelligence
- Google Safe Browsing for phishing detection
- shadcn/ui for beautiful components
- The open-source community

---

## 📞 Support

For issues, questions, or contributions, please open an issue on GitHub.

---

