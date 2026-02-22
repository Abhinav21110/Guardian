/**
 * Threat Intelligence Service
 * Integrates external threat feeds and reputation databases
 * Weight: 20% of final risk score
 */

export interface ThreatIntelResult {
  threatScore: number; // 0-100
  isMalicious: boolean;
  sources: ThreatSource[];
  reputation: {
    virusTotal?: VirusTotalResult;
    safeBrowsing?: SafeBrowsingResult;
    whois?: WhoisResult;
    ipGeo?: IPGeoResult;
  };
  explanation: string[];
}

export interface ThreatSource {
  name: string;
  verdict: 'safe' | 'suspicious' | 'malicious' | 'unknown';
  details?: string;
}

export interface VirusTotalResult {
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
  communityScore?: number;
}

export interface SafeBrowsingResult {
  threatType: string | null;
  platformType: string | null;
  isSafe: boolean;
}

export interface WhoisResult {
  domainAge: number | null; // days
  registrar: string | null;
  createdDate: Date | null;
  updatedDate: Date | null;
  isNewDomain: boolean;
}

export interface IPGeoResult {
  country: string | null;
  city: string | null;
  isp: string | null;
  asn: string | null;
  isProxy: boolean;
  isDataCenter: boolean;
}

export class ThreatIntelligenceService {
  private virusTotalApiKey: string | null = null;
  private safeBrowsingApiKey: string | null = null;

  constructor(config?: { virusTotalKey?: string; safeBrowsingKey?: string }) {
    this.virusTotalApiKey = config?.virusTotalKey || process.env.VIRUSTOTAL_API_KEY || null;
    this.safeBrowsingApiKey = config?.safeBrowsingKey || process.env.SAFE_BROWSING_API_KEY || null;
  }

  /**
   * Perform comprehensive threat intelligence lookup
   */
  async analyzeThreat(url: string): Promise<ThreatIntelResult> {
    const sources: ThreatSource[] = [];
    const reputation: ThreatIntelResult['reputation'] = {};

    try {
      // VirusTotal lookup
      if (this.virusTotalApiKey) {
        const vtResult = await this.checkVirusTotal(url);
        reputation.virusTotal = vtResult;
        sources.push({
          name: 'VirusTotal',
          verdict: this.getVirusTotalVerdict(vtResult),
          details: `${vtResult.malicious}/${vtResult.malicious + vtResult.harmless} engines flagged as malicious`
        });
      }

      // Google Safe Browsing lookup
      if (this.safeBrowsingApiKey) {
        const sbResult = await this.checkSafeBrowsing(url);
        reputation.safeBrowsing = sbResult;
        sources.push({
          name: 'Google Safe Browsing',
          verdict: sbResult.isSafe ? 'safe' : 'malicious',
          details: sbResult.threatType || 'No threats detected'
        });
      }

      // WHOIS lookup
      const whoisResult = await this.checkWhois(url);
      reputation.whois = whoisResult;
      if (whoisResult.domainAge !== null) {
        sources.push({
          name: 'WHOIS',
          verdict: whoisResult.isNewDomain ? 'suspicious' : 'safe',
          details: `Domain age: ${whoisResult.domainAge} days`
        });
      }

      // IP Geolocation
      const ipGeoResult = await this.checkIPGeo(url);
      reputation.ipGeo = ipGeoResult;
      if (ipGeoResult.country) {
        sources.push({
          name: 'IP Geolocation',
          verdict: (ipGeoResult.isProxy || ipGeoResult.isDataCenter) ? 'suspicious' : 'safe',
          details: `${ipGeoResult.country} - ${ipGeoResult.isp || 'Unknown ISP'}`
        });
      }

    } catch (error) {
      console.error('Threat intelligence lookup error:', error);
    }

    const threatScore = this.calculateThreatScore(sources, reputation);
    const isMalicious = threatScore > 70;
    const explanation = this.generateExplanation(sources, reputation);

    return {
      threatScore,
      isMalicious,
      sources,
      reputation,
      explanation
    };
  }

  /**
   * Check VirusTotal for URL reputation
   */
  private async checkVirusTotal(url: string): Promise<VirusTotalResult> {
    // TODO: Implement actual VirusTotal API call
    // For now, return mock data
    return {
      malicious: 0,
      suspicious: 0,
      harmless: 65,
      undetected: 10,
      communityScore: 0
    };
  }

  /**
   * Check Google Safe Browsing
   */
  private async checkSafeBrowsing(url: string): Promise<SafeBrowsingResult> {
    // TODO: Implement actual Safe Browsing API call
    return {
      threatType: null,
      platformType: null,
      isSafe: true
    };
  }

  /**
   * Perform WHOIS lookup
   */
  private async checkWhois(url: string): Promise<WhoisResult> {
    // TODO: Implement actual WHOIS lookup
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // Mock data for now
    return {
      domainAge: null,
      registrar: null,
      createdDate: null,
      updatedDate: null,
      isNewDomain: false
    };
  }

  /**
   * Check IP geolocation and reputation
   */
  private async checkIPGeo(url: string): Promise<IPGeoResult> {
    // TODO: Implement actual IP geolocation lookup
    return {
      country: null,
      city: null,
      isp: null,
      asn: null,
      isProxy: false,
      isDataCenter: false
    };
  }

  /**
   * Get verdict from VirusTotal results
   */
  private getVirusTotalVerdict(result: VirusTotalResult): 'safe' | 'suspicious' | 'malicious' {
    if (result.malicious > 5) return 'malicious';
    if (result.malicious > 0 || result.suspicious > 3) return 'suspicious';
    return 'safe';
  }

  /**
   * Calculate overall threat score
   */
  private calculateThreatScore(sources: ThreatSource[], reputation: ThreatIntelResult['reputation']): number {
    let score = 0;

    // VirusTotal scoring
    if (reputation.virusTotal) {
      const vt = reputation.virusTotal;
      const maliciousRatio = vt.malicious / (vt.malicious + vt.harmless + vt.undetected);
      score += maliciousRatio * 60;
      
      if (vt.suspicious > 0) {
        score += Math.min(vt.suspicious * 5, 20);
      }
    }

    // Safe Browsing scoring
    if (reputation.safeBrowsing && !reputation.safeBrowsing.isSafe) {
      score += 40;
    }

    // WHOIS scoring (new domains are riskier)
    if (reputation.whois?.isNewDomain) {
      score += 15;
    }

    // IP Geo scoring
    if (reputation.ipGeo) {
      if (reputation.ipGeo.isProxy) score += 10;
      if (reputation.ipGeo.isDataCenter) score += 10;
    }

    return Math.min(Math.round(score), 100);
  }

  /**
   * Generate human-readable explanation
   */
  private generateExplanation(sources: ThreatSource[], reputation: ThreatIntelResult['reputation']): string[] {
    const explanations: string[] = [];

    for (const source of sources) {
      const emoji = source.verdict === 'malicious' ? '🔴' : 
                    source.verdict === 'suspicious' ? '🟠' : 
                    source.verdict === 'safe' ? '🟢' : '⚪';
      
      explanations.push(`${emoji} ${source.name}: ${source.details || source.verdict}`);
    }

    // Add specific warnings
    if (reputation.virusTotal && reputation.virusTotal.malicious > 0) {
      explanations.push(`⚠️ ${reputation.virusTotal.malicious} security vendors flagged as malicious`);
    }

    if (reputation.whois?.isNewDomain) {
      explanations.push('⚠️ Domain registered recently (higher risk)');
    }

    if (reputation.ipGeo?.isProxy) {
      explanations.push('⚠️ Hosted behind proxy/VPN service');
    }

    if (explanations.length === 0) {
      explanations.push('✅ No threat intelligence sources flagged this URL');
    }

    return explanations;
  }
}
