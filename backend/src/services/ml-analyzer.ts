/**
 * ML Analyzer Service
 * Machine Learning-based phishing detection using URL features
 * Weight: 40% of final risk score
 */

export interface MLAnalysisResult {
  mlRiskScore: number; // 0-100
  phishingProbability: number; // 0-1
  features: {
    urlLength: number;
    suspiciousChars: number;
    subdomainCount: number;
    isIPBased: boolean;
    entropy: number;
    suspiciousTLD: boolean;
    hasHttps: boolean;
    sslValid: boolean;
    domainAge: number | null;
  };
  featureImportance: Record<string, number>;
  explanation: string[];
}

export class MLAnalyzerService {
  private suspiciousTLDs = [
    '.xyz', '.top', '.click', '.loan', '.work', '.gq', 
    '.ml', '.ga', '.cf', '.tk', '.pw', '.cc'
  ];

  /**
   * Analyze URL using ML-based feature extraction
   */
  async analyzeURL(url: string): Promise<MLAnalysisResult> {
    const features = this.extractFeatures(url);
    const phishingProbability = this.calculateProbability(features);
    const mlRiskScore = Math.round(phishingProbability * 100);
    const featureImportance = this.calculateFeatureImportance(features);
    const explanation = this.generateExplanation(features, featureImportance);

    return {
      mlRiskScore,
      phishingProbability,
      features,
      featureImportance,
      explanation
    };
  }

  /**
   * Extract ML features from URL
   */
  private extractFeatures(url: string) {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const path = urlObj.pathname;

    return {
      urlLength: url.length,
      suspiciousChars: this.countSuspiciousChars(url),
      subdomainCount: this.countSubdomains(hostname),
      isIPBased: this.isIPAddress(hostname),
      entropy: this.calculateEntropy(hostname),
      suspiciousTLD: this.hasSuspiciousTLD(hostname),
      hasHttps: urlObj.protocol === 'https:',
      sslValid: true, // To be implemented with actual SSL check
      domainAge: null // To be implemented with WHOIS lookup
    };
  }

  /**
   * Count suspicious characters in URL
   */
  private countSuspiciousChars(url: string): number {
    const suspiciousPatterns = [/@/, /--/, /\/\/.*\/\//, /_/];
    return suspiciousPatterns.reduce((count, pattern) => {
      return count + (url.match(pattern)?.length || 0);
    }, 0);
  }

  /**
   * Count number of subdomains
   */
  private countSubdomains(hostname: string): number {
    const parts = hostname.split('.');
    return Math.max(0, parts.length - 2);
  }

  /**
   * Check if hostname is an IP address
   */
  private isIPAddress(hostname: string): boolean {
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    return ipv4Pattern.test(hostname);
  }

  /**
   * Calculate Shannon entropy of hostname
   */
  private calculateEntropy(str: string): number {
    const len = str.length;
    const frequencies: Record<string, number> = {};
    
    for (const char of str) {
      frequencies[char] = (frequencies[char] || 0) + 1;
    }
    
    return Object.values(frequencies).reduce((entropy, freq) => {
      const p = freq / len;
      return entropy - p * Math.log2(p);
    }, 0);
  }

  /**
   * Check for suspicious TLD
   */
  private hasSuspiciousTLD(hostname: string): boolean {
    return this.suspiciousTLDs.some(tld => hostname.endsWith(tld));
  }

  /**
   * Calculate phishing probability from features
   */
  private calculateProbability(features: any): number {
    let score = 0;
    
    // URL length scoring
    if (features.urlLength > 75) score += 0.15;
    else if (features.urlLength > 54) score += 0.10;
    
    // Suspicious characters
    score += Math.min(features.suspiciousChars * 0.10, 0.20);
    
    // Subdomain count
    if (features.subdomainCount > 3) score += 0.15;
    else if (features.subdomainCount > 1) score += 0.10;
    
    // IP-based URL
    if (features.isIPBased) score += 0.25;
    
    // Entropy (higher entropy = more random = suspicious)
    if (features.entropy > 4.5) score += 0.15;
    
    // Suspicious TLD
    if (features.suspiciousTLD) score += 0.20;
    
    // No HTTPS
    if (!features.hasHttps) score += 0.10;
    
    return Math.min(score, 1.0);
  }

  /**
   * Calculate feature importance scores
   */
  private calculateFeatureImportance(features: any): Record<string, number> {
    return {
      urlLength: features.urlLength > 54 ? 0.15 : 0.05,
      suspiciousChars: features.suspiciousChars > 0 ? 0.20 : 0.0,
      subdomainCount: features.subdomainCount > 1 ? 0.15 : 0.05,
      isIPBased: features.isIPBased ? 0.25 : 0.0,
      entropy: features.entropy > 4.5 ? 0.15 : 0.05,
      suspiciousTLD: features.suspiciousTLD ? 0.20 : 0.0,
      hasHttps: features.hasHttps ? 0.0 : 0.10
    };
  }

  /**
   * Generate human-readable explanation
   */
  private generateExplanation(features: any, importance: Record<string, number>): string[] {
    const explanations: string[] = [];

    if (features.urlLength > 75) {
      explanations.push('⚠️ Extremely long URL detected (common in phishing)');
    } else if (features.urlLength > 54) {
      explanations.push('⚠️ Unusually long URL');
    }

    if (features.suspiciousChars > 0) {
      explanations.push(`🔍 ${features.suspiciousChars} suspicious character pattern(s) found`);
    }

    if (features.subdomainCount > 3) {
      explanations.push('⚠️ Excessive subdomain usage detected');
    }

    if (features.isIPBased) {
      explanations.push('🚨 IP-based URL instead of domain name (major red flag)');
    }

    if (features.entropy > 4.5) {
      explanations.push('🔍 High entropy detected (randomized/obfuscated domain)');
    }

    if (features.suspiciousTLD) {
      explanations.push('⚠️ Domain uses suspicious top-level domain (TLD)');
    }

    if (!features.hasHttps) {
      explanations.push('⚠️ No HTTPS encryption detected');
    }

    if (explanations.length === 0) {
      explanations.push('✅ URL structure appears normal');
    }

    return explanations;
  }
}
