// ─────────────────────────────────────────────────────────────────────────────
// Guardian AI – ML-based URL Feature Extractor & Risk Scorer
// Pure TypeScript implementation – no Python required for MVP
// ─────────────────────────────────────────────────────────────────────────────
import type { MlAnalysisResult, UrlFeatures } from '../types/index';
import { logger } from '../config/logger';

const MODEL_VERSION = '1.0.0';

// ─── Known data ───────────────────────────────────────────────────────────────

const SUSPICIOUS_TLDS = new Set([
  'tk', 'ml', 'ga', 'cf', 'gq', 'pw', 'cc', 'xyz', 'top', 'club',
  'online', 'site', 'website', 'store', 'tech', 'info', 'biz',
  'work', 'rest', 'kim', 'country', 'stream', 'download', 'racing',
  'review', 'trade', 'accountant', 'science', 'date', 'faith', 'loan',
]);

const SUSPICIOUS_KEYWORDS = [
  'login', 'signin', 'sign-in', 'account', 'verify', 'verification',
  'secure', 'security', 'update', 'confirm', 'password', 'credential',
  'banking', 'paypal', 'amazon', 'apple', 'microsoft', 'google',
  'netflix', 'facebook', 'instagram', 'invoice', 'payment', 'reset',
  'support', 'helpdesk', 'customer', 'service', 'wallet', 'crypto',
  'prize', 'winner', 'lucky', 'free', 'gift', 'claim', 'reward',
];

const WELL_KNOWN_BRANDS = [
  'paypal', 'amazon', 'apple', 'microsoft', 'google', 'facebook',
  'instagram', 'netflix', 'linkedin', 'twitter', 'x', 'dropbox',
  'github', 'gmail', 'outlook', 'yahoo', 'bankofamerica', 'chase',
  'wellsfargo', 'citibank', 'barclays', 'hsbc', 'dhl', 'fedex', 'ups',
];

// Common homoglyph substitutions
const HOMOGLYPH_MAP: Record<string, string[]> = {
  a: ['@', '4', 'α', 'ɑ'],
  e: ['3', 'ε'],
  i: ['1', 'l', '!', 'ι'],
  o: ['0', 'ο', 'σ'],
  s: ['5', '$', 'ς'],
  t: ['7', '+'],
  l: ['1', 'I'],
  g: ['9', 'q'],
};

// ─── Shannon entropy ──────────────────────────────────────────────────────────

function shannonEntropy(str: string): number {
  if (!str.length) return 0;
  const freq: Record<string, number> = {};
  for (const ch of str) freq[ch] = (freq[ch] ?? 0) + 1;
  let entropy = 0;
  for (const count of Object.values(freq)) {
    const p = count / str.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

// ─── Levenshtein distance ─────────────────────────────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// ─── Homoglyph detection ─────────────────────────────────────────────────────

function homoglyphNormalise(str: string): string {
  let out = str.toLowerCase();
  for (const [orig, subs] of Object.entries(HOMOGLYPH_MAP)) {
    for (const sub of subs) {
      out = out.replaceAll(sub, orig);
    }
  }
  return out;
}

// ─── Feature extraction ───────────────────────────────────────────────────────

export function extractUrlFeatures(rawUrl: string): UrlFeatures {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.startsWith('http') ? rawUrl : `http://${rawUrl}`);
  } catch {
    // Unparseable URL – return worst-case features
    return buildFallbackFeatures(rawUrl);
  }

  const full = rawUrl;
  const hostname = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname;
  const search = parsed.search;
  const fragment = parsed.hash;

  // TLD & domain decomposition
  const parts = hostname.split('.');
  const tld = parts.at(-1) ?? '';
  const domain = parts.slice(-2).join('.');
  const subdomain = parts.slice(0, -2).join('.');

  // Subdomain depth
  const subdomainDepth = subdomain ? subdomain.split('.').length : 0;

  // Path depth
  const pathDepth = pathname.split('/').filter(Boolean).length;

  // Query params
  const queryParamCount = [...parsed.searchParams.keys()].length;

  // Digit ratio
  const digits = (full.match(/\d/g) ?? []).length;
  const digitRatio = digits / full.length;

  // Special chars ratio
  const specials = (full.match(/[^a-zA-Z0-9/:.-]/g) ?? []).length;
  const specialCharRatio = specials / full.length;

  // Longest word in domain
  const domainWords = domain.replace(/[-_.]/g, ' ').split(/\s+/).filter(Boolean);
  const longestWordLength = domainWords.reduce((max, w) => Math.max(max, w.length), 0);

  // IP-based hostname
  const hasIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) ||
    /^\[?[0-9a-fA-F:]+\]?$/.test(hostname);

  // Suspicious keywords in full URL
  const lowerUrl = full.toLowerCase();
  const hasSuspiciousKeywords = SUSPICIOUS_KEYWORDS.some(kw => lowerUrl.includes(kw));

  // Suspicious TLD
  const hasSuspiciousTld = SUSPICIOUS_TLDS.has(tld.toLowerCase());

  // Encoded chars
  const hasEncodedChars = (full.match(/%[0-9a-fA-F]{2}/g) ?? []).length > 3;

  // Data URI
  const hasDataUri = full.toLowerCase().startsWith('data:');

  // Port in URL
  const hasPortInUrl = !!parsed.port && !['80', '443'].includes(parsed.port);

  // Homoglyph score against known brands
  const normalDomain = homoglyphNormalise(domain.split('.')[0]);
  let brandSimilarityScore = 0;
  let homoglyphScore = 0;
  for (const brand of WELL_KNOWN_BRANDS) {
    const dist = levenshtein(normalDomain, brand);
    const sim = 1 - dist / Math.max(normalDomain.length, brand.length);
    if (sim > brandSimilarityScore) brandSimilarityScore = sim;
    // If normalised != original but is close to brand – homoglyph
    if (domain.split('.')[0] !== normalDomain && sim > 0.8) {
      homoglyphScore = Math.max(homoglyphScore, sim);
    }
  }

  return {
    url: rawUrl,
    length: full.length,
    entropy: shannonEntropy(full),
    dotCount: (full.match(/\./g) ?? []).length,
    dashCount: (full.match(/-/g) ?? []).length,
    underscoreCount: (full.match(/_/g) ?? []).length,
    atSymbolCount: (full.match(/@/g) ?? []).length,
    slashCount: (full.match(/\//g) ?? []).length,
    queryParamCount,
    fragmentCount: fragment ? 1 : 0,
    subdomainDepth,
    pathDepth,
    hasIpAddress,
    hasHttps: parsed.protocol === 'https:',
    hasSuspiciousTld,
    hasSuspiciousKeywords,
    hasEncodedChars,
    hasDataUri,
    hasPortInUrl,
    tld,
    domain,
    subdomain,
    digitRatio,
    specialCharRatio,
    longestWordLength,
    homoglyphScore,
    brandSimilarityScore,
  };
}

function buildFallbackFeatures(rawUrl: string): UrlFeatures {
  return {
    url: rawUrl,
    length: rawUrl.length,
    entropy: shannonEntropy(rawUrl),
    dotCount: (rawUrl.match(/\./g) ?? []).length,
    dashCount: (rawUrl.match(/-/g) ?? []).length,
    underscoreCount: (rawUrl.match(/_/g) ?? []).length,
    atSymbolCount: (rawUrl.match(/@/g) ?? []).length,
    slashCount: (rawUrl.match(/\//g) ?? []).length,
    queryParamCount: 0,
    fragmentCount: 0,
    subdomainDepth: 0,
    pathDepth: 0,
    hasIpAddress: false,
    hasHttps: false,
    hasSuspiciousTld: false,
    hasSuspiciousKeywords: false,
    hasEncodedChars: false,
    hasDataUri: false,
    hasPortInUrl: false,
    tld: '',
    domain: rawUrl,
    subdomain: '',
    digitRatio: 0,
    specialCharRatio: 0,
    longestWordLength: 0,
    homoglyphScore: 0,
    brandSimilarityScore: 0,
  };
}

// ─── Scoring rules (heuristic weighted model) ─────────────────────────────────

interface ScoredIndicator { score: number; label: string }

function scoreFeatures(f: UrlFeatures): ScoredIndicator[] {
  const indicators: ScoredIndicator[] = [];

  if (f.hasIpAddress)            indicators.push({ score: 20, label: 'IP-based domain detected' });
  if (!f.hasHttps)               indicators.push({ score: 12, label: 'Non-HTTPS connection' });
  if (f.hasSuspiciousTld)        indicators.push({ score: 15, label: `Suspicious TLD (.${f.tld})` });
  if (f.hasSuspiciousKeywords)   indicators.push({ score: 14, label: 'Suspicious keywords in URL' });
  if (f.hasEncodedChars)         indicators.push({ score: 8,  label: 'Excessive percent-encoding' });
  if (f.hasDataUri)              indicators.push({ score: 25, label: 'Data URI scheme detected' });
  if (f.hasPortInUrl)            indicators.push({ score: 10, label: 'Non-standard port in URL' });
  if (f.atSymbolCount > 0)       indicators.push({ score: 20, label: 'At-sign (@) in URL' });
  if (f.subdomainDepth >= 4)     indicators.push({ score: 15, label: 'Excessive subdomain depth' });
  else if (f.subdomainDepth >= 2) indicators.push({ score: 6, label: 'Multiple subdomains' });
  if (f.length > 100)            indicators.push({ score: 8,  label: 'Unusually long URL' });
  if (f.entropy > 4.5)           indicators.push({ score: 10, label: 'High URL entropy (randomised)' });
  if (f.digitRatio > 0.3)        indicators.push({ score: 8,  label: 'High digit ratio in URL' });
  if (f.dashCount > 4)           indicators.push({ score: 6,  label: 'Excessive dashes in domain' });
  if (f.dotCount > 6)            indicators.push({ score: 6,  label: 'Excessive dots in URL' });
  if (f.queryParamCount > 5)     indicators.push({ score: 5,  label: 'Many query parameters' });
  if (f.homoglyphScore > 0.8)    indicators.push({ score: 22, label: 'Homoglyph brand impersonation detected' });
  else if (f.brandSimilarityScore > 0.85 && !f.domain.includes(WELL_KNOWN_BRANDS.find(b => f.domain.includes(b)) ?? '___')) {
    indicators.push({ score: 18, label: 'Brand name similarity in domain' });
  }
  if (f.pathDepth > 6)           indicators.push({ score: 4,  label: 'Deep URL path structure' });

  return indicators;
}

// ─── Public analyser ──────────────────────────────────────────────────────────

export async function analyseUrl(url: string): Promise<MlAnalysisResult> {
  const t0 = Date.now();
  logger.debug({ url }, 'ML analysis start');

  const features = extractUrlFeatures(url);
  const scored   = scoreFeatures(features);

  // Raw sum capped at 100
  const rawSum   = scored.reduce((s, i) => s + i.score, 0);
  const riskScore = Math.min(100, rawSum);

  // Confidence based on how many indicators fired
  const confidence = Math.min(0.98, 0.5 + scored.length * 0.06);

  const processingMs = Date.now() - t0;

  logger.debug({ url, riskScore, indicators: scored.length }, 'ML analysis done');

  return {
    features,
    riskScore,
    confidence,
    indicators: scored.map(i => i.label),
    modelVersion: MODEL_VERSION,
    processingMs,
  };
}
