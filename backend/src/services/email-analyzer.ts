/**
 * Email Analyzer Service
 * Analyzes email content for phishing indicators
 */

import { LLMAnalyzerService, LLMAnalysisResult } from './llm-analyzer';

export interface EmailAnalysisRequest {
  from: string;
  to: string;
  subject: string;
  body: string;
  headers?: Record<string, string>;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  contentType: string;
  size: number;
}

export interface EmailAnalysisResult {
  overallRisk: number; // 0-100
  isPhishing: boolean;
  analysis: {
    sender: SenderAnalysis;
    content: LLMAnalysisResult;
    headers: HeaderAnalysis;
    attachments: AttachmentAnalysis;
  };
  explanation: string[];
}

export interface SenderAnalysis {
  riskScore: number;
  isSpoofed: boolean;
  domainMismatch: boolean;
  suspiciousDisplayName: boolean;
  details: string[];
}

export interface HeaderAnalysis {
  riskScore: number;
  spfPass: boolean | null;
  dkimPass: boolean | null;
  dmarcPass: boolean | null;
  suspiciousHeaders: string[];
  details: string[];
}

export interface AttachmentAnalysis {
  riskScore: number;
  suspiciousFiles: string[];
  executableDetected: boolean;
  details: string[];
}

export class EmailAnalyzerService {
  private llmAnalyzer: LLMAnalyzerService;
  private suspiciousExtensions = [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', 
    '.js', '.jar', '.app', '.deb', '.rpm'
  ];

  constructor() {
    this.llmAnalyzer = new LLMAnalyzerService();
  }

  /**
   * Analyze email for phishing indicators
   */
  async analyzeEmail(email: EmailAnalysisRequest): Promise<EmailAnalysisResult> {
    // Analyze sender
    const senderAnalysis = this.analyzeSender(email.from, email.to);

    // Analyze content using LLM
    const contentAnalysis = await this.llmAnalyzer.analyzeContent(
      email.body,
      email.subject
    );

    // Analyze headers
    const headerAnalysis = this.analyzeHeaders(email.headers || {});

    // Analyze attachments
    const attachmentAnalysis = this.analyzeAttachments(email.attachments || []);

    // Calculate overall risk
    const overallRisk = this.calculateOverallRisk(
      senderAnalysis,
      contentAnalysis,
      headerAnalysis,
      attachmentAnalysis
    );

    const isPhishing = overallRisk > 60;

    // Generate explanation
    const explanation = this.generateExplanation(
      senderAnalysis,
      contentAnalysis,
      headerAnalysis,
      attachmentAnalysis
    );

    return {
      overallRisk,
      isPhishing,
      analysis: {
        sender: senderAnalysis,
        content: contentAnalysis,
        headers: headerAnalysis,
        attachments: attachmentAnalysis
      },
      explanation
    };
  }

  /**
   * Analyze sender information
   */
  private analyzeSender(from: string, to: string): SenderAnalysis {
    const details: string[] = [];
    let riskScore = 0;
    let isSpoofed = false;
    let domainMismatch = false;
    let suspiciousDisplayName = false;

    // Extract email and display name
    const emailMatch = from.match(/<(.+?)>/);
    const email = emailMatch ? emailMatch[1] : from;
    const displayName = from.replace(/<.+?>/, '').trim();

    // Check for display name spoofing
    if (displayName && displayName.length > 0) {
      const trustedBrands = ['paypal', 'amazon', 'microsoft', 'google', 'apple', 'bank'];
      const lowerDisplayName = displayName.toLowerCase();
      
      for (const brand of trustedBrands) {
        if (lowerDisplayName.includes(brand) && !email.toLowerCase().includes(brand)) {
          suspiciousDisplayName = true;
          riskScore += 40;
          details.push(`⚠️ Display name mentions "${brand}" but email domain doesn't match`);
          break;
        }
      }
    }

    // Check for lookalike domains
    const domain = email.split('@')[1];
    if (this.isLookalikeDomain(domain)) {
      domainMismatch = true;
      riskScore += 30;
      details.push(`⚠️ Potential lookalike or typosquatting domain: ${domain}`);
    }

    // Check for free email service used for official communication
    const freeEmailProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    if (freeEmailProviders.includes(domain) && displayName.match(/(official|support|admin|security)/i)) {
      riskScore += 20;
      details.push('⚠️ Free email service used for official communication');
    }

    if (details.length === 0) {
      details.push('✅ Sender appears legitimate');
    }

    return {
      riskScore: Math.min(riskScore, 100),
      isSpoofed,
      domainMismatch,
      suspiciousDisplayName,
      details
    };
  }

  /**
   * Check for lookalike domains
   */
  private isLookalikeDomain(domain: string): boolean {
    const lookalikeDomains = [
      'paypa1', 'arnaz0n', 'micr0soft', 'g00gle', 'app1e',
      'paypai', 'amazan', 'microsaft', 'googie', 'appie'
    ];
    
    return lookalikeDomains.some(lookalike => domain.includes(lookalike));
  }

  /**
   * Analyze email headers
   */
  private analyzeHeaders(headers: Record<string, string>): HeaderAnalysis {
    const details: string[] = [];
    let riskScore = 0;
    const suspiciousHeaders: string[] = [];

    // Check SPF, DKIM, DMARC (simplified)
    const spfPass = headers['Received-SPF']?.includes('pass') || null;
    const dkimPass = headers['DKIM-Signature'] !== undefined || null;
    const dmarcPass = headers['Authentication-Results']?.includes('dmarc=pass') || null;

    if (spfPass === false) {
      riskScore += 25;
      details.push('⚠️ SPF check failed');
    }

    if (dkimPass === false) {
      riskScore += 25;
      details.push('⚠️ DKIM signature missing or invalid');
    }

    if (dmarcPass === false) {
      riskScore += 20;
      details.push('⚠️ DMARC check failed');
    }

    // Check for suspicious headers
    if (headers['X-Mailer']?.includes('bulk') || headers['X-Mailer']?.includes('mass')) {
      suspiciousHeaders.push('X-Mailer');
      riskScore += 10;
      details.push('⚠️ Bulk/mass mailer detected');
    }

    if (details.length === 0) {
      details.push('✅ Email headers appear normal');
    }

    return {
      riskScore: Math.min(riskScore, 100),
      spfPass,
      dkimPass,
      dmarcPass,
      suspiciousHeaders,
      details
    };
  }

  /**
   * Analyze email attachments
   */
  private analyzeAttachments(attachments: EmailAttachment[]): AttachmentAnalysis {
    const details: string[] = [];
    let riskScore = 0;
    const suspiciousFiles: string[] = [];
    let executableDetected = false;

    for (const attachment of attachments) {
      // Check for suspicious extensions
      const ext = attachment.filename.substring(attachment.filename.lastIndexOf('.')).toLowerCase();
      
      if (this.suspiciousExtensions.includes(ext)) {
        executableDetected = true;
        suspiciousFiles.push(attachment.filename);
        riskScore += 50;
        details.push(`🚨 Executable file detected: ${attachment.filename}`);
      }

      // Check for double extensions
      if (attachment.filename.match(/\.\w+\.\w+$/)) {
        suspiciousFiles.push(attachment.filename);
        riskScore += 30;
        details.push(`⚠️ Double extension detected: ${attachment.filename}`);
      }

      // Check for obfuscated filenames
      if (attachment.filename.match(/[^\x00-\x7F]/)) {
        suspiciousFiles.push(attachment.filename);
        riskScore += 20;
        details.push(`⚠️ Non-ASCII characters in filename: ${attachment.filename}`);
      }
    }

    if (details.length === 0 && attachments.length > 0) {
      details.push('✅ Attachments appear safe');
    } else if (attachments.length === 0) {
      details.push('ℹ️ No attachments');
    }

    return {
      riskScore: Math.min(riskScore, 100),
      suspiciousFiles,
      executableDetected,
      details
    };
  }

  /**
   * Calculate overall risk from all analyses
   */
  private calculateOverallRisk(
    sender: SenderAnalysis,
    content: LLMAnalysisResult,
    headers: HeaderAnalysis,
    attachments: AttachmentAnalysis
  ): number {
    // Weighted average
    const weights = {
      sender: 0.25,
      content: 0.40,
      headers: 0.15,
      attachments: 0.20
    };

    const overallRisk = 
      (sender.riskScore * weights.sender) +
      (content.semanticRiskScore * weights.content) +
      (headers.riskScore * weights.headers) +
      (attachments.riskScore * weights.attachments);

    return Math.round(overallRisk);
  }

  /**
   * Generate comprehensive explanation
   */
  private generateExplanation(
    sender: SenderAnalysis,
    content: LLMAnalysisResult,
    headers: HeaderAnalysis,
    attachments: AttachmentAnalysis
  ): string[] {
    const explanation: string[] = [];

    // Sender analysis
    explanation.push('📧 SENDER ANALYSIS:');
    explanation.push(...sender.details);

    // Content analysis
    explanation.push('');
    explanation.push('📝 CONTENT ANALYSIS:');
    explanation.push(content.explanation);

    // Header analysis
    explanation.push('');
    explanation.push('🔍 HEADER ANALYSIS:');
    explanation.push(...headers.details);

    // Attachment analysis
    if (attachments.details.length > 0) {
      explanation.push('');
      explanation.push('📎 ATTACHMENT ANALYSIS:');
      explanation.push(...attachments.details);
    }

    return explanation;
  }
}
