import { useEffect, useState, useCallback } from "react";
import { Shield, TrendingUp, AlertCircle, CheckCircle, Clock, RefreshCw, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Logo } from "@/components/Logo";
import { guardianApi, tierToColor, tierToLabel, type DashboardStats, type ScanResult } from "@/lib/api";

export const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await guardianApi.getDashboardStats();
      setStats(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStats();
    const interval = setInterval(() => void fetchStats(), 30_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const metrics = stats ? [
    {
      title: "Total Scans",
      value: stats.totalScans.toLocaleString(),
      sub: `${stats.scansToday} today`,
      trend: "up",
      icon: Shield,
    },
    {
      title: "Threats Detected",
      value: ((stats.threatsByTier.HIGH_RISK ?? 0) + (stats.threatsByTier.CONFIRMED_PHISHING ?? 0)
        + (stats.threatsByTier.SUSPICIOUS ?? 0)).toLocaleString(),
      sub: `${stats.threatsByTier.CONFIRMED_PHISHING ?? 0} confirmed phishing`,
      trend: "down",
      icon: AlertCircle,
    },
    {
      title: "Detection Rate",
      value: `${stats.detectionRate}%`,
      sub: `Avg risk: ${stats.averageRiskScore}/100`,
      trend: "up",
      icon: CheckCircle,
    },
    {
      title: "Avg Processing",
      value: `${stats.processingStats.avgMs}ms`,
      sub: `p95: ${stats.processingStats.p95Ms}ms`,
      trend: "down",
      icon: Clock,
    },
  ] : [];

  return (
    <section className="relative py-20 px-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="flex justify-center mb-6">
            <Logo size="xl" />
          </div>
          <h2 className="text-4xl font-bold mb-4 text-foreground">SOC Dashboard</h2>
          <p className="text-xl text-muted-foreground">Real-time threat monitoring and analytics</p>
          <div className="flex items-center justify-center gap-3 mt-4">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={() => void fetchStats()} disabled={loading}>
              <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm text-center">
            {error} â€” showing cached or demo data
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {loading && !stats
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass-hover p-6 rounded-2xl h-36 animate-pulse bg-accent/30" />
              ))
            : metrics.map((metric, index) => (
                <div
                  key={index}
                  className="glass-hover p-6 rounded-2xl relative overflow-hidden group animate-slide-up shadow-elegant"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <metric.icon className="w-10 h-10 text-foreground" strokeWidth={1.5} />
                    <span className="text-xs text-muted-foreground">{metric.sub}</span>
                  </div>
                  <div className="text-4xl font-bold mb-2 text-foreground">{metric.value}</div>
                  <div className="text-sm text-muted-foreground">{metric.title}</div>
                </div>
              ))}
        </div>

        {/* Tier Breakdown */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {(['SAFE', 'SUSPICIOUS', 'HIGH_RISK', 'CONFIRMED_PHISHING'] as const).map(tier => (
              <div key={tier} className="glass p-4 rounded-xl text-center">
                <div className={`text-2xl font-bold ${tierToColor(tier)}`}>
                  {(stats.threatsByTier[tier] ?? 0).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{tierToLabel(tier)}</div>
                {stats.totalScans > 0 && (
                  <Progress
                    value={((stats.threatsByTier[tier] ?? 0) / stats.totalScans) * 100}
                    className="h-1 mt-2"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Threats */}
          <Card className="glass p-6 rounded-2xl animate-slide-up [animation-delay:0.5s] shadow-elegant">
            <h3 className="text-2xl font-bold mb-6 text-foreground flex items-center">
              <AlertCircle className="mr-3 w-6 h-6" strokeWidth={1.5} />
              Recent Scans
            </h3>
            <div className="space-y-3">
              {(stats?.recentScans ?? []).slice(0, 6).map((scan, i) => (
                <RecentScanRow key={scan.scanId ?? i} scan={scan} />
              ))}
              {(!stats || stats.recentScans.length === 0) && (
                <p className="text-muted-foreground text-sm text-center py-6">No scans yet. Run your first scan!</p>
              )}
            </div>
          </Card>

          {/* AI Detection Status */}
          <Card className="glass p-6 rounded-2xl animate-slide-up [animation-delay:0.6s] shadow-elegant">
            <h3 className="text-2xl font-bold mb-6 text-foreground flex items-center">
              <TrendingUp className="mr-3 w-6 h-6" strokeWidth={1.5} />
              Analysis Engine Status
            </h3>
            <div className="space-y-5">
              {[
                { label: "ML URL Analyser", value: 100, active: true },
                { label: "LLM Semantic Engine", value: 95, active: true },
                { label: "Threat Intelligence", value: 88, active: true },
                { label: "Risk Fusion Engine", value: 100, active: true },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      {item.active && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />}
                      {item.label}
                    </span>
                    <span className="text-sm font-semibold text-foreground">{item.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-foreground rounded-full transition-all duration-1000" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 rounded-xl border border-border bg-accent flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <span className="font-semibold text-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Guardian AI Engine
                </span>
              </div>
              <Badge variant="default">Operational</Badge>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

function RecentScanRow({ scan }: { scan: ScanResult }) {
  const tier = scan.fusion.tier;
  const domain = (() => {
    try { return new URL(scan.input.startsWith('http') ? scan.input : `https://${scan.input}`).hostname; }
    catch { return scan.input.slice(0, 40); }
  })();

  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-accent/50 hover:bg-accent transition-colors border border-border">
      <div className="flex items-center gap-3 min-w-0">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
          tier === 'CONFIRMED_PHISHING' ? 'bg-red-500' :
          tier === 'HIGH_RISK' ? 'bg-orange-500' :
          tier === 'SUSPICIOUS' ? 'bg-yellow-500' : 'bg-green-500'
        }`} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{domain}</p>
          <p className="text-xs text-muted-foreground">{new Date(scan.timestamp).toLocaleTimeString()}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-xs font-bold ${tierToColor(tier)}`}>{scan.fusion.unifiedRiskScore}</span>
        <Badge variant={tier === 'SAFE' ? 'default' : 'destructive'} className="text-xs">
          {tierToLabel(tier)}
        </Badge>
      </div>
    </div>
  );
}

