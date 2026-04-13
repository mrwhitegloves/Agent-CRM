"use client";

import { useState } from "react";
import { useAuth } from "@/components/shared/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success("Login successful");
        login(data.user);
      } else {
        toast.error(data.error || "Login failed");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-sand-light relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-accent/5 rounded-full blur-[120px] -mr-[10%] -mt-[10%]" />
      <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] -ml-[10%] -mb-[10%]" />
      
      <div className="w-full max-w-sm z-10">
        <div className="text-center mb-6 flex flex-col items-center">
           <div className="relative w-24 h-24 mb-4">
              <Image src="/white-gloves-logo.png" alt="White Gloves" fill sizes="96px" className="object-contain" priority />
           </div>
           <h1 className="text-3xl font-serif font-bold tracking-tight text-secondary">White Gloves</h1>
           <div className="h-0.5 w-16 bg-primary mx-auto mt-4 shadow-[0_0_10px_rgba(192,0,0,0.5)]" />
        </div>

        <Card className="border-accent/10 shadow-2xl bg-white rounded-3xl overflow-hidden">
          <CardHeader className="space-y-1 text-center bg-sand-light/50 p-8 border-b border-accent/10">
            <CardTitle className="text-xl font-serif font-bold text-secondary tracking-tight">Login</CardTitle>
            <CardDescription className="text-xs uppercase font-bold text-muted tracking-wide">Enter your credentials to continue</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[10px] uppercase font-bold tracking-widest text-muted ml-1">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  className="rounded-xl border-accent/20 focus:ring-accent h-12"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[10px] uppercase font-bold tracking-widest text-muted ml-1">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  className="rounded-xl border-accent/20 focus:ring-accent h-12"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-secondary hover:bg-black text-white font-bold h-12 rounded-xl shadow-lg transition-all active:scale-95" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <p className="text-center mt-8 text-[10px] font-bold text-muted uppercase tracking-widest">
          Secured by White Gloves &copy; 2024
        </p>
      </div>
    </div>
  );
}
