import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { threatsData } from "@/data/threats-data";
import { ThreatLevel } from "@/components/ThreatLevel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, AlertCircle, Shield, ShieldAlert, ShieldCheck, ShieldOff, Download, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SplashCursor } from "@/components/ui/splash-cursor";
import { BackgroundFlow } from "@/components/BackgroundFlow";

const Threats = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredThreats = useMemo(() => {
    return threatsData.filter(threat => {
      const matchesSearch = 
        threat.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        threat.type.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSeverity = severityFilter === "all" || threat.level.toLowerCase() === severityFilter.toLowerCase();
      
      return matchesSearch && matchesSeverity;
    });
  }, [searchTerm, severityFilter]);

  const threatCounts = useMemo(() => {
    return threatsData.reduce((acc, threat) => {
      acc[threat.level] = (acc[threat.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const getSeverityIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical':
        return <ShieldAlert className="w-5 h-5 text-red-500" />;
      case 'high':
        return <ShieldOff className="w-5 h-5 text-orange-500" />;
      case 'medium':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'low':
        return <ShieldCheck className="w-5 h-5 text-green-500" />;
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  return (
    <div className="relative min-h-screen">
      <BackgroundFlow />
      <SplashCursor />
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold">Threat Intelligence</h1>
            <p className="text-muted-foreground mt-2">Monitor and analyze security threats in real-time</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border-red-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
              <div className="h-4 w-4 text-red-500">
                <ShieldAlert className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{threatCounts['Critical'] || 0}</div>
              <p className="text-xs text-muted-foreground">Active critical threats</p>
            </CardContent>
          </Card>
          <Card className="border-orange-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High</CardTitle>
              <div className="h-4 w-4 text-orange-500">
                <ShieldOff className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{threatCounts['High'] || 0}</div>
              <p className="text-xs text-muted-foreground">High severity issues</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Medium</CardTitle>
              <div className="h-4 w-4 text-yellow-500">
                <AlertCircle className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{threatCounts['Medium'] || 0}</div>
              <p className="text-xs text-muted-foreground">Medium risk items</p>
            </CardContent>
          </Card>
          <Card className="border-green-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low</CardTitle>
              <div className="h-4 w-4 text-green-500">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{threatCounts['Low'] || 0}</div>
              <p className="text-xs text-muted-foreground">Low priority items</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <TabsList className="grid w-full grid-cols-4 md:w-auto">
              <TabsTrigger value="all" onClick={() => setSeverityFilter("all")}>All</TabsTrigger>
              <TabsTrigger value="critical" onClick={() => setSeverityFilter("critical")}>
                <ShieldAlert className="h-4 w-4 mr-2" />
                Critical
              </TabsTrigger>
              <TabsTrigger value="high" onClick={() => setSeverityFilter("high")}>
                <ShieldOff className="h-4 w-4 mr-2" />
                High
              </TabsTrigger>
              <TabsTrigger value="medium" onClick={() => setSeverityFilter("medium")}>
                <AlertCircle className="h-4 w-4 mr-2" />
                Medium
              </TabsTrigger>
            </TabsList>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search threats..."
                className="w-full pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Detected Threats</CardTitle>
                <CardDescription>
                  {filteredThreats.length} {filteredThreats.length === 1 ? 'threat' : 'threats'} found
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="w-[100px]">Severity</TableHead>
        <TableHead>Source</TableHead>
        <TableHead>Type</TableHead>
        <TableHead>First Seen</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {filteredThreats.length > 0 ? (
        filteredThreats.map((threat) => (
          <TableRow key={threat.id} className="hover:bg-muted/50">
            <TableCell>
              <div className="flex items-center gap-2">
                {getSeverityIcon(threat.level)}
                <ThreatLevel level={threat.level} />
              </div>
            </TableCell>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                <span>{threat.source}</span>
                {threat.isNew && <Badge variant="secondary" className="text-xs">New</Badge>}
              </div>
            </TableCell>
            <TableCell>{threat.type}</TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span>{new Date(threat.timestamp).toLocaleDateString()}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(threat.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={threat.status === 'Active' ? 'destructive' : 'default'}>
                {threat.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <span className="sr-only">View details</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </Button>
            </TableCell>
          </TableRow>
        ))
      ) : (
        <TableRow>
          <TableCell colSpan={6} className="h-24 text-center">
            No threats found matching your criteria.
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Threats;
