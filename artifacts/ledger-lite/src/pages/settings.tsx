import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, CheckCircle } from "lucide-react";

const STORAGE_KEY = "ledgerlite_settings";

interface BusinessSettings {
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
}

const defaults: BusinessSettings = {
  businessName: "",
  ownerName: "",
  phone: "",
  email: "",
  address: "",
};

export default function Settings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<BusinessSettings>(defaults);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSettings(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    toast({ title: "Settings saved", description: "Your business profile has been updated." });
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your business profile</p>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-base">Business Profile</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input placeholder="e.g. Amaka Fashion House" value={settings.businessName} onChange={e => setSettings(s => ({ ...s, businessName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Owner Name</Label>
              <Input placeholder="Your full name" value={settings.ownerName} onChange={e => setSettings(s => ({ ...s, ownerName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input placeholder="e.g. 08012345678" value={settings.phone} onChange={e => setSettings(s => ({ ...s, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input type="email" placeholder="business@email.com" value={settings.email} onChange={e => setSettings(s => ({ ...s, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Business Address</Label>
              <Input placeholder="e.g. 15 Lagos Street, Ikeja" value={settings.address} onChange={e => setSettings(s => ({ ...s, address: e.target.value }))} />
            </div>
            <Button type="submit" className="w-full">
              {saved ? <><CheckCircle className="w-4 h-4 mr-2" />Saved!</> : "Save Settings"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-primary/5">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-1">LedgerLite</h3>
          <p className="text-sm text-muted-foreground">Your financial co-pilot for African business. Track income, expenses, invoices, and debts — all in one place.</p>
          <p className="text-xs text-muted-foreground mt-3">Version 1.0 MVP</p>
        </CardContent>
      </Card>
    </div>
  );
}
