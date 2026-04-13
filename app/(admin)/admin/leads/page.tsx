"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { formatDateTime, STATUS_COLORS } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Trash2, AlertTriangle } from "lucide-react";
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

function AdminLeadsInner() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [leads, setLeads] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") || "";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [assignAgentId, setAssignAgentId] = useState<string>("unassigned");
  const [timelineDays, setTimelineDays] = useState<number | "">("");
  const [saving, setSaving] = useState(false);

  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false);
  const [bulkAssignAgentId, setBulkAssignAgentId] = useState<string>("unassigned");
  const [bulkTimelineDays, setBulkTimelineDays] = useState<number | "">("");

  // Delete state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const url = new URL("/api/leads", window.location.origin);
      if (search) url.searchParams.set("search", search);
      if (statusFilter) url.searchParams.set("status", statusFilter);
      url.searchParams.set("limit", "100");

      const [leadsRes, agentsRes] = await Promise.all([
        fetch(url.toString()),
        fetch("/api/agents"),
      ]);

      const leadsData = await leadsRes.json();
      const agentsData = await agentsRes.json();

      setLeads(leadsData.leads || []);
      setTotalCount(leadsData.total || 0);
      setAgents(agentsData.agents || []);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateLead = async () => {
    if (!selectedLead) return;
    setSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = {};
      if (timelineDays !== "") payload.timelineDays = Number(timelineDays);
      payload.assignedAgentId = assignAgentId !== "unassigned" ? assignAgentId : null;

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openAdminDialog = (lead: any) => {
    setSelectedLead(lead);
    setAssignAgentId(lead.assignedAgentId?._id || "unassigned");
    setTimelineDays(lead.timelineDays || "");
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeadIds(leads.map((l) => l._id));
    } else {
      setSelectedLeadIds([]);
    }
  };

  const handleSelectLead = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedLeadIds((prev) => [...prev, id]);
    } else {
      setSelectedLeadIds((prev) => prev.filter((lid) => lid !== id));
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
          timelineDays: bulkTimelineDays !== "" ? Number(bulkTimelineDays) : undefined,
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

  const handleDeleteLead = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/leads/${deleteTarget._id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`Lead "${deleteTarget.name}" deleted`);
        setDeleteTarget(null);
        fetchData();
      } else {
        toast.error("Delete failed");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeadIds.length === 0) return;
    setDeleting(true);
    try {
      const results = await Promise.all(
        selectedLeadIds.map((id) => fetch(`/api/leads/${id}`, { method: "DELETE" }))
      );
      const succeeded = results.filter((r) => r.ok).length;
      toast.success(`Deleted ${succeeded} leads`);
      setBulkDeleteDialogOpen(false);
      setSelectedLeadIds([]);
      fetchData();
    } catch {
      toast.error("An error occurred");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Manage Leads
            <span className="ml-2 text-sm font-normal text-gray-400">({totalCount} total)</span>
          </h1>
          <p className="text-sm text-gray-500">
            {statusFilter ? `Filtered by: ${statusFilter}` : "View, search, assign, and delete leads."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {selectedLeadIds.length > 0 && (
            <>
              <Button
                onClick={() => setBulkAssignDialogOpen(true)}
                variant="default"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9"
              >
                Bulk Assign ({selectedLeadIds.length})
              </Button>
              <Button
                onClick={() => setBulkDeleteDialogOpen(true)}
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-9"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete ({selectedLeadIds.length})
              </Button>
            </>
          )}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search name, phone..."
              className="pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Mobile card list */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : leads.length === 0 ? (
          <div className="text-center py-12 text-gray-400 italic">No leads found.</div>
        ) : leads.map((lead) => (
          <div key={lead._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 mt-0.5 rounded border-gray-300"
                  checked={selectedLeadIds.includes(lead._id)}
                  onChange={(e) => handleSelectLead(lead._id, e.target.checked)}
                />
                <div>
                  <p className="font-bold text-gray-900 text-sm">{lead.name}</p>
                  <p className="text-xs text-gray-500">{lead.phone} {lead.city ? `· ${lead.city}` : ""}</p>
                </div>
              </div>
              <Badge variant="outline" className={`border text-[10px] shrink-0 ${STATUS_COLORS[lead.status] || "bg-gray-100"}`}>
                {lead.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className={`px-2 py-0.5 rounded-full font-medium ${lead.assignedAgentId ? "bg-blue-50 text-blue-700" : "bg-orange-50 text-orange-600"}`}>
                {lead.assignedAgentId ? lead.assignedAgentId.name : "Unassigned"}
              </span>
              {lead.timelineDays && (
                <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full font-bold">{lead.timelineDays}d</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => openAdminDialog(lead)} className="h-8 text-xs flex-1">Manage</Button>
              <Button variant="outline" size="sm" onClick={() => setDeleteTarget(lead)} className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50 px-3">
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block border rounded-xl bg-white text-gray-900 shadow-sm overflow-hidden">
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                      Loading leads...
                    </div>
                  </TableCell>
                </TableRow>
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24 text-gray-400 italic">
                    No leads found.
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow key={lead._id} className="hover:bg-gray-50">
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
                        <span className="text-sm font-medium px-2 py-1 bg-orange-50 text-orange-600 rounded-md">
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
                    <TableCell className="text-sm text-gray-500">{formatDateTime(lead.lastUpdated)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openAdminDialog(lead)} className="h-8 text-xs">
                          Manage
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteTarget(lead)}
                          className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Manage Lead Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Manage Lead</DialogTitle>
            <DialogDescription>Assign agent and timeline to {selectedLead?.name}.</DialogDescription>
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
                  {agents.map((agent) => (
                    <SelectItem key={agent._id} value={agent._id}>
                      {agent.name}
                      {!agent.isActive && " (Inactive)"}
                    </SelectItem>
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
              <p className="text-[10px] text-gray-400">Lead will auto-unassign if not resolved within this many days.</p>
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

      {/* Bulk Assign Dialog */}
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
                  {agents.map((agent) => (
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

      {/* Delete Single Lead Confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" /> Delete Lead
            </DialogTitle>
            <DialogDescription>
              This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              onClick={handleDeleteLead}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? "Deleting..." : "Yes, Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirm */}
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" /> Bulk Delete
            </DialogTitle>
            <DialogDescription>
              This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete <strong>{selectedLeadIds.length} leads</strong>? This cannot be reversed.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBulkDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleBulkDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? "Deleting..." : `Delete ${selectedLeadIds.length} Leads`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminLeads() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400 animate-pulse">Loading leads...</div>}>
      <AdminLeadsInner />
    </Suspense>
  );
}
