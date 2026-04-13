"use client";
// Force rebuild dynamic folder resolution

import { useEffect, useState, use } from "react";
import { formatDateTime, STATUS_COLORS, LEAD_STAGES } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Phone, MessageCircle, ArrowLeft, MapPin, Building, Info, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import Link from "next/link";
import toast from "react-hot-toast";

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [lead, setLead] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Drawer states
  const [open, setOpen] = useState(false);
  const [activityNote, setActivityNote] = useState("");
  const [nextFollowUp, setNextFollowUp] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchLeadDetails = async () => {
    try {
      const [leadRes, actRes] = await Promise.all([
        fetch(`/api/leads/${id}`),
        fetch(`/api/activities?leadId=${id}`)
      ]);
      const leadData = await leadRes.json();
      const actData = await actRes.json();
      
      setLead(leadData.lead);
      setNewStatus(leadData.lead?.status || "Contacted");
      setActivities(actData.activities || []);
    } catch {
      toast.error("Failed to load details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadDetails();
  }, [id]);

  const handleUpdate = async () => {
    if (!lead) return;
    setSaving(true);
    try {
      const finalComment = activityNote.trim();

      // Single call: activity + status update handled server-side
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead._id,
          type: "Note",
          comment: finalComment || (newStatus !== lead.status ? `Status changed to ${newStatus}` : ""),
          nextFollowUpDate: nextFollowUp || undefined,
          status: newStatus !== lead.status ? newStatus : undefined,
        }),
      });

      if (!res.ok) {
        toast.error("Failed to save activity");
        return;
      }

      // Also update lead status via PATCH if changed (still needed since activities API now handles it too — idempotent)
      if (newStatus !== lead.status) {
        await fetch(`/api/leads/${lead._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
      }

      toast.success("Lead updated successfully!");
      setOpen(false);
      setActivityNote("");
      setNextFollowUp("");
      fetchLeadDetails();
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 font-medium text-gray-500 animate-pulse">Loading lead...</div>;
  }
  if (!lead) {
    return <div className="p-6 font-medium text-red-500">Lead not found.</div>;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-[80px]">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b z-10 px-4 py-3 flex items-center shadow-sm">
        <Link href="/agent/leads" className="mr-3 p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate text-gray-900">{lead.name}</h1>
          <p className="text-xs text-gray-500 truncate">{lead.phone}</p>
        </div>
        <Badge variant="outline" className={`ml-2 whitespace-nowrap border ${STATUS_COLORS[lead.status] || "bg-gray-100"}`}>
          {lead.status}
        </Badge>
      </div>

      {/* Body Content */}
      <div className="p-4 space-y-4 overflow-y-auto">
        <div className="bg-white rounded-xl border p-4 space-y-3 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 flex items-center uppercase tracking-wider">
            <Info className="w-4 h-4 mr-2" />
            Lead Details
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Phone Number</p>
              <p className="font-medium text-sm text-gray-900">{lead.phone}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">City</p>
              <p className="font-medium text-sm text-gray-900 flex items-center">
                <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                {lead.city || "-"}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-400 mb-0.5">Lead Source</p>
              <p className="font-medium text-sm text-gray-900 flex items-center">
                <Building className="w-3 h-3 mr-1 text-gray-400" />
                {lead.source || "Direct"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4 space-y-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 flex items-center uppercase tracking-wider">
            <FileText className="w-4 h-4 mr-2" />
            Activity History
          </h2>
          {activities.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No activity recorded yet.</p>
          ) : (
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
              {activities.map((act, i) => (
                <div key={act._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-slate-300 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  </div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-slate-800">{act.type}</span>
                      <time className="font-mono text-xs text-slate-500 tracking-tight">{formatDateTime(act.timestamp)}</time>
                    </div>
                    {act.comment && <div className="text-sm text-slate-600 mb-2">{act.comment}</div>}
                    {act.nextFollowUpDate && (
                      <Badge variant="secondary" className="text-[10px] bg-yellow-100/50 text-yellow-800 border-yellow-200">
                        Follow-up: {formatDateTime(act.nextFollowUpDate)}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-[64px] left-0 right-0 bg-white border-t p-3 px-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
        <div className="flex gap-2 max-w-lg mx-auto">
          <Button 
            className="flex-1 bg-green-600 hover:bg-green-700 h-12 rounded-xl text-md"
            onClick={() => window.location.href = `tel:${lead.phone}`}
          >
            <Phone className="w-5 h-5 mr-2" />
            Call
          </Button>
          <Button 
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 h-12 rounded-xl text-md"
            onClick={() => window.open(`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`, "_blank")}
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            WhatsApp
          </Button>

          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 h-12 rounded-xl text-md shadow-md">
                Update Status
              </Button>
            </DrawerTrigger>
            <DrawerContent className="bg-white px-0 max-h-[90dvh] flex flex-col">
              {/* Fixed header */}
              <DrawerHeader className="border-b pb-3 px-4 shrink-0">
                <DrawerTitle className="text-xl text-gray-900">Update Lead</DrawerTitle>
                <DrawerDescription className="text-gray-500">Change status, add a note, or set a follow-up reminder.</DrawerDescription>
              </DrawerHeader>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-800">Change Status</Label>
                  <Select value={newStatus} onValueChange={(val) => setNewStatus(val)}>
                    <SelectTrigger className="h-12 rounded-xl bg-white border-gray-300 text-gray-900 focus:ring-blue-500 shadow-sm">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_STAGES.map(stage => (
                        <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-800">Add Internal Note</Label>
                  <textarea 
                    className="w-full flex min-h-[80px] rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    placeholder="Type details of your call/message here..."
                    value={activityNote}
                    onChange={(e) => setActivityNote(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2" data-vaul-no-drag>
                  <Label className="text-sm font-semibold flex items-center justify-between text-gray-800">
                    Next Follow-up Reminder
                    <span className="text-xs font-normal text-gray-400">(Optional)</span>
                  </Label>
                  <DateTimePicker
                    value={nextFollowUp}
                    onChange={(val) => setNextFollowUp(val)}
                  />
                </div>
              </div>

              {/* Fixed footer — always visible */}
              <div className="shrink-0 border-t px-4 py-4 space-y-2 bg-white">
                <Button
                  onClick={handleUpdate}
                  disabled={saving}
                  className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-base font-bold"
                >
                  {saving ? "Saving..." : "Save Record"}
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline" className="w-full h-11 rounded-xl">Cancel</Button>
                </DrawerClose>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </div>
  );
}
