import { useState, useCallback } from "react";
import { Upload, Link as LinkIcon, Mail, FileText, Loader2, CheckCircle, AlertTriangle, Shield, X, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";

// Define tab types for better type safety
type ScannerTab = 'url' | 'email' | 'file';
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
