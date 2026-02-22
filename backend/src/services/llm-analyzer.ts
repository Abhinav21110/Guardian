/**
 * LLM Semantic Intelligence Service
 * Detects social engineering and phishing through semantic analysis
 * Weight: 30% of final risk score
 */

export interface LLMAnalysisResult {
  semanticRiskScore: number; // 0-100
  attackType: AttackType | null;
  detectedPatterns: DetectionPattern[];
  explanation: string;
  confidence: number; // 0-1
}

export enum AttackType {
  URGENCY_MANIPULATION = 'urgency_manipulation',
  AUTHORITY_IMPERSONATION = 'authority_impersonation',
  FEAR_BASED_COERCION = 'fear_based_coercion',
  REWARD_BAITING = 'reward_baiting',
  CREDENTIAL_HARVESTING = 'credential_harvesting',
  BRAND_IMPERSONATION = 'brand_impersonation',
  NONE = 'none'
}

export interface DetectionPattern {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  matchedContent?: string;
}

export class LLMAnalyzerService {
  private urgencyKeywords = [
    'urgent', 'immediately', 'asap', 'expire', 'limited time',
    'act now', 'deadline', 'hurry', 'last chance', 'within 24 hours'
  ];

  private authorityKeywords = [
    'verify your account', 'confirm your identity', 'suspended',
    'security alert', 'unusual activity', 'locked', 'verify now'
  ];

  private fearKeywords = [
    'suspended', 'locked', 'terminated', 'compromised', 
    'unauthorized', 'illegal', 'fraud', 'banned'
  ];

  private rewardKeywords = [
    'prize', 'winner', 'congratulations', 'free', 'gift',
    'claim', 'reward', '$$$', 'bonus', 'offer'
  ];

  private credentialKeywords = [
    'login', 'password', 'username', 'sign in', 'verify account',
    'update payment', 'confirm details', 'enter your'
  ];

  private trustedBrands = [
    'paypal', 'amazon', 'microsoft', 'google', 'apple', 'facebook',
    'netflix', 'bank', 'irs', 'fedex', 'ups', 'dhl'
  ];

  /**
   * Analyze email or webpage content for social engineering
   */
  async analyzeContent(content: string, subject?: string): Promise<LLMAnalysisResult> {
    const fullText = subject ? `${subject} ${content}` : content;
    const normalizedText = fullText.toLowerCase();

    const patterns = this.detectPatterns(normalizedText);
    const attackType = this.classifyAttackType(patterns);
    const semanticRiskScore = this.calculateSemanticRisk(patterns);
    const confidence = this.calculateConfidence(patterns);
    const explanation = this.generateExplanation(patterns, attackType);

    return {
      semanticRiskScore,
      attackType,
      detectedPatterns: patterns,
      explanation,
      confidence
    };
  }

  /**
   * Analyze screenshot OCR text for fake login pages
   */
  async analyzeScreenshot(ocrText: string, url: string): Promise<LLMAnalysisResult> {
    const normalizedText = ocrText.toLowerCase();
    const normalizedUrl = url.toLowerCase();

    const patterns: DetectionPattern[] = [];

    // Check for login page indicators
    if (this.hasLoginIndicators(normalizedText)) {
      patterns.push({
        type: 'login_page_detected',
        severity: 'high',
        description: 'Login form detected on page'
      });
    }

    // Check for brand cloning
    const clonedBrand = this.detectBrandCloning(normalizedText, normalizedUrl);
    if (clonedBrand) {
      patterns.push({
        type: 'brand_cloning',
        severity: 'critical',
        description: `Impersonating ${clonedBrand}`,
        matchedContent: clonedBrand
      });
    }

    // Check for suspicious form prompts
    if (this.hasSuspiciousFormPrompts(normalizedText)) {
      patterns.push({
        type: 'suspicious_form',
        severity: 'high',
        description: 'Requesting sensitive information'
      });
    }

    const attackType = patterns.length > 0 ? AttackType.CREDENTIAL_HARVESTING : AttackType.NONE;
    const semanticRiskScore = this.calculateSemanticRisk(patterns);
    const confidence = this.calculateConfidence(patterns);
    const explanation = this.generateExplanation(patterns, attackType);

    return {
      semanticRiskScore,
      attackType,
      detectedPatterns: patterns,
      explanation,
      confidence
    };
  }

  /**
   * Detect social engineering patterns in text
   */
  private detectPatterns(text: string): DetectionPattern[] {
    const patterns: DetectionPattern[] = [];

    // Urgency detection
    const urgencyMatches = this.urgencyKeywords.filter(kw => text.includes(kw));
    if (urgencyMatches.length > 0) {
      patterns.push({
        type: 'urgency_manipulation',
        severity: urgencyMatches.length > 2 ? 'high' : 'medium',
        description: 'Urgency tactics detected to pressure immediate action',
        matchedContent: urgencyMatches.join(', ')
      });
    }

    // Authority impersonation
    const authorityMatches = this.authorityKeywords.filter(kw => text.includes(kw));
    if (authorityMatches.length > 0) {
      patterns.push({
        type: 'authority_impersonation',
        severity: 'high',
        description: 'Attempting to impersonate authority or official entity',
        matchedContent: authorityMatches.join(', ')
      });
    }

    // Fear-based coercion
    const fearMatches = this.fearKeywords.filter(kw => text.includes(kw));
    if (fearMatches.length > 0) {
      patterns.push({
        type: 'fear_based_coercion',
        severity: fearMatches.length > 2 ? 'critical' : 'high',
        description: 'Using fear tactics to manipulate user behavior',
        matchedContent: fearMatches.join(', ')
      });
    }

    // Reward baiting
    const rewardMatches = this.rewardKeywords.filter(kw => text.includes(kw));
    if (rewardMatches.length > 1) {
      patterns.push({
        type: 'reward_baiting',
        severity: 'medium',
        description: 'Offering unrealistic rewards or prizes',
        matchedContent: rewardMatches.join(', ')
      });
    }

    // Credential harvesting
    const credentialMatches = this.credentialKeywords.filter(kw => text.includes(kw));
    if (credentialMatches.length > 0) {
      patterns.push({
        type: 'credential_harvesting',
        severity: 'critical',
        description: 'Requesting login credentials or sensitive information',
        matchedContent: credentialMatches.join(', ')
      });
    }

    // Brand impersonation
    const brandMatch = this.trustedBrands.find(brand => text.includes(brand));
    if (brandMatch && (urgencyMatches.length > 0 || fearMatches.length > 0)) {
      patterns.push({
        type: 'brand_impersonation',
        severity: 'critical',
        description: `Impersonating trusted brand: ${brandMatch}`,
        matchedContent: brandMatch
      });
    }

    return patterns;
  }

  /**
   * Classify primary attack type
   */
  private classifyAttackType(patterns: DetectionPattern[]): AttackType {
    if (patterns.length === 0) return AttackType.NONE;

    // Priority order for classification
    const typeMap: Record<string, AttackType> = {
      brand_impersonation: AttackType.BRAND_IMPERSONATION,
      credential_harvesting: AttackType.CREDENTIAL_HARVESTING,
      fear_based_coercion: AttackType.FEAR_BASED_COERCION,
      authority_impersonation: AttackType.AUTHORITY_IMPERSONATION,
      urgency_manipulation: AttackType.URGENCY_MANIPULATION,
      reward_baiting: AttackType.REWARD_BAITING
    };

    for (const [patternType, attackType] of Object.entries(typeMap)) {
      if (patterns.some(p => p.type === patternType)) {
        return attackType;
      }
    }

    return AttackType.NONE;
  }

  /**
   * Calculate semantic risk score
   */
  private calculateSemanticRisk(patterns: DetectionPattern[]): number {
    const severityWeights = {
      low: 15,
      medium: 30,
      high: 60,
      critical: 90
    };

    if (patterns.length === 0) return 0;

    const maxScore = Math.max(...patterns.map(p => severityWeights[p.severity]));
    const combinedBonus = Math.min(patterns.length * 5, 25);

    return Math.min(maxScore + combinedBonus, 100);
  }

  /**
   * Calculate confidence level
   */
  private calculateConfidence(patterns: DetectionPattern[]): number {
    const criticalCount = patterns.filter(p => p.severity === 'critical').length;
    const highCount = patterns.filter(p => p.severity === 'high').length;

    if (criticalCount > 0) return 0.9 + (criticalCount * 0.05);
    if (highCount > 1) return 0.8;
    if (patterns.length > 0) return 0.6;

    return 0.3;
  }

  /**
   * Generate human-readable explanation
   */
  private generateExplanation(patterns: DetectionPattern[], attackType: AttackType): string {
    if (patterns.length === 0) {
      return '✅ No social engineering patterns detected. Content appears legitimate.';
    }

    const explanationParts: string[] = [
      `🚨 Detected ${attackType.replace(/_/g, ' ').toUpperCase()} attack pattern.`,
      '',
      'Suspicious indicators found:'
    ];

    patterns.forEach((pattern, idx) => {
      const emoji = pattern.severity === 'critical' ? '🔴' : 
                    pattern.severity === 'high' ? '🟠' : 
                    pattern.severity === 'medium' ? '🟡' : '🟢';
      explanationParts.push(`${idx + 1}. ${emoji} ${pattern.description}`);
      if (pattern.matchedContent) {
        explanationParts.push(`   Keywords: "${pattern.matchedContent}"`);
      }
    });

    return explanationParts.join('\n');
  }

  /**
   * Check for login page indicators
   */
  private hasLoginIndicators(text: string): boolean {
    const loginIndicators = ['username', 'password', 'sign in', 'log in', 'email', 'login'];
    return loginIndicators.filter(indicator => text.includes(indicator)).length >= 2;
  }

  /**
   * Detect brand cloning
   */
  private detectBrandCloning(text: string, url: string): string | null {
    for (const brand of this.trustedBrands) {
      if (text.includes(brand) && !url.includes(brand)) {
        return brand;
      }
    }
    return null;
  }

  /**
   * Check for suspicious form prompts
   */
  private hasSuspiciousFormPrompts(text: string): boolean {
    const suspiciousPrompts = [
      'social security', 'ssn', 'credit card', 'cvv', 
      'mother maiden name', 'date of birth', 'full name'
    ];
    return suspiciousPrompts.some(prompt => text.includes(prompt));
  }
}
