/**
 * Type Definitions for Guardian AI Backend
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface ScanRequest {
  url: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface EmailScanRequest {
  from: string;
  to: string;
  subject: string;
  body: string;
  headers?: Record<string, string>;
  attachments?: Array<{
    filename: string;
    contentType: string;
    size: number;
  }>;
}

export interface ScanResponse {
  scanId: string;
  url: string;
  finalRiskScore: number;
  classification: 'safe' | 'suspicious' | 'high_risk' | 'confirmed_phishing';
  confidence: number;
  breakdown: {
    mlScore: number;
    mlWeight: number;
    llmScore: number;
    llmWeight: number;
    threatScore: number;
    threatWeight: number;
    domainAgeRisk: number;
    domainAgeWeight: number;
  };
  explanation: {
    summary: string;
    mlExplanation: string[];
    llmExplanation: string;
    threatExplanation: string[];
  };
  timestamp: string;
}

export interface DashboardStats {
  totalScans: number;
  phishingDetected: number;
  highRisk: number;
  suspicious: number;
  safe: number;
  avgRiskScore: number;
  recentScans: Array<{
    id: string;
    url: string;
    riskScore: number;
    classification: string;
    timestamp: string;
  }>;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: boolean;
    cache: boolean;
    api: boolean;
  };
  version: string;
}
