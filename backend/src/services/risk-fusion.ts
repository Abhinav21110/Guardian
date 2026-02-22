/**
 * Risk Fusion Engine
 * Combines ML, LLM, and Threat Intelligence into unified risk score
 */

import { MLAnalysisResult } from './ml-analyzer';
import { LLMAnalysisResult } from './llm-analyzer';
import { ThreatIntelResult } from './threat-intelligence';

export interface UnifiedRiskAssessment {
  finalRiskScore: number; // 0-100
  classification: RiskClassification;
  confidence: number; // 0-100
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
  components: {
    ml?: MLAnalysisResult;
    llm?: LLMAnalysisResult;
    threat?: ThreatIntelResult;
  };
  explanation: {
    summary: string;
    mlExplanation: string[];
    llmExplanation: string;
    threatExplanation: string[];
  };
  timestamp: Date;
}

export enum RiskClassification {
  SAFE = 'safe',
  SUSPICIOUS = 'suspicious',
  HIGH_RISK = 'high_risk',
  CONFIRMED_PHISHING = 'confirmed_phishing'
}

export class RiskFusionEngine {
  // Configurable weights (must sum to 100)
  private weights = {
    ml: 40,
    llm: 30,
    threat: 20,
    domainAge: 10
  };

  /**
   * Fuse multiple detection sources into unified risk assessment
   */
  async fuseRiskScores(
    mlResult?: MLAnalysisResult,
    llmResult?: LLMAnalysisResult,
    threatResult?: ThreatIntelResult
  ): Promise<UnifiedRiskAssessment> {
    
    // Calculate weighted score
    let finalRiskScore = 0;
    const breakdown = {
      mlScore: mlResult?.mlRiskScore || 0,
      mlWeight: this.weights.ml,
      llmScore: llmResult?.semanticRiskScore || 0,
      llmWeight: this.weights.llm,
      threatScore: threatResult?.threatScore || 0,
      threatWeight: this.weights.threat,
      domainAgeRisk: this.calculateDomainAgeRisk(threatResult),
      domainAgeWeight: this.weights.domainAge
    };

    finalRiskScore += (breakdown.mlScore * breakdown.mlWeight) / 100;
    finalRiskScore += (breakdown.llmScore * breakdown.llmWeight) / 100;
    finalRiskScore += (breakdown.threatScore * breakdown.threatWeight) / 100;
    finalRiskScore += (breakdown.domainAgeRisk * breakdown.domainAgeWeight) / 100;

    finalRiskScore = Math.round(finalRiskScore);

    // Classify risk
    const classification = this.classifyRisk(finalRiskScore, mlResult, llmResult, threatResult);

    // Calculate confidence
    const confidence = this.calculateConfidence(mlResult, llmResult, threatResult);

    // Generate explanation
    const explanation = {
      summary: this.generateSummary(finalRiskScore, classification),
      mlExplanation: mlResult?.explanation || [],
      llmExplanation: llmResult?.explanation || 'No semantic analysis performed',
      threatExplanation: threatResult?.explanation || []
    };

    return {
      finalRiskScore,
      classification,
      confidence,
      breakdown,
      components: {
        ml: mlResult,
        llm: llmResult,
        threat: threatResult
      },
      explanation,
      timestamp: new Date()
    };
  }

  /**
   * Calculate domain age risk
   */
  private calculateDomainAgeRisk(threatResult?: ThreatIntelResult): number {
    if (!threatResult?.reputation.whois?.domainAge) {
      return 0; // No data available
    }

    const ageInDays = threatResult.reputation.whois.domainAge;

    // Risk decreases as domain ages
    if (ageInDays < 7) return 100;        // Brand new
    if (ageInDays < 30) return 80;        // Less than a month
    if (ageInDays < 90) return 60;        // Less than 3 months
    if (ageInDays < 180) return 40;       // Less than 6 months
    if (ageInDays < 365) return 20;       // Less than a year
    
    return 0; // Older than 1 year
  }

  /**
   * Classify overall risk level
   */
  private classifyRisk(
    score: number,
    mlResult?: MLAnalysisResult,
    llmResult?: LLMAnalysisResult,
    threatResult?: ThreatIntelResult
  ): RiskClassification {
    
    // Critical indicators override score-based classification
    if (threatResult?.isMalicious || 
        (mlResult && mlResult.mlRiskScore > 85) ||
        (llmResult && llmResult.semanticRiskScore > 85)) {
      return RiskClassification.CONFIRMED_PHISHING;
    }

    // Score-based classification
    if (score >= 75) return RiskClassification.CONFIRMED_PHISHING;
    if (score >= 50) return RiskClassification.HIGH_RISK;
    if (score >= 25) return RiskClassification.SUSPICIOUS;
    
    return RiskClassification.SAFE;
  }

  /**
   * Calculate overall confidence in assessment
   */
  private calculateConfidence(
    mlResult?: MLAnalysisResult,
    llmResult?: LLMAnalysisResult,
    threatResult?: ThreatIntelResult
  ): number {
    
    const confidences: number[] = [];

    // ML confidence (based on feature clarity)
    if (mlResult) {
      const featureCount = Object.values(mlResult.featureImportance)
        .filter(imp => imp > 0.1).length;
      confidences.push(Math.min(featureCount * 15, 85));
    }

    // LLM confidence
    if (llmResult) {
      confidences.push(llmResult.confidence * 100);
    }

    // Threat intel confidence
    if (threatResult) {
      const sourceCount = threatResult.sources.filter(s => s.verdict !== 'unknown').length;
      confidences.push(Math.min(sourceCount * 20, 90));
    }

    if (confidences.length === 0) return 50; // Default moderate confidence

    // Average confidence with bonus for multiple sources
    const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    const multiSourceBonus = Math.min(confidences.length * 5, 15);

    return Math.round(Math.min(avgConfidence + multiSourceBonus, 100));
  }

  /**
   * Generate summary explanation
   */
  private generateSummary(score: number, classification: RiskClassification): string {
    const classEmoji = {
      [RiskClassification.SAFE]: '✅',
      [RiskClassification.SUSPICIOUS]: '⚠️',
      [RiskClassification.HIGH_RISK]: '🔴',
      [RiskClassification.CONFIRMED_PHISHING]: '🚨'
    };

    const classDescription = {
      [RiskClassification.SAFE]: 'appears legitimate and safe to access',
      [RiskClassification.SUSPICIOUS]: 'shows some suspicious indicators - proceed with caution',
      [RiskClassification.HIGH_RISK]: 'exhibits multiple phishing characteristics - not recommended',
      [RiskClassification.CONFIRMED_PHISHING]: 'is highly likely to be a phishing attack - DO NOT ACCESS'
    };

    return `${classEmoji[classification]} Risk Score: ${score}/100 - This URL ${classDescription[classification]}.`;
  }

  /**
   * Update fusion weights dynamically
   */
  setWeights(weights: Partial<typeof this.weights>): void {
    this.weights = { ...this.weights, ...weights };
    
    // Validate weights sum to 100
    const sum = Object.values(this.weights).reduce((a, b) => a + b, 0);
    if (sum !== 100) {
      throw new Error(`Weights must sum to 100, current sum: ${sum}`);
    }
  }

  /**
   * Get current weight configuration
   */
  getWeights() {
    return { ...this.weights };
  }
}
