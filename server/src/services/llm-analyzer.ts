// ─────────────────────────────────────────────────────────────────────────────
// Guardian AI – LLM-based Semantic Risk Analyser (OpenAI)
// ─────────────────────────────────────────────────────────────────────────────
import OpenAI from 'openai';
import type { LlmAnalysisResult, AttackCategory } from '../types/index';
import { config } from '../config/env';
import { logger } from '../config/logger';

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    if (!config.api.openAiKey) throw new Error('OPENAI_API_KEY not configured');
    _client = new OpenAI({ apiKey: config.api.openAiKey, timeout: 20_000, maxRetries: 2 });
  }
  return _client;
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Guardian AI's semantic security analysis engine.
Your task is to analyse a URL, email content, or text snippet for phishing, social engineering, and cyber-attack indicators.

You MUST respond ONLY with a valid JSON object (no markdown, no explanation outside JSON) in exactly this shape:
{
  "semanticRiskScore": <number 0-100>,
  "attackCategory": <one of: NONE|PHISHING|CREDENTIAL_HARVESTING|URGENCY_MANIPULATION|AUTHORITY_IMPERSONATION|BRAND_IMPERSONATION|REWARD_BAITING|FEAR_COERCION|MALWARE_DISTRIBUTION|SOCIAL_ENGINEERING|UNKNOWN>,
  "confidence": <number 0.0-1.0>,
  "reasoning": "<concise 1-3 sentence explanation>",
  "indicators": ["<indicator 1>", ...],
  "urgencyLevel": <"NONE"|"LOW"|"MEDIUM"|"HIGH">,
  "brandsMentioned": ["<brand>", ...],
  "credentialHarvestingDetected": <true|false>
}

Scoring guidelines:
- 0-20:  Safe, no indicators
- 21-40: Low risk, minor concerns
- 41-60: Suspicious, notable indicators
- 61-80: High risk, clear attack patterns
- 81-100: Confirmed phishing / malicious

Focus on: urgency language, authority claims, fear tactics, reward promises, credential requests, brand impersonation, suspicious links, fake login patterns, grammar errors combined with urgency, mismatch between display and actual domain.`;

// ─── Analyser ─────────────────────────────────────────────────────────────────

export async function analyseSemantically(
  content: string,
  context: 'URL' | 'EMAIL' | 'TEXT' = 'URL',
): Promise<LlmAnalysisResult> {
  const t0 = Date.now();
  logger.debug({ contentLength: content.length, context }, 'LLM analysis start');

  if (!config.api.openAiKey || !config.features.llm) {
    return buildFallback(content, t0);
  }

  const userMessage = `[Context: ${context}]\n\nContent to analyse:\n${content.slice(0, 3000)}`;

  try {
    const client = getClient();
    const response = await client.chat.completions.create({
      model: config.api.openAiModel,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: userMessage },
      ],
      temperature: 0.1,
      max_tokens: 600,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw) as Partial<LlmAnalysisResult>;

    const result: LlmAnalysisResult = {
      semanticRiskScore: clamp(Number(parsed.semanticRiskScore ?? 0), 0, 100),
      attackCategory: validateCategory(parsed.attackCategory),
      confidence: clamp(Number(parsed.confidence ?? 0.5), 0, 1),
      reasoning: String(parsed.reasoning ?? 'No reasoning provided'),
      indicators: Array.isArray(parsed.indicators) ? parsed.indicators.map(String) : [],
      urgencyLevel: validateUrgency(parsed.urgencyLevel),
      brandsMentioned: Array.isArray(parsed.brandsMentioned) ? parsed.brandsMentioned.map(String) : [],
      credentialHarvestingDetected: Boolean(parsed.credentialHarvestingDetected),
      processingMs: Date.now() - t0,
      modelUsed: config.api.openAiModel,
    };

    logger.debug({ riskScore: result.semanticRiskScore, category: result.attackCategory }, 'LLM analysis done');
    return result;

  } catch (err) {
    logger.error({ err }, 'LLM analysis failed – returning fallback');
    return buildFallback(content, t0);
  }
}

// ─── Fallback (no LLM configured) ────────────────────────────────────────────

function buildFallback(_content: string, t0: number): LlmAnalysisResult {
  return {
    semanticRiskScore: 0,
    attackCategory: 'UNKNOWN',
    confidence: 0,
    reasoning: 'LLM analysis unavailable – OpenAI API key not configured.',
    indicators: [],
    urgencyLevel: 'NONE',
    brandsMentioned: [],
    credentialHarvestingDetected: false,
    processingMs: Date.now() - t0,
    modelUsed: 'none',
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

const VALID_CATEGORIES = new Set<AttackCategory>([
  'NONE', 'PHISHING', 'CREDENTIAL_HARVESTING', 'URGENCY_MANIPULATION',
  'AUTHORITY_IMPERSONATION', 'BRAND_IMPERSONATION', 'REWARD_BAITING',
  'FEAR_COERCION', 'MALWARE_DISTRIBUTION', 'SOCIAL_ENGINEERING', 'UNKNOWN',
]);

function validateCategory(v: unknown): AttackCategory {
  if (typeof v === 'string' && VALID_CATEGORIES.has(v as AttackCategory)) return v as AttackCategory;
  return 'UNKNOWN';
}

function validateUrgency(v: unknown): LlmAnalysisResult['urgencyLevel'] {
  if (v === 'NONE' || v === 'LOW' || v === 'MEDIUM' || v === 'HIGH') return v;
  return 'NONE';
}
