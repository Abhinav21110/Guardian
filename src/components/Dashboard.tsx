import { Shield, TrendingUp, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";

export const Dashboard = () => {
  const metrics = [
    {
      title: "Active Threats",
      value: "24",
      change: "-12%",
      trend: "down",
      icon: AlertCircle,
    },
    {
      title: "Scans Today",
      value: "1,847",
      change: "+23%",
      trend: "up",
      icon: Shield,
    },
    {
      title: "Blocked Attacks",
      value: "156",
      change: "+8%",
      trend: "up",
      icon: CheckCircle,
    },
    {
      title: "Avg Response Time",
      value: "0.3s",
      change: "-5%",
      trend: "down",
      icon: Clock,
    },
  ];

  const recentThreats = [
    { type: "Phishing Email", severity: "high", time: "2m ago", status: "Blocked" },
    { type: "Malicious URL", severity: "critical", time: "5m ago", status: "Blocked" },
    { type: "Suspicious File", severity: "medium", time: "12m ago", status: "Quarantined" },
    { type: "Spear Phishing", severity: "high", time: "18m ago", status: "Blocked" },
  ];

  return (
    <section className="relative py-20 px-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="flex justify-center mb-6">
            <Logo size="xl" />
          </div>
          <h2 className="text-4xl font-bold mb-4 text-foreground">
            Dashboard
          </h2>
          <p className="text-xl text-muted-foreground">
            Real-time monitoring and analytics
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="glass-hover p-6 rounded-2xl relative overflow-hidden group animate-slide-up shadow-elegant"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <metric.icon className="w-10 h-10 text-foreground" strokeWidth={1.5} />
                  <span className={`text-sm font-medium ${metric.trend === 'up' ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {metric.change}
                  </span>
                </div>
                <div className="text-4xl font-bold mb-2 text-foreground">
                  {metric.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {metric.title}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Threats */}
          <Card className="glass p-6 rounded-2xl animate-slide-up [animation-delay:0.5s] shadow-elegant">
            <h3 className="text-2xl font-bold mb-6 text-foreground flex items-center">
              <AlertCircle className="mr-3 w-6 h-6" strokeWidth={1.5} />
              Recent Threats
            </h3>
            <div className="space-y-4">
              {recentThreats.map((threat, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-xl bg-accent/50 hover:bg-accent transition-colors duration-200 border border-border"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${
                      threat.severity === 'critical' ? 'bg-destructive' :
                      threat.severity === 'high' ? 'bg-foreground' :
                      'bg-muted-foreground'
                    }`} />
                    <div>
                      <div className="font-semibold text-foreground">{threat.type}</div>
                      <div className="text-sm text-muted-foreground">{threat.time}</div>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-medium bg-secondary border border-border">
                    {threat.status}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* AI Detection Status */}
          <Card className="glass p-6 rounded-2xl animate-slide-up [animation-delay:0.6s] shadow-elegant">
            <h3 className="text-2xl font-bold mb-6 text-foreground flex items-center">
              <TrendingUp className="mr-3 w-6 h-6" strokeWidth={1.5} />
              AI Detection Status
            </h3>
            <div className="space-y-6">
              {[
                { label: "Pattern Recognition", value: 98 },
                { label: "Behavioral Analysis", value: 95 },
                { label: "URL Scanning", value: 99 },
                { label: "Email Analysis", value: 96 },
              ].map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-semibold text-foreground">{item.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-foreground rounded-full transition-all duration-1000"
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* AI Status Badge */}
            <div className="mt-8 p-4 rounded-xl border border-border bg-accent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-foreground animate-pulse" />
                  <span className="font-semibold text-foreground">AI Engine</span>
                </div>
                <span className="text-sm text-muted-foreground">Active</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};
