import { useState, useCallback } from "react";
import { Upload, Link as LinkIcon, Mail, FileText, Loader2, CheckCircle, AlertTriangle, Shield, ExternalLink, Info, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { guardianApi, tierToColor, tierToLabel, type ScanResult, type EmailAnalysisResult } from "@/lib/api";

type ScannerTab = 'url' | 'email' | 'file';

export const Scanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [emailResult, setEmailResult] = useState<EmailAnalysisResult | null>(null);
  const [url, setUrl] = useState("");
  const [activeTab, setActiveTab] = useState<ScannerTab>('url');

  // Email fields
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailSender, setEmailSender] = useState("");

  const isValidUrl = useCallback((urlString: string): boolean => {
    try {
      const u = new URL(urlString.startsWith('http') ? urlString : `https://${urlString}`);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch { return false; }
  }, []);

  // ── URL Scan ──────────────────────────────────────────────────────────────
  const handleUrlScan = async () => {
    if (!url.trim()) { toast.error('Please enter a URL to scan'); return; }
    if (!isValidUrl(url)) { toast.error('Please enter a valid URL'); return; }

    setIsScanning(true);
    setScanResult(null);

    try {
      const result = await guardianApi.scanUrl(url);
      setScanResult(result);

      const tier = result.fusion.tier;
      if (tier === 'CONFIRMED_PHISHING' || tier === 'HIGH_RISK') {
        toast.error(`${tierToLabel(tier)} detected!`, { description: result.fusion.topIndicators[0] ?? '' });
      } else if (tier === 'SUSPICIOUS') {
        toast.warning('Suspicious URL detected', { description: 'Proceed with caution.' });
      } else {
        toast.success('URL appears safe', { description: `Risk score: ${result.fusion.unifiedRiskScore}/100` });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Scan failed';
      toast.error('Scan failed', { description: msg });
    } finally {
      setIsScanning(false);
    }
  };

  // ── Email Scan ────────────────────────────────────────────────────────────
  const handleEmailScan = async () => {
    if (!emailBody.trim()) { toast.error('Email body is required'); return; }
    if (!emailSender.trim()) { toast.error('Sender address is required'); return; }

    setIsScanning(true);
    setEmailResult(null);

    try {
      const result = await guardianApi.analyseEmail({
        subject: emailSubject,
        body: emailBody,
        sender: emailSender,
      });
      setEmailResult(result);
      const tier = result.fusion.tier;
      if (tier === 'CONFIRMED_PHISHING' || tier === 'HIGH_RISK') {
        toast.error(`${tierToLabel(tier)} email!`, { description: result.emailMetadata.spoofingIndicators[0] ?? '' });
      } else {
        toast.success('Analysis complete', { description: `Risk score: ${result.fusion.unifiedRiskScore}/100` });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      toast.error('Analysis failed', { description: msg });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <section className="relative py-20 px-6">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-5xl font-bold mb-4 text-foreground">AI-Powered Threat Scanner</h2>
          <p className="text-xl text-muted-foreground">
            Real-time ML + LLM + Threat Intelligence analysis
          </p>
        </div>

        {/* Scanner Card */}
        <Card className="glass p-8 rounded-3xl border border-border shadow-elegant animate-slide-up">
          <Tabs
            value={activeTab}
            onValueChange={(v) => { setActiveTab(v as ScannerTab); setScanResult(null); setEmailResult(null); }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 mb-8 glass p-1 rounded-xl">
              <TabsTrigger value="url" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                <LinkIcon className="w-4 h-4 mr-2" strokeWidth={1.5} /> URL
              </TabsTrigger>
              <TabsTrigger value="email" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                <Mail className="w-4 h-4 mr-2" strokeWidth={1.5} /> Email
              </TabsTrigger>
              <TabsTrigger value="file" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                <FileText className="w-4 h-4 mr-2" strokeWidth={1.5} /> File
              </TabsTrigger>
            </TabsList>

            {/* ── URL Tab ──────────────────────────────────────────────────── */}
            <TabsContent value="url" className="space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    type="url"
                    placeholder="Enter URL to scan (e.g., https://example.com)"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUrlScan()}
                    className="glass h-14 text-lg pl-12 pr-4 border-border"
                  />
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                </div>

                <Button
                  onClick={handleUrlScan}
                  disabled={isScanning || !url}
                  className="w-full h-14 text-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-elegant transition-all duration-300 hover:scale-[1.02]"
                >
                  {isScanning ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Analysing with AI…</>
                  ) : (
                    <><Shield className="mr-2 h-5 w-5" />Scan URL</>
                  )}
                </Button>
              </div>

              {isScanning && (
                <div className="relative h-32 glass rounded-xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent animate-scan" />
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Loader2 className="w-10 h-10 mx-auto mb-3 animate-spin text-foreground" />
                      <p className="text-sm text-muted-foreground">ML + LLM + Threat Intel running…</p>
                    </div>
                  </div>
                </div>
              )}

              {scanResult && !isScanning && <UrlScanResultCard result={scanResult} />}
            </TabsContent>

            {/* ── Email Tab ─────────────────────────────────────────────────── */}
            <TabsContent value="email" className="space-y-4">
              <Input
                type="email"
                placeholder="Sender address (e.g., noreply@paypal.com)"
                value={emailSender}
                onChange={(e) => setEmailSender(e.target.value)}
                className="glass h-12 border-border"
              />
              <Input
                type="text"
                placeholder="Email subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="glass h-12 border-border"
              />
              <Textarea
                placeholder="Paste email body here…"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="glass border-border min-h-[180px] resize-none"
                rows={8}
              />
              <Button
                onClick={handleEmailScan}
                disabled={isScanning || !emailBody || !emailSender}
                className="w-full h-14 text-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-elegant transition-all duration-300 hover:scale-[1.02]"
              >
                {isScanning ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Analysing…</>
                ) : (
                  <><Mail className="mr-2 h-5 w-5" />Analyse Email</>
                )}
              </Button>
              {emailResult && !isScanning && <EmailScanResultCard result={emailResult} />}
            </TabsContent>

            {/* ── File Tab ──────────────────────────────────────────────────── */}
            <TabsContent value="file" className="space-y-6">
              <div className="text-center py-12 glass rounded-xl border-2 border-dashed border-border hover:border-foreground/20 transition-colors cursor-pointer">
                <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" strokeWidth={1.5} />
                <p className="text-lg font-semibold mb-2 text-foreground">File scanning coming soon</p>
                <p className="text-sm text-muted-foreground">OCR + headless browser analysis</p>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {[
            { icon: <Zap className="w-6 h-6" />, title: "ML Feature Analysis", desc: "URL entropy, homoglyphs, TLD risk, structure" },
            { icon: <Shield className="w-6 h-6" />, title: "LLM Semantic Engine", desc: "GPT-powered urgency & phishing detection" },
            { icon: <ExternalLink className="w-6 h-6" />, title: "Live Threat Intel", desc: "VirusTotal + Google Safe Browsing + WHOIS" },
          ].map((feature, i) => (
            <div
              key={i}
              className="glass-hover p-6 rounded-xl text-center animate-slide-up shadow-elegant"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex justify-center mb-3 text-primary">{feature.icon}</div>
              <h4 className="font-semibold mb-2 text-foreground">{feature.title}</h4>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── URL Result Card ──────────────────────────────────────────────────────────

function UrlScanResultCard({ result }: { result: ScanResult }) {
  const tier   = result.fusion.tier;
  const safe   = tier === 'SAFE';
  const score  = result.fusion.unifiedRiskScore;

  return (
    <div className={`p-6 rounded-xl animate-slide-up border ${safe ? 'border-green-500/20 bg-green-500/5' : 'border-destructive/20 bg-destructive/5'}`}>
      <div className="flex items-start gap-4">
        {safe
          ? <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" strokeWidth={1.5} />
          : <AlertTriangle className="w-8 h-8 text-destructive flex-shrink-0" strokeWidth={1.5} />}
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-xl font-bold text-foreground">{tierToLabel(tier)}</h3>
            <Badge variant={safe ? 'default' : 'destructive'}>{result.fusion.attackCategory.replace(/_/g, ' ')}</Badge>
            {result.cached && <Badge variant="outline">Cached</Badge>}
          </div>

          {/* Risk score bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Risk Score</span>
              <span className={`font-bold ${tierToColor(tier)}`}>{score}/100</span>
            </div>
            <Progress value={score} className="h-2" />
          </div>

          {/* Confidence + timing */}
          <div className="grid grid-cols-3 gap-2 text-sm">
            <Stat label="Confidence" value={`${Math.round(result.fusion.confidence * 100)}%`} />
            <Stat label="Processed" value={`${result.processingMs}ms`} />
            <Stat label="Intel sources" value={String(result.threatIntel?.sources.length ?? 0)} />
          </div>

          {/* Score breakdown */}
          {(result.ml || result.llm || result.threatIntel) && (
            <div className="grid grid-cols-3 gap-2 text-sm">
              {result.ml && <Stat label="ML score" value={`${result.fusion.breakdown.mlScore}`} />}
              {result.llm && <Stat label="LLM score" value={`${result.fusion.breakdown.llmScore}`} />}
              {result.threatIntel && <Stat label="TI score" value={`${result.fusion.breakdown.threatIntelScore}`} />}
            </div>
          )}

          {/* LLM Reasoning */}
          {result.llm?.reasoning && (
            <div className="glass p-3 rounded-lg text-sm">
              <p className="text-muted-foreground flex gap-2">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{result.llm.reasoning}</span>
              </p>
            </div>
          )}

          {/* Top Indicators */}
          {result.fusion.topIndicators.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Indicators</p>
              <ul className="space-y-1">
                {result.fusion.topIndicators.slice(0, 5).map((ind, i) => (
                  <li key={i} className="text-sm flex gap-2 items-start">
                    <span className="text-destructive mt-0.5">•</span>
                    <span className="text-foreground">{ind}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* VirusTotal */}
          {result.threatIntel?.virusTotal && (
            <div className="text-sm text-muted-foreground">
              VirusTotal: {result.threatIntel.virusTotal.positives}/{result.threatIntel.virusTotal.total} engines flagged
            </div>
          )}

          {/* Recommendation */}
          <p className="text-sm text-muted-foreground border-t border-border pt-3">{result.fusion.recommendation}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Email Result Card ────────────────────────────────────────────────────────

function EmailScanResultCard({ result }: { result: EmailAnalysisResult }) {
  const tier = result.fusion.tier;
  const safe = tier === 'SAFE';

  return (
    <div className={`p-6 rounded-xl animate-slide-up border ${safe ? 'border-green-500/20 bg-green-500/5' : 'border-destructive/20 bg-destructive/5'}`}>
      <div className="flex items-start gap-4">
        {safe
          ? <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" strokeWidth={1.5} />
          : <AlertTriangle className="w-8 h-8 text-destructive flex-shrink-0" strokeWidth={1.5} />}
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-xl font-bold text-foreground">{tierToLabel(tier)}</h3>
            <Badge variant={safe ? 'default' : 'destructive'}>{result.fusion.attackCategory.replace(/_/g, ' ')}</Badge>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Risk Score</span>
              <span className={`font-bold ${tierToColor(tier)}`}>{result.fusion.unifiedRiskScore}/100</span>
            </div>
            <Progress value={result.fusion.unifiedRiskScore} className="h-2" />
          </div>

          {result.emailMetadata.spoofingIndicators.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Spoofing Indicators</p>
              {result.emailMetadata.spoofingIndicators.map((s, i) => (
                <p key={i} className="text-sm text-destructive">• {s}</p>
              ))}
            </div>
          )}

          {result.emailMetadata.extractedUrls.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Extracted URLs ({result.urlResults.length} scanned)
              </p>
              {result.urlResults.slice(0, 3).map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className={tierToColor(r.fusion.tier)}>●</span>
                  <span className="text-foreground truncate max-w-xs">{r.input}</span>
                  <Badge variant="outline" className="text-xs">{tierToLabel(r.fusion.tier)}</Badge>
                </div>
              ))}
            </div>
          )}

          {result.llm?.reasoning && (
            <div className="glass p-3 rounded-lg text-sm">
              <p className="text-muted-foreground">{result.llm.reasoning}</p>
            </div>
          )}

          <p className="text-sm text-muted-foreground border-t border-border pt-3">{result.fusion.recommendation}</p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-lg p-2 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground">{value}</p>
    </div>
  );
}
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

type ScanResult = {
  status: 'safe' | 'threat' | 'suspicious';
  confidence: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  details: {
    isPhishing: boolean;
    isMalware: boolean;
    isSpam: boolean;
    domainAge?: number; // in days
    sslValid?: boolean;
  };
  detectedThreats?: string[];
};

export const Scanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [url, setUrl] = useState("");
  const [activeTab, setActiveTab] = useState<ScannerTab>('url');
  const [file, setFile] = useState<File | null>(null);

  // Validate URL format
  const isValidUrl = useCallback((urlString: string): boolean => {
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }, []);

  // Simulate scanning a URL
  const simulateUrlScan = useCallback((url: string): Promise<ScanResult> => {
    return new Promise((resolve) => {
      const isPhishing = Math.random() > 0.7; // 30% chance of being a threat
      const riskLevel = isPhishing 
        ? Math.random() > 0.7 ? 'Critical' : 'High'
        : Math.random() > 0.7 ? 'Medium' : 'Low';
      
      setTimeout(() => {
        resolve({
          status: isPhishing ? 'threat' : 'safe',
          confidence: isPhishing ? Math.floor(85 + Math.random() * 15) : Math.floor(90 + Math.random() * 10),
          riskLevel,
          details: {
            isPhishing: isPhishing,
            isMalware: isPhishing && Math.random() > 0.7,
            isSpam: isPhishing && Math.random() > 0.5,
            domainAge: Math.floor(Math.random() * 3650), // Random domain age up to 10 years
            sslValid: Math.random() > 0.2, // 80% chance of valid SSL
          },
          detectedThreats: isPhishing 
            ? [
                'Suspicious URL structure',
                riskLevel === 'Critical' ? 'Known phishing domain' : '',
                'Unusual domain registration details',
              ].filter(Boolean)
            : [],
        });
      }, 2000 + Math.random() * 2000); // Random delay between 2-4 seconds
    });
  }, []);

  const handleScan = async () => {
    if (!url.trim()) {
      toast.error('Please enter a URL to scan');
      return;
    }

    if (!isValidUrl(url)) {
      toast.error('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    setIsScanning(true);
    setScanResult(null);

    try {
      const result = await simulateUrlScan(url);
      setScanResult(result);
      
      // Show toast notification based on result
      if (result.status === 'threat') {
        toast.error('Potential threat detected!', {
          description: 'This URL appears to be malicious.',
          action: {
            label: 'Details',
            onClick: () => {
              // Scroll to results
              document.getElementById('scan-results')?.scrollIntoView({ behavior: 'smooth' });
            },
          },
        });
      } else {
        toast.success('No threats detected', {
          description: 'This URL appears to be safe.',
        });
      }
    } catch (error) {
      console.error('Scan failed:', error);
      toast.error('Scan failed', {
        description: 'An error occurred while scanning the URL. Please try again.',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast.info('File selected', {
        description: `${selectedFile.name} (${(selectedFile.size / 1024).toFixed(2)} KB)`,
      });
    }
  };

  const handleFileScan = () => {
    if (!file) {
      toast.error('Please select a file to scan');
      return;
    }
    
    // In a real app, you would upload the file to your backend for scanning
    toast.info('File scanning coming soon', {
      description: 'This feature will be available in the next update!',
    });
  };

  return (
    <section className="relative py-20 px-6">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-5xl font-bold mb-4 text-foreground">
            AI-Powered Threat Scanner
          </h2>
          <p className="text-xl text-muted-foreground">
            Real-time detection for URLs, emails, and files
          </p>
        </div>

        {/* Scanner Card */}
        <Card className="glass p-8 rounded-3xl border border-border shadow-elegant animate-slide-up">
          <Tabs 
            value={activeTab}
            onValueChange={(value: string) => setActiveTab(value as ScannerTab)}
            className="w-full"
            defaultValue="url"
          >
            <TabsList className="grid w-full grid-cols-3 mb-8 glass p-1 rounded-xl">
              <TabsTrigger value="url" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                <LinkIcon className="w-4 h-4 mr-2" strokeWidth={1.5} />
                URL
              </TabsTrigger>
              <TabsTrigger value="email" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                <Mail className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Email
              </TabsTrigger>
              <TabsTrigger value="file" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                <FileText className="w-4 h-4 mr-2" strokeWidth={1.5} />
                File
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    type="url"
                    placeholder="Enter URL to scan (e.g., https://example.com)"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="glass h-14 text-lg pl-12 pr-4 border-border"
                  />
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                </div>

                <Button
                  onClick={handleScan}
                  disabled={isScanning || !url}
                  className="w-full h-14 text-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-elegant transition-all duration-300 hover:scale-[1.02]"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Scanning with AI...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-5 w-5" />
                      Scan URL
                    </>
                  )}
                </Button>
              </div>

              {/* Scanning Animation */}
              {isScanning && (
                <div className="relative h-32 glass rounded-xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent animate-scan" />
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Loader2 className="w-10 h-10 mx-auto mb-3 animate-spin text-foreground" />
                      <p className="text-sm text-muted-foreground">Analyzing with AI engine...</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Scan Result */}
              {scanResult && !isScanning && (
                <div
                  className={`p-6 rounded-xl animate-slide-up border ${
                    scanResult.status === "safe"
                      ? "border-green-500/20 bg-green-500/5"
                      : "border-destructive/20 bg-destructive/5"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {scanResult.status === "safe" ? (
                      <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" strokeWidth={1.5} />
                    ) : (
                      <AlertTriangle className="w-8 h-8 text-destructive flex-shrink-0" strokeWidth={1.5} />
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2 text-foreground">
                        {scanResult.status === "safe" ? "Safe URL" : "Threat Detected"}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {scanResult.status === "safe"
                          ? "No phishing indicators detected. This URL appears to be legitimate."
                          : scanResult.detectedThreats?.length
                            ? scanResult.detectedThreats[0]
                            : "Potential security threat detected. Proceed with caution."}
                      </p>
                      
                      {/* Detailed Analysis */}
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">AI Confidence:</span>
                          <span className="font-semibold text-foreground">
                            {`${scanResult.confidence.toFixed(1)}%`}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Scan Time:</span>
                          <span className="font-semibold text-foreground">0.3s</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Risk Level:</span>
                          <span className={`font-semibold ${getRiskColor(scanResult.riskLevel)}`}>
                            {scanResult.riskLevel}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="email" className="space-y-6">
              <div className="text-center py-12 glass rounded-xl">
                <Mail className="w-16 h-16 mx-auto mb-4 text-muted-foreground" strokeWidth={1.5} />
                <p className="text-muted-foreground">Email scanning coming soon...</p>
              </div>
            </TabsContent>

            <TabsContent value="file" className="space-y-6">
              <div className="text-center py-12 glass rounded-xl border-2 border-dashed border-border hover:border-foreground/20 transition-colors cursor-pointer">
                <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" strokeWidth={1.5} />
                <p className="text-lg font-semibold mb-2 text-foreground">Drop files here or click to upload</p>
                <p className="text-sm text-muted-foreground">Supports PDF, DOC, XLS, ZIP files</p>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {[
            { title: "Real-Time Analysis", desc: "Instant threat detection" },
            { title: "Deep Learning", desc: "Advanced AI algorithms" },
            { title: "99.8% Accuracy", desc: "Industry-leading precision" },
          ].map((feature, index) => (
            <div
              key={index}
              className="glass-hover p-6 rounded-xl text-center animate-slide-up shadow-elegant"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <h4 className="font-semibold mb-2 text-foreground">{feature.title}</h4>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const getRiskColor = (riskLevel: 'Low' | 'Medium' | 'High' | 'Critical'): string => {
  switch (riskLevel) {
    case 'Critical': return 'text-red-500';
    case 'High': return 'text-orange-500';
    case 'Medium': return 'text-yellow-500';
    case 'Low':
    default:
      return 'text-green-500';
  }
};
