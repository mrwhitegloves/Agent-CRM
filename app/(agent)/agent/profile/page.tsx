"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Phone, Mail, TrendingUp, Users, Clock, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function AgentProfilePage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setName(d.profile?.name || "");
        setPhone(d.profile?.phone || "");
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load profile");
        setLoading(false);
      });
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });

      const result = await res.json();
      if (res.ok) {
        toast.success("Profile updated successfully");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setData((prev: any) => ({ ...prev, profile: result.profile }));
      } else {
        toast.error(result.error || "Update failed");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-5 space-y-4 animate-pulse">
        <div className="h-32 bg-gray-200 rounded-2xl" />
        <div className="h-48 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  const profile = data?.profile;
  const stats = data?.stats;

  return (
    <div className="p-5 md:p-8 space-y-6 pb-24">
      {/* Profile Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center font-serif font-bold text-white text-xl shadow-lg">
          {profile?.name?.substring(0, 2).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-serif font-bold text-secondary">{profile?.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px]">
              {profile?.isActive ? "● Active" : "○ Inactive"}
            </Badge>
            <span className="text-[10px] text-muted uppercase tracking-wider font-bold">Sales Agent</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-accent/10 bg-sand-light text-center">
          <CardContent className="p-4">
            <div className="flex justify-center mb-1">
              <Users className="w-4 h-4 text-accent" />
            </div>
            <p className="text-2xl font-serif font-bold text-secondary">{stats?.totalLeads || 0}</p>
            <p className="text-[9px] text-muted uppercase font-bold tracking-wider">Assigned</p>
          </CardContent>
        </Card>
        <Card className="border-primary/10 bg-white text-center">
          <CardContent className="p-4">
            <div className="flex justify-center mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-serif font-bold text-primary">{stats?.converted || 0}</p>
            <p className="text-[9px] text-muted uppercase font-bold tracking-wider">Converted</p>
          </CardContent>
        </Card>
        <Card className="border-accent/10 bg-sand-light text-center">
          <CardContent className="p-4">
            <div className="flex justify-center mb-1">
              <Clock className="w-4 h-4 text-accent" />
            </div>
            <p className="text-2xl font-serif font-bold text-secondary">{stats?.pending || 0}</p>
            <p className="text-[9px] text-muted uppercase font-bold tracking-wider">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Contact Info */}
      <Card className="border-accent/10">
        <CardHeader className="p-5 pb-3 border-b bg-sand-light/30">
          <CardTitle className="text-xs uppercase tracking-[.15em] font-serif font-bold text-secondary flex items-center gap-2">
            <User className="w-3.5 h-3.5" /> Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Mail className="w-4 h-4 text-muted" />
            <span className="text-secondary font-medium">{profile?.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Phone className="w-4 h-4 text-muted" />
            <span className="text-secondary font-medium">{profile?.phone}</span>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile */}
      <Card className="border-accent/10">
        <CardHeader className="p-5 pb-3 border-b bg-sand-light/30">
          <CardTitle className="text-xs uppercase tracking-[.15em] font-serif font-bold text-secondary flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5" /> Edit Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted uppercase">Full Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted uppercase">Phone Number</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" />
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleSaveProfile}
        disabled={saving}
        className="w-full h-12 bg-secondary hover:bg-black text-white font-bold rounded-2xl shadow-lg"
      >
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
