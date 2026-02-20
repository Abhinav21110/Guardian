// ─────────────────────────────────────────────────────────────────────────────
// Guardian AI – Frontend API Client
// Talks to the Guardian AI backend REST API
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
const API_KEY  = import.meta.env.VITE_API_KEY ?? '';

// ─── Types (mirrored from server – keep in sync) ──────────────────────────────

export type RiskTier = 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK' | 'CONFIRMED_PHISHING';

export type AttackCategory =
  | 'NONE' | 'PHISHING' | 'CREDENTIAL_HARVESTING' | 'URGENCY_MANIPULATION'
  | 'AUTHORITY_IMPERSONATION' | 'BRAND_IMPERSONATION' | 'REWARD_BAITING'
  | 'FEAR_COERCION' | 'MALWARE_DISTRIBUTION' | 'SOCIAL_ENGINEERING' | 'UNKNOWN';

export interface RiskFusionResult {
  unifiedRiskScore: number;
  tier: RiskTier;
  confidence: number;
  breakdown: { mlScore: number; llmScore: number; threatIntelScore: number };
  topIndicators: string[];
  attackCategory: AttackCategory;
  recommendation: string;
}

export interface MlAnalysisResult {
  riskScore: number;
  confidence: number;
  indicators: string[];
  modelVersion: string;
  processingMs: number;
}

export interface LlmAnalysisResult {
  semanticRiskScore: number;
  attackCategory: AttackCategory;
  confidence: number;
  reasoning: string;
  indicators: string[];
  urgencyLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  brandsMentioned: string[];
  credentialHarvestingDetected: boolean;
  processingMs: number;
}

export interface ThreatIntelResult {
  virusTotal?: { positives: number; total: number; scanDate: string; detectedEngines: string[] };
  safeBrowsing?: { isMalicious: boolean; threatTypes: string[] };
  whois?: { domainName: string; registrar: string; ageInDays: number | null; registrantCountry: string | null };
  geoIp?: { ip: string; country: string; city: string; org: string; asn: string };
  knownMalicious: boolean;
  reputationScore: number;
  sources: string[];
}

export interface ScanResult {
  scanId: string;
  input: string;
  inputType: 'URL' | 'EMAIL' | 'TEXT';
  timestamp: string;
  ml: MlAnalysisResult | null;
  llm: LlmAnalysisResult | null;
  threatIntel: ThreatIntelResult | null;
  fusion: RiskFusionResult;
  anchored: boolean;
  txHash?: string;
  processingMs: number;
  cached?: boolean;
}

export interface EmailAnalysisResult extends ScanResult {
  emailMetadata: {
    subject: string;
    sender: string;
    extractedUrls: string[];
    attachmentCount: number;
    spoofingIndicators: string[];
    headerAnomalies: string[];
  };
  urlResults: ScanResult[];
}

export interface DashboardStats {
  totalScans: number;
  scansToday: number;
  scansThisWeek: number;
  threatsByTier: Record<RiskTier, number>;
  threatsByCategory: Partial<Record<AttackCategory, number>>;
  topMaliciousDomains: Array<{ domain: string; count: number }>;
  averageRiskScore: number;
  detectionRate: number;
  recentScans: ScanResult[];
  riskTimeSeries: Array<{ date: string; safe: number; suspicious: number; highRisk: number; confirmed: number }>;
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
    ...(options?.headers as Record<string, string> ?? {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText })) as { message?: string };
    throw new ApiError(res.status, body.message ?? res.statusText);
  }

  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── API methods ──────────────────────────────────────────────────────────────

export const guardianApi = {
  // ── Health ──────────────────────────────────────────────────────────────────
  health: () => apiFetch<{ status: string; uptimeSeconds: number }>('/api/health'),

  // ── Scan ────────────────────────────────────────────────────────────────────
  scanUrl: (url: string, options?: {
    skipMl?: boolean;
    skipLlm?: boolean;
    skipThreatIntel?: boolean;
  }): Promise<ScanResult> =>
    apiFetch<ScanResult>('/api/scan/url', {
      method: 'POST',
      body: JSON.stringify({ url, options }),
    }),

  batchScanUrls: (urls: string[]): Promise<{ results: ScanResult[]; count: number }> =>
    apiFetch('/api/scan/batch', {
      method: 'POST',
      body: JSON.stringify({ urls }),
    }),

  getScan: (id: string): Promise<ScanResult> =>
    apiFetch<ScanResult>(`/api/scan/${id}`),

  // ── Email ────────────────────────────────────────────────────────────────────
  analyseEmail: (payload: {
    subject: string;
    body: string;
    sender: string;
    attachments?: string[];
    extractedUrls?: string[];
  }): Promise<EmailAnalysisResult> =>
    apiFetch<EmailAnalysisResult>('/api/email/analyse', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // ── Dashboard ────────────────────────────────────────────────────────────────
  getDashboardStats: (): Promise<DashboardStats> =>
    apiFetch<DashboardStats>('/api/dashboard/stats'),

  getRecentScans: (limit = 20, offset = 0): Promise<{ scans: ScanResult[]; count: number }> =>
    apiFetch(`/api/dashboard/recent?limit=${limit}&offset=${offset}`),

  // ── Reports ──────────────────────────────────────────────────────────────────
  getReports: (limit = 50, offset = 0): Promise<{ reports: ScanResult[]; count: number }> =>
    apiFetch(`/api/reports?limit=${limit}&offset=${offset}`),

  getReport: (id: string): Promise<ScanResult> =>
    apiFetch<ScanResult>(`/api/reports/${id}`),

  // ── Threats ──────────────────────────────────────────────────────────────────
  getThreatFeed: (): Promise<{ threats: ScanResult[]; count: number }> =>
    apiFetch('/api/threats/feed'),

  getThreatStats: (): Promise<{ byCategory: Record<string, number>; byTier: Record<string, number>; totalAnalysed: number }> =>
    apiFetch('/api/threats/stats'),
};

// ─── Tier helpers ─────────────────────────────────────────────────────────────

export function tierToColor(tier: RiskTier): string {
  switch (tier) {
    case 'SAFE':               return 'text-green-400';
    case 'SUSPICIOUS':         return 'text-yellow-400';
    case 'HIGH_RISK':          return 'text-orange-400';
    case 'CONFIRMED_PHISHING': return 'text-red-500';
  }
}

export function tierToBadgeVariant(tier: RiskTier): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (tier) {
    case 'SAFE':               return 'default';
    case 'SUSPICIOUS':         return 'secondary';
    case 'HIGH_RISK':          return 'destructive';
    case 'CONFIRMED_PHISHING': return 'destructive';
  }
}

export function tierToLabel(tier: RiskTier): string {
  switch (tier) {
    case 'SAFE':               return 'Safe';
    case 'SUSPICIOUS':         return 'Suspicious';
    case 'HIGH_RISK':          return 'High Risk';
    case 'CONFIRMED_PHISHING': return 'Confirmed Phishing';
  }
}
