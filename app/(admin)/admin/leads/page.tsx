"use client";

import { useEffect, useState } from "react";
import { formatDateTime, STATUS_COLORS, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

export default function AdminLeads() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [leads, setLeads] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [assignAgentId, setAssignAgentId] = useState<string>("unassigned");
  const [timelineDays, setTimelineDays] = useState<number | "">("");
  const [saving, setSaving] = useState(false);

  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false);
  const [bulkAssignAgentId, setBulkAssignAgentId] = useState<string>("unassigned");
  const [bulkTimelineDays, setBulkTimelineDays] = useState<number | "">("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const url = new URL("/api/leads", window.location.origin);
      if (search) url.searchParams.set("search", search);
      
      const [leadsRes, agentsRes] = await Promise.all([
        fetch(url.toString()),
        fetch("/api/agents")
      ]);
      
      const leadsData = await leadsRes.json();
      const agentsData = await agentsRes.json();
      
      setLeads(leadsData.leads || []);
      setAgents(agentsData.agents || []);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const handleUpdateLead = async () => {
    if (!selectedLead) return;
    setSaving(true);
    try {
      const payload: any = {};
      if (timelineDays !== "") payload.timelineDays = Number(timelineDays);
      
      if (assignAgentId !== "unassigned") {
        payload.assignedAgentId = assignAgentId;
      } else {
        payload.assignedAgentId = null; // unassign
      }

      const res = await fetch(`/api/leads/${selectedLead._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Lead updated");
        setSelectedLead(null);
        fetchData();
      } else {
        toast.error("Update failed");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const openAdminDialog = (lead: any) => {
    setSelectedLead(lead);
    setAssignAgentId(lead.assignedAgentId?._id || "unassigned");
    setTimelineDays(lead.timelineDays || "");
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeadIds(leads.map(l => l._id));
    } else {
      setSelectedLeadIds([]);
    }
  };

  const handleSelectLead = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedLeadIds(prev => [...prev, id]);
    } else {
      setSelectedLeadIds(prev => prev.filter(lid => lid !== id));
    }
  };

  const handleBulkAssign = async () => {
    if (selectedLeadIds.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/bulk-assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadIds: selectedLeadIds,
          assignedAgentId: bulkAssignAgentId,
          timelineDays: bulkTimelineDays !== "" ? Number(bulkTimelineDays) : undefined
        }),
      });

      if (res.ok) {
        toast.success(`Updated ${selectedLeadIds.length} leads`);
        setBulkAssignDialogOpen(false);
        setSelectedLeadIds([]);
        fetchData();
      } else {
        toast.error("Update failed");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Leads</h1>
          <p className="text-sm text-gray-500">View, search, and assign leads to agents.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {selectedLeadIds.length > 0 && (
            <Button onClick={() => setBulkAssignDialogOpen(true)} variant="default" className="bg-blue-600 hover:bg-blue-700 text-white">
              Bulk Assign ({selectedLeadIds.length})
            </Button>
          )}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search name, phone..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="border rounded-xl bg-white text-gray-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-12">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                    checked={leads.length > 0 && selectedLeadIds.length === leads.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableHead>
                <TableHead>Lead Name</TableHead>
                <TableHead>Phone / City</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Timeline</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center h-24">Loading leads...</TableCell></TableRow>
              ) : leads.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center h-24">No leads found.</TableCell></TableRow>
              ) : leads.map((lead) => (
                <TableRow key={lead._id}>
                  <TableCell>
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                      checked={selectedLeadIds.includes(lead._id)}
                      onChange={(e) => handleSelectLead(lead._id, e.target.checked)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>
                    <div className="text-sm">{lead.phone}</div>
                    <div className="text-xs text-gray-500">{lead.city || "-"}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`border ${STATUS_COLORS[lead.status] || "bg-gray-100"}`}>
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {lead.assignedAgentId ? (
                      <span className="text-sm font-medium px-2 py-1 bg-blue-50 text-blue-700 rounded-md">
                        {lead.assignedAgentId.name}
                      </span>
                    ) : (
                      <span className="text-sm font-medium px-2 py-1 bg-gray-100 text-gray-500 rounded-md">
                        Unassigned
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {lead.timelineDays ? (
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-[10px] h-5">
                        {lead.timelineDays} Days
                      </Badge>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDateTime(lead.lastUpdated)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => openAdminDialog(lead)}>
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Manage Lead</DialogTitle>
            <DialogDescription>Assign agent to {selectedLead?.name}.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Assign Agent</Label>
              <Select value={assignAgentId} onValueChange={setAssignAgentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">-- Unassigned --</SelectItem>
                  {agents.map(agent => (
                    <SelectItem key={agent._id} value={agent._id}>{agent.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Target Timeline (Days)</Label>
              <Input 
                type="number" 
                value={timelineDays}
                onChange={(e) => setTimelineDays(e.target.value === "" ? "" : Number(e.target.value))}
                min={1}
                placeholder="e.g. 7"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedLead(null)}>Cancel</Button>
            <Button onClick={handleUpdateLead} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
               {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkAssignDialogOpen} onOpenChange={setBulkAssignDialogOpen}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Bulk Assign Leads</DialogTitle>
            <DialogDescription>Assign {selectedLeadIds.length} selected leads to an agent.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Assign Agent</Label>
              <Select value={bulkAssignAgentId} onValueChange={setBulkAssignAgentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">-- Unassigned --</SelectItem>
                  {agents.map(agent => (
                    <SelectItem key={agent._id} value={agent._id}>{agent.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Target Timeline (Days)</Label>
              <Input 
                type="number" 
                value={bulkTimelineDays}
                onChange={(e) => setBulkTimelineDays(e.target.value === "" ? "" : Number(e.target.value))}
                min={1}
                placeholder="e.g. 7"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBulkAssignDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkAssign} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
               {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
