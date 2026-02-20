// ─────────────────────────────────────────────────────────────────────────────
// Guardian AI  –  Shared domain types
// ─────────────────────────────────────────────────────────────────────────────

/** Unified risk tier returned by the fusion engine */
export type RiskTier = 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK' | 'CONFIRMED_PHISHING';

/** Attack category classified by the LLM layer */
export type AttackCategory =
  | 'NONE'
  | 'PHISHING'
  | 'CREDENTIAL_HARVESTING'
  | 'URGENCY_MANIPULATION'
  | 'AUTHORITY_IMPERSONATION'
  | 'BRAND_IMPERSONATION'
  | 'REWARD_BAITING'
  | 'FEAR_COERCION'
  | 'MALWARE_DISTRIBUTION'
  | 'SOCIAL_ENGINEERING'
  | 'UNKNOWN';

// ─── ML Feature Vector ───────────────────────────────────────────────────────

export interface UrlFeatures {
  url: string;
  length: number;
  entropy: number;
  dotCount: number;
  dashCount: number;
  underscoreCount: number;
  atSymbolCount: number;
  slashCount: number;
  queryParamCount: number;
  fragmentCount: number;
  subdomainDepth: number;
  pathDepth: number;
  hasIpAddress: boolean;
  hasHttps: boolean;
  hasSuspiciousTld: boolean;
  hasSuspiciousKeywords: boolean;
  hasEncodedChars: boolean;
  hasDataUri: boolean;
  hasPortInUrl: boolean;
  tld: string;
  domain: string;
  subdomain: string;
  digitRatio: number;
  specialCharRatio: number;
  longestWordLength: number;
  homoglyphScore: number;
  brandSimilarityScore: number;
}

export interface MlAnalysisResult {
  features: UrlFeatures;
  riskScore: number;          // 0–100
  confidence: number;         // 0–1
  indicators: string[];       // human-readable feature indicators
  modelVersion: string;
  processingMs: number;
}

// ─── LLM Semantic Analysis ───────────────────────────────────────────────────

export interface LlmAnalysisResult {
  semanticRiskScore: number;  // 0–100
  attackCategory: AttackCategory;
  confidence: number;         // 0–1
  reasoning: string;          // LLM explanation
  indicators: string[];       // detected semantic red-flags
  urgencyLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  brandsMentioned: string[];
  credentialHarvestingDetected: boolean;
  processingMs: number;
  modelUsed: string;
}

// ─── Threat Intelligence ─────────────────────────────────────────────────────

export interface VirusTotalResult {
  positives: number;
  total: number;
  scanDate: string;
  permalink: string;
  detectedEngines: string[];
}

export interface SafeBrowsingResult {
  isMalicious: boolean;
  threatTypes: string[];
  platformTypes: string[];
}

export interface WhoisResult {
  domainName: string;
  registrar: string;
  createdDate: string | null;
  updatedDate: string | null;
  expiresDate: string | null;
  ageInDays: number | null;
  registrantCountry: string | null;
  nameServers: string[];
}

export interface GeoIpResult {
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  org: string;
  asn: string;
  latitude: number;
  longitude: number;
  isTor: boolean;
  isProxy: boolean;
  isHosting: boolean;
}

export interface ThreatIntelResult {
  virusTotal?: VirusTotalResult;
  safeBrowsing?: SafeBrowsingResult;
  whois?: WhoisResult;
  geoIp?: GeoIpResult;
  knownMalicious: boolean;
  reputationScore: number;    // 0–100 (100 = clean)
  sources: string[];
  processingMs: number;
}

// ─── Risk Fusion Engine ──────────────────────────────────────────────────────

export interface RiskFusionResult {
  unifiedRiskScore: number;   // 0–100
  tier: RiskTier;
  confidence: number;         // 0–1
  mlWeight: number;
  llmWeight: number;
  threatIntelWeight: number;
  breakdown: {
    mlScore: number;
    llmScore: number;
    threatIntelScore: number;
  };
  topIndicators: string[];
  attackCategory: AttackCategory;
  recommendation: string;
}

// ─── Full Scan Result ────────────────────────────────────────────────────────

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
  chainId?: number;
  processingMs: number;
}

// ─── Email Analysis ──────────────────────────────────────────────────────────

export interface EmailAnalysisRequest {
  subject: string;
  body: string;
  sender: string;
  recipientCount?: number;
  attachments?: string[];     // filenames
  extractedUrls?: string[];
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

// ─── Dashboard / Analytics ───────────────────────────────────────────────────

export interface DashboardStats {
  totalScans: number;
  scansToday: number;
  scansThisWeek: number;
  threatsByTier: Record<RiskTier, number>;
  threatsByCategory: Record<AttackCategory, number>;
  topMaliciousDomains: Array<{ domain: string; count: number }>;
  averageRiskScore: number;
  detectionRate: number;
  recentScans: ScanResult[];
  geoDistribution: Array<{ country: string; countryCode: string; count: number; lat: number; lng: number }>;
  riskTimeSeries: Array<{ date: string; safe: number; suspicious: number; highRisk: number; confirmed: number }>;
  processingStats: { avgMs: number; p95Ms: number; p99Ms: number };
}

// ─── API Request bodies ──────────────────────────────────────────────────────

export interface ScanUrlRequest {
  url: string;
  options?: {
    skipMl?: boolean;
    skipLlm?: boolean;
    skipThreatIntel?: boolean;
    skipBlockchain?: boolean;
  };
}

export interface ScanTextRequest {
  text: string;
  context?: string;
}

export interface BatchScanRequest {
  urls: string[];
  options?: ScanUrlRequest['options'];
}

// ─── DB models ───────────────────────────────────────────────────────────────

export interface DbScan {
  id: string;
  input: string;
  input_type: string;
  risk_score: number;
  tier: string;
  attack_category: string;
  confidence: number;
  ml_score: number | null;
  llm_score: number | null;
  threat_intel_score: number | null;
  anchored: boolean;
  tx_hash: string | null;
  raw_result: object;
  created_at: Date;
  ip_country: string | null;
  domain: string | null;
}
