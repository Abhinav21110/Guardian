// ─────────────────────────────────────────────────────────────────────────────
// Guardian AI – Email Analysis Service
// ─────────────────────────────────────────────────────────────────────────────
import type {
  EmailAnalysisRequest,
  EmailAnalysisResult,
  ScanResult,
} from '../types/index';
import { analyseUrl } from './ml-analyzer.js';
import { analyseSemantically } from './llm-analyzer.js';
import { gatherThreatIntel } from './threat-intelligence.js';
import { fuseRiskScores } from './risk-fusion.js';
import { logger } from '../config/logger';
import crypto from 'node:crypto';

// ─── URL extraction ───────────────────────────────────────────────────────────

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^\[\]`]+/gi;

function extractUrls(text: string): string[] {
  const matches = text.match(URL_REGEX) ?? [];
  return [...new Set(matches.map(u => u.replace(/[.,;!?)]+$/, '')))].slice(0, 20);
}

// ─── Spoofing indicators ──────────────────────────────────────────────────────

function detectSpoofingIndicators(sender: string, body: string, subject: string): string[] {
  const indicators: string[] = [];

  // Reply-to mismatch (basic heuristic on raw text)
  if (body.toLowerCase().includes('reply to') && !body.toLowerCase().includes(sender.split('@')[1] ?? '')) {
    indicators.push('Reply-To address mismatch detected');
  }

  // Urgent subject lines
  const urgentWords = ['urgent', 'action required', 'immediate', 'suspended', 'verify now', 'limited time', 'alert'];
  if (urgentWords.some(w => subject.toLowerCase().includes(w))) {
    indicators.push('Urgency cue in subject line');
  }

  // Credential request in body
  const credentialPatterns = [/enter.+password/i, /confirm.+credential/i, /provide.+account.+detail/i, /click.+here.+login/i, /verify.+identity/i];
  if (credentialPatterns.some(p => p.test(body))) {
    indicators.push('Credential request language detected in body');
  }

  // Generic greetings
  if (/dear (customer|user|member|account ?holder|valued)/i.test(body)) {
    indicators.push('Generic/impersonal greeting (not addressed by name)');
  }

  // Suspicious sender domains
  const freeProviders = ['gmail', 'yahoo', 'hotmail', 'outlook', 'proton'];
  const senderDomain = sender.split('@')[1]?.toLowerCase() ?? '';
  const WELL_KNOWN = ['paypal', 'amazon', 'apple', 'microsoft', 'google', 'netflix', 'bank', 'chase', 'wellsfargo'];
  if (WELL_KNOWN.some(b => body.toLowerCase().includes(b)) &&
      freeProviders.some(fp => senderDomain.includes(fp))) {
    indicators.push('Impersonation: brand name in body but email from free provider');
  }

  // Multiple exclamation marks
  if ((body.match(/!/g) ?? []).length > 5) {
    indicators.push('Excessive exclamation marks (urgency manipulation)');
  }

  return indicators;
}

// ─── Header anomaly detection ──────────────────────────────────────────────────

function detectHeaderAnomalies(sender: string): string[] {
  const anomalies: string[] = [];
  if (!sender.includes('@')) anomalies.push('Invalid sender format');
  // Check for display-name tricks like "PayPal <evil@attacker.com>"
  const match = sender.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) {
    const displayName = match[1].toLowerCase().replace(/["']/g, '');
    const actualEmail = match[2].toLowerCase();
    const knownBrands = ['paypal', 'amazon', 'apple', 'google', 'microsoft', 'netflix', 'facebook'];
    if (knownBrands.some(b => displayName.includes(b)) && !actualEmail.includes(displayName.split(' ')[0] ?? '')) {
      anomalies.push(`Display name "${match[1]}" does not match actual sending domain`);
    }
  }
  return anomalies;
}

// ─── Core email scan ──────────────────────────────────────────────────────────

export async function analyseEmail(req: EmailAnalysisRequest): Promise<EmailAnalysisResult> {
  const t0 = Date.now();
  const scanId = crypto.randomUUID();
  const fullText = `Subject: ${req.subject}\nFrom: ${req.sender}\n\n${req.body}`;

  logger.info({ scanId, sender: req.sender, subject: req.subject.slice(0, 80) }, 'Email analysis start');

  const extractedUrls = req.extractedUrls?.length
    ? req.extractedUrls
    : extractUrls(req.body);

  const spoofingIndicators = detectSpoofingIndicators(req.sender, req.body, req.subject);
  const headerAnomalies    = detectHeaderAnomalies(req.sender);

  // LLM analysis of full email
  const [llm] = await Promise.all([
    analyseSemantically(fullText, 'EMAIL'),
  ]);

  // Fuse email-level (no ML/TI for raw text)
  const emailFusion = fuseRiskScores(null, llm, null);

  // Scan each extracted URL (cap at 5 to stay within rate limits)
  const urlResults: ScanResult[] = await Promise.all(
    extractedUrls.slice(0, 5).map(async (url): Promise<ScanResult> => {
      const urlScanId = crypto.randomUUID();
      const urlT0 = Date.now();
      try {
        const [ml, tiLlm, ti] = await Promise.all([
          analyseUrl(url),
          analyseSemantically(url, 'URL'),
          gatherThreatIntel(url),
        ]);
        const fusion = fuseRiskScores(ml, tiLlm, ti);
        return {
          scanId: urlScanId,
          input: url,
          inputType: 'URL',
          timestamp: new Date().toISOString(),
          ml,
          llm: tiLlm,
          threatIntel: ti,
          fusion,
          anchored: false,
          processingMs: Date.now() - urlT0,
        };
      } catch (err) {
        logger.warn({ err, url }, 'URL sub-scan failed');
        const fusion = fuseRiskScores(null, null, null);
        return {
          scanId: urlScanId,
          input: url,
          inputType: 'URL',
          timestamp: new Date().toISOString(),
          ml: null,
          llm: null,
          threatIntel: null,
          fusion,
          anchored: false,
          processingMs: Date.now() - urlT0,
        };
      }
    }),
  );

  // Lift overall email fusion if any URL came back high-risk
  const maxUrlScore = urlResults.reduce((m, r) => Math.max(m, r.fusion.unifiedRiskScore), 0);
  if (maxUrlScore > emailFusion.unifiedRiskScore) {
    emailFusion.unifiedRiskScore = Math.round((emailFusion.unifiedRiskScore + maxUrlScore) / 2);
    if (maxUrlScore >= 80 && emailFusion.unifiedRiskScore < 70) emailFusion.unifiedRiskScore = 70;
  }

  const result: EmailAnalysisResult = {
    scanId,
    input: fullText.slice(0, 500),
    inputType: 'EMAIL',
    timestamp: new Date().toISOString(),
    ml: null,
    llm,
    threatIntel: null,
    fusion: emailFusion,
    anchored: false,
    processingMs: Date.now() - t0,
    emailMetadata: {
      subject: req.subject,
      sender: req.sender,
      extractedUrls,
      attachmentCount: req.attachments?.length ?? 0,
      spoofingIndicators,
      headerAnomalies,
    },
    urlResults,
  };

  logger.info({ scanId, riskScore: emailFusion.unifiedRiskScore, tier: emailFusion.tier }, 'Email analysis done');
  return result;
}
