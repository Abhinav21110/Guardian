// ─────────────────────────────────────────────────────────────────────────────
// Guardian AI – Risk Fusion Engine
// Combines ML, LLM and Threat-Intel scores into a unified risk decision
// ─────────────────────────────────────────────────────────────────────────────
import type {
  MlAnalysisResult,
  LlmAnalysisResult,
  ThreatIntelResult,
  RiskFusionResult,
  RiskTier,
  AttackCategory,
} from '../types/index';

// ─── Weights (must sum to 1.0) ────────────────────────────────────────────────
const W_ML          = 0.35;
const W_LLM         = 0.35;
const W_THREAT_INTEL = 0.30;

// ─── Tier thresholds ──────────────────────────────────────────────────────────
function toTier(score: number): RiskTier {
  if (score >= 80) return 'CONFIRMED_PHISHING';
  if (score >= 60) return 'HIGH_RISK';
  if (score >= 35) return 'SUSPICIOUS';
  return 'SAFE';
}

// ─── Recommendation text ──────────────────────────────────────────────────────
function buildRecommendation(tier: RiskTier, category: AttackCategory): string {
  switch (tier) {
    case 'CONFIRMED_PHISHING':
      return `BLOCK IMMEDIATELY. This ${category !== 'NONE' ? category.toLowerCase().replace(/_/g, ' ') : 'resource'} has been classified as a confirmed phishing attempt. Do not interact with this content and report it to your security team.`;
    case 'HIGH_RISK':
      return `Exercise extreme caution. Multiple high-risk indicators detected. Avoid entering credentials or sensitive information. Report to your security team for further investigation.`;
    case 'SUSPICIOUS':
      return `Proceed with caution. Several suspicious indicators were found. Verify the authenticity of this resource through official channels before interacting.`;
    case 'SAFE':
      return `No significant threats detected. Standard security practices apply.`;
  }
}

// ─── Fusion function ──────────────────────────────────────────────────────────

export function fuseRiskScores(
  ml: MlAnalysisResult | null,
  llm: LlmAnalysisResult | null,
  threatIntel: ThreatIntelResult | null,
): RiskFusionResult {
  const mlScore     = ml?.riskScore ?? 0;
  const llmScore    = llm?.semanticRiskScore ?? 0;

  // Convert threat intel reputation to risk score (inverted)
  const tiReputation = threatIntel?.reputationScore ?? 100;
  const tiScore      = 100 - tiReputation;

  // Weighted average
  let totalWeight = 0;
  let weightedSum = 0;

  if (ml) { weightedSum += mlScore    * W_ML;          totalWeight += W_ML; }
  if (llm) { weightedSum += llmScore  * W_LLM;         totalWeight += W_LLM; }
  if (threatIntel) { weightedSum += tiScore * W_THREAT_INTEL; totalWeight += W_THREAT_INTEL; }

  // Normalise in case some modules were skipped
  const baseScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

  // Hard overrides for definitive signals
  let unifiedRiskScore = baseScore;
  if (threatIntel?.knownMalicious)      unifiedRiskScore = Math.max(unifiedRiskScore, 90);
  if (threatIntel?.safeBrowsing?.isMalicious) unifiedRiskScore = Math.max(unifiedRiskScore, 85);
  if ((threatIntel?.virusTotal?.positives ?? 0) >= 5) unifiedRiskScore = Math.max(unifiedRiskScore, 80);

  unifiedRiskScore = Math.min(100, Math.round(unifiedRiskScore));

  const tier = toTier(unifiedRiskScore);

  // Best attack category (LLM wins over fallback)
  const attackCategory: AttackCategory = llm?.attackCategory && llm.attackCategory !== 'UNKNOWN'
    ? llm.attackCategory
    : 'UNKNOWN';

  // Aggregate top indicators
  const allIndicators = [
    ...(ml?.indicators ?? []),
    ...(llm?.indicators ?? []),
    ...(threatIntel?.safeBrowsing?.isMalicious ? ['Listed in Google Safe Browsing'] : []),
    ...((threatIntel?.virusTotal?.positives ?? 0) > 0
      ? [`VirusTotal: ${threatIntel?.virusTotal?.positives}/${threatIntel?.virusTotal?.total} engines flagged`]
      : []),
    ...(threatIntel?.whois?.ageInDays !== null && (threatIntel?.whois?.ageInDays ?? 999) < 30
      ? [`Newly registered domain (${threatIntel?.whois?.ageInDays} days old)`]
      : []),
  ];

  // Deduplicate and take top 10
  const topIndicators = [...new Set(allIndicators)].slice(0, 10);

  // Confidence: weighted average of individual confidences
  const confidences: number[] = [];
  if (ml)          confidences.push(ml.confidence);
  if (llm)         confidences.push(llm.confidence);
  if (threatIntel) confidences.push(threatIntel.sources.length > 0 ? 0.9 : 0.5);
  const confidence = confidences.length
    ? confidences.reduce((a, b) => a + b, 0) / confidences.length
    : 0.5;

  return {
    unifiedRiskScore,
    tier,
    confidence: Math.round(confidence * 100) / 100,
    mlWeight:          W_ML,
    llmWeight:         W_LLM,
    threatIntelWeight: W_THREAT_INTEL,
    breakdown: {
      mlScore: Math.round(mlScore),
      llmScore: Math.round(llmScore),
      threatIntelScore: Math.round(tiScore),
    },
    topIndicators,
    attackCategory,
    recommendation: buildRecommendation(tier, attackCategory),
  };
}
