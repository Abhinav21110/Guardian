# Guardian AI Backend

**Hybrid Real-Time Phishing & Social Engineering Detection Engine**

## 🎯 Overview

Guardian AI Backend is a microservice-ready REST API that combines Machine Learning, Large Language Models (LLMs), and real-time Threat Intelligence to detect phishing URLs, malicious emails, and social engineering attacks.

## 🏗️ Architecture

### Core Services

1. **ML Analyzer Service** (40% weight)
   - URL feature extraction
   - Entropy analysis
   - Domain age checking
   - Suspicious pattern detection

2. **LLM Semantic Intelligence Service** (30% weight)
   - Social engineering detection
   - Email content analysis
   - Brand impersonation detection
   - Screenshot OCR analysis

3. **Threat Intelligence Service** (20% weight)
   - VirusTotal integration
   - Google Safe Browsing
   - WHOIS lookup
   - IP Geolocation

4. **Risk Fusion Engine** (10% domain age)
   - Weighted risk aggregation
   - Classification (Safe/Suspicious/High Risk/Confirmed Phishing)
   - Explainable AI output

### Supporting Services

- **Database Service**: PostgreSQL for scan history
- **Cache Service**: Redis for performance
- **Email Analyzer**: Specialized email phishing detection

## 📡 API Endpoints

### Health Check
```
GET /api/health
GET /api/health/ping
```

### URL Scanning
```
POST /api/scan
GET /api/scan/:scanId
```

**Request Body:**
```json
{
  "url": "https://example.com",
  "userAgent": "Mozilla/5.0...",
  "ipAddress": "192.168.1.1"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "scanId": "uuid",
    "url": "https://example.com",
    "finalRiskScore": 75,
    "classification": "high_risk",
    "confidence": 85,
    "breakdown": {
      "mlScore": 70,
      "llmScore": 80,
      "threatScore": 75,
      "domainAgeRisk": 90
    },
    "explanation": {
      "summary": "🔴 Risk Score: 75/100...",
      "mlExplanation": [...],
      "llmExplanation": "...",
      "threatExplanation": [...]
    }
  }
}
```

### Email Scanning
```
POST /api/email/scan
```

**Request Body:**
```json
{
  "from": "sender@example.com",
  "to": "recipient@example.com",
  "subject": "Urgent: Verify Your Account",
  "body": "Email content...",
  "headers": {},
  "attachments": []
}
```

### Dashboard
```
GET /api/dashboard/stats
GET /api/dashboard/recent?limit=100
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+

### Installation

```bash
cd backend
npm install
```

### Configuration

```bash
cp .env.example .env
# Edit .env with your configuration
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## 🐳 Docker Deployment

```bash
docker build -t guardian-backend .
docker run -p 3001:3001 --env-file .env guardian-backend
```

## 📊 Database Schema

```sql
CREATE TABLE scans (
  id UUID PRIMARY KEY,
  url TEXT NOT NULL,
  final_risk_score INTEGER,
  classification VARCHAR(50),
  confidence INTEGER,
  ml_score INTEGER,
  llm_score INTEGER,
  threat_score INTEGER,
  scan_type VARCHAR(20),
  timestamp TIMESTAMP,
  full_report JSONB
);
```

## 🔐 Security Features

- Helmet.js security headers
- CORS protection
- Rate limiting
- Input sanitization
- Request validation

## 🧪 Testing

```bash
npm test
```

## 📝 API Documentation

Full API documentation available at `/api` when server is running.

## 🛠️ Tech Stack

- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL
- **Cache**: Redis
- **Logging**: Winston
- **Security**: Helmet, CORS

## 📈 Monitoring

Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only

## 🤝 Contributing

This backend is designed to be modular and extensible. Each service can be independently scaled or replaced.

## 📄 License

MIT License

---

**Built with ❤️ for cybersecurity**
