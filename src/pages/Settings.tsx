import { SplashCursor } from "@/components/ui/splash-cursor";
import { BackgroundFlow } from "@/components/BackgroundFlow";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Bell, Globe, Shield, Eye, AlertTriangle } from "lucide-react";

const Settings = () => {
  return (
    <div className="relative min-h-screen">
      <BackgroundFlow />
      <SplashCursor />
      <div className="container mx-auto py-12 space-y-8">
        <div>
          <h1 className="text-4xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">Customize your security preferences</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifs">Email Notifications</Label>
                <Switch id="email-notifs" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="threat-alerts">Real-time Threat Alerts</Label>
                <Switch id="threat-alerts" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="weekly-report">Weekly Security Report</Label>
                <Switch id="weekly-report" defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Scan Intensity</Label>
                <Slider defaultValue={[75]} max={100} step={1} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-scan">Automatic URL Scanning</Label>
                <Switch id="auto-scan" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="advanced-protection">Advanced Protection</Label>
                <Switch id="advanced-protection" defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <Switch id="dark-mode" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="analytics">Share Analytics</Label>
                <Switch id="analytics" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
