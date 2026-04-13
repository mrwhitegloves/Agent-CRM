"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Shield, Phone, Mail, Copy, Key, Power, Users } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function AgentsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [agents, setAgents] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [agentLeadCounts, setAgentLeadCounts] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // New Agent Form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  
  // Edit Agent State
  const [editingAgent, setEditingAgent] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [updating, setUpdating] = useState(false);
  
  // Success Modal for Copying
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; pass: string } | null>(null);

  const fetchAgents = async () => {
    try {
      const [agentsRes, dashRes] = await Promise.all([
        fetch("/api/agents", { cache: "no-store" }),
        fetch("/api/dashboard", { cache: "no-store" }),
      ]);
      const agentsData = await agentsRes.json();
      const dashData = await dashRes.json();
      setAgents(agentsData.agents || []);
      // Build lookup: agentId -> lead count info
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const counts: Record<string, any> = {};
      for (const a of (dashData.agentLeadCounts || [])) {
        counts[a._id] = a;
      }
      setAgentLeadCounts(counts);
    } catch {
      toast.error("Failed to load agents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success("Agent created successfully");
        setCreatedCredentials({ email, pass: password });
        setName("");
        setEmail("");
        setPhone("");
        setPassword("");
        fetchAgents();
      } else {
        toast.error(data.error || "Failed to create agent");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (agentId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (res.ok) {
        toast.success(`Agent ${!currentStatus ? "enabled" : "disabled"}`);
        fetchAgents();
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleUpdatePassword = async () => {
    if (!editingAgent || !newPassword) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/agents/${editingAgent._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      if (res.ok) {
        toast.success("Password updated successfully");
        setCreatedCredentials({ email: editingAgent.email, pass: newPassword });
        setEditingAgent(null);
        setNewPassword("");
        fetchAgents();
      }
    } catch {
      toast.error("Failed to update password");
    } finally {
      setUpdating(false);
    }
  };

  const copyToClipboard = (email: string, pass?: string) => {
    const text = `Email: ${email}${pass ? `\nPassword: ${pass}` : ""}`;
    navigator.clipboard.writeText(text);
    toast.success("Credentials copied to clipboard");
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agent Management</h1>
        <p className="text-sm text-gray-500">Create and manage your sales team.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Agent Form */}
        <Card className="lg:col-span-1 border-t-4 border-t-blue-600">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              Add New Agent
            </CardTitle>
            <CardDescription>Create credentials for a new sales associate.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAgent} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" required value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" required value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required className="text-gray-900" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full mt-2" disabled={creating}>
                {creating ? "Creating..." : "Create Agent"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Agents List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-gray-700" />
              Active Agents
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {/* Mobile card view */}
            <div className="block lg:hidden divide-y divide-gray-50">
              {loading ? (
                <div className="text-center py-8 text-gray-400">Loading agents...</div>
              ) : agents.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No agents found.</div>
              ) : agents.map((agent) => (
                <div key={agent._id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 ${agent.isActive ? "bg-secondary" : "bg-gray-400"}`}>
                        {agent.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{agent.name}</p>
                        <p className="text-xs text-gray-500">{agent.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${agent.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {agent.isActive ? "Active" : "Inactive"}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">
                        {agentLeadCounts[agent._id]?.leadsCount ?? 0} leads · {agentLeadCounts[agent._id]?.convertedCount ?? 0} converted
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => copyToClipboard(agent.email)}>
                      <Copy className="w-3 h-3 mr-1" /> Copy
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs h-8 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => setEditingAgent(agent)}>
                      <Key className="w-3 h-3 mr-1" /> Password
                    </Button>
                    <Button
                      variant="outline" size="sm"
                      className={cn("text-xs h-8", agent.isActive ? "text-red-600 border-red-200 hover:bg-red-50" : "text-green-600 border-green-200 hover:bg-green-50")}
                      onClick={() => handleUpdateStatus(agent._id, agent.isActive)}
                    >
                      <Power className="w-3 h-3 mr-1" />{agent.isActive ? "Disable" : "Enable"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="pl-6">Agent Details</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Leads</span>
                    </TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right pr-6">Management</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={4} className="text-center h-24">Loading agents...</TableCell></TableRow>
                  ) : agents.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center h-24">No agents found.</TableCell></TableRow>
                  ) : agents.map((agent) => (
                    <TableRow key={agent._id}>
                      <TableCell className="pl-6 font-medium">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                            {agent.name.charAt(0).toUpperCase()}
                          </div>
                          {agent.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <Mail className="w-3 h-3 mr-1.5" />
                          {agent.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-3 h-3 mr-1.5" />
                          {agent.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        {agent.isActive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Active</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Inactive</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-800">{agentLeadCounts[agent._id]?.leadsCount ?? 0}</span>
                          <span className="text-[10px] text-gray-400">{agentLeadCounts[agent._id]?.convertedCount ?? 0} converted</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(agent.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => copyToClipboard(agent.email)}>
                            <Copy className="w-3 h-3 mr-1" /> Copy
                          </Button>
                          <Button variant="outline" size="sm" className="text-xs h-8 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => setEditingAgent(agent)}>
                            <Key className="w-3 h-3 mr-1" /> Password
                          </Button>
                          <Button
                            variant="outline" size="sm"
                            className={cn("text-xs h-8", agent.isActive ? "text-red-600 border-red-200 hover:bg-red-50" : "text-green-600 border-green-200 hover:bg-green-50")}
                            onClick={() => handleUpdateStatus(agent._id, agent.isActive)}
                          >
                            <Power className="w-3 h-3 mr-1" />
                            {agent.isActive ? "Disable" : "Enable"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

      </div>

      <Dialog open={!!editingAgent} onOpenChange={(open) => !open && setEditingAgent(null)}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Update Password</DialogTitle>
            <DialogDescription>Enter a new password for {editingAgent?.name}.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-700">New Password</Label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                className="text-gray-900"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={handleUpdatePassword} disabled={updating}>
              {updating ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!createdCredentials} onOpenChange={(open) => !open && setCreatedCredentials(null)}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Agent Created Successfully!</DialogTitle>
            <DialogDescription>
              Please copy these credentials and share them with the agent. You won't be able to see the password again.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-3 bg-gray-100 rounded-lg space-y-2 text-sm font-mono break-all text-gray-900">
              <p><strong>Email:</strong> {createdCredentials?.email}</p>
              <p><strong>Password:</strong> {createdCredentials?.pass}</p>
            </div>
            <Button 
              className="w-full flex items-center gap-2" 
              onClick={() => {
                copyToClipboard(createdCredentials!.email, createdCredentials!.pass);
                setCreatedCredentials(null);
              }}
            >
              <Copy className="w-4 h-4" />
              Copy Credentials & Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
