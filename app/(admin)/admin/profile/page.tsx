"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/shared/AuthProvider";
import toast from "react-hot-toast";
import { Key, User, Mail, Shield } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error("Passwords do not match");
    }
    if (newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    setUpdating(true);
    try {
      const res = await fetch(`/api/agents/${user?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });

      if (res.ok) {
        toast.success("Password updated successfully");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error("Failed to update password");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-secondary">Account Settings</h1>
        <p className="text-sm text-muted mt-1">Manage your admin profile and security.</p>
      </div>

      {/* Profile card */}
      <Card className="border-accent/10 shadow-md">
        <CardHeader className="p-5 pb-3 border-b bg-sand-light/40">
          <CardTitle className="text-xs uppercase tracking-[.15em] font-serif font-bold text-secondary flex items-center gap-2">
            <User className="w-3.5 h-3.5" /> Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {/* Avatar row */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-white font-serif font-bold text-xl shadow">
              {user?.name?.substring(0, 2).toUpperCase() || "AD"}
            </div>
            <div>
              <p className="font-bold text-secondary text-base">{user?.name || "Admin"}</p>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-0.5">
                <Shield className="w-2.5 h-2.5" /> {user?.role || "admin"} access
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div className="space-y-0.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted font-bold">Full Name</Label>
              <p className="font-medium text-gray-900 text-sm">{user?.name || "Admin"}</p>
            </div>
            <div className="space-y-0.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted font-bold">Email Address</Label>
              <div className="flex items-center gap-1.5 text-sm text-gray-900">
                <Mail className="w-3.5 h-3.5 text-muted" />
                <span className="font-medium truncate">{user?.email}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password card */}
      <Card className="border-accent/10 shadow-md">
        <CardHeader className="p-5 pb-3 border-b bg-sand-light/40">
          <CardTitle className="text-xs uppercase tracking-[.15em] font-serif font-bold text-secondary flex items-center gap-2">
            <Key className="w-3.5 h-3.5" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-pass" className="text-xs font-bold uppercase tracking-widest text-muted">New Password</Label>
              <Input
                id="new-pass"
                type="password"
                placeholder="••••••••"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-pass" className="text-xs font-bold uppercase tracking-widest text-muted">Confirm Password</Label>
              <Input
                id="confirm-pass"
                type="password"
                placeholder="••••••••"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <Button
              type="submit"
              disabled={updating}
              className="w-full h-12 bg-secondary hover:bg-black text-white font-bold rounded-xl shadow-lg mt-2"
            >
              {updating ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
