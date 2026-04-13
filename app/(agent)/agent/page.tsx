"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Phone, ActivitySquare, X } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function AgentDashboard() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Remove follow-up state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [removeTarget, setRemoveTarget] = useState<any>(null); // the follow-up log to remove
  const [removeRemark, setRemoveRemark] = useState("");
  const [removing, setRemoving] = useState(false);

  const fetchDashboard = () => {
    fetch("/api/dashboard", { cache: "no-store" })
      .then((res) => res.json())
      .then((d) => { setData(d); setLoading(false); });
  };

  useEffect(() => { fetchDashboard(); }, []);

  const handleRemoveFollowUp = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      // Log an activity that clears the follow-up with a remark
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: removeTarget.leadId?._id,
          type: "Note",
          comment: removeRemark.trim() || "Follow-up removed",
          nextFollowUpDate: null, // clear the follow-up
          clearFollowUp: true,
        }),
      });
      if (res.ok) {
        toast.success("Follow-up removed");
        setRemoveTarget(null);
        setRemoveRemark("");
        fetchDashboard();        // refresh list
      } else {
        toast.error("Failed to remove follow-up");
      }
    } catch {
      toast.error("Error removing follow-up");
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 space-y-8 pb-24 min-h-screen bg-sand-light/30">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-serif font-bold text-secondary">Dashboard</h1>
        <div className="h-1 w-12 bg-primary mt-2 shadow-[0_0_8px_rgba(192,0,0,0.4)]" />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 md:gap-8">
        <Link href="/agent/leads" className="block group">
          <Card className="border-accent/10 shadow-lg bg-sand-light relative overflow-hidden h-full transition-all group-hover:shadow-xl group-hover:border-accent/30">
            <div className="absolute top-0 right-0 w-12 h-12 bg-accent/5 rounded-bl-full -mr-3 -mt-3" />
            <CardHeader className="p-5 pb-1">
              <CardTitle className="text-[10px] uppercase font-bold tracking-[0.1em] text-muted flex items-center gap-2">
                <Users className="w-3 h-3 text-accent" /> Total Leads
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="text-3xl font-serif font-bold text-secondary">{data?.myLeads || 0}</div>
              <p className="text-[10px] text-accent mt-1 font-medium">Assigned to you</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/agent/leads?status=Converted" className="block group">
          <Card className="border-primary/10 shadow-lg bg-white relative overflow-hidden h-full transition-all group-hover:shadow-xl group-hover:border-primary/30">
            <div className="absolute top-0 right-0 w-12 h-12 bg-primary/5 rounded-bl-full -mr-3 -mt-3" />
            <CardHeader className="p-5 pb-1">
              <CardTitle className="text-[10px] uppercase font-bold tracking-[0.1em] text-muted flex items-center gap-2">
                <ActivitySquare className="w-3 h-3 text-primary" /> Converted
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="text-3xl font-serif font-bold text-primary">{data?.myConverted || 0}</div>
              <p className="text-[10px] text-primary/60 mt-1 font-medium">Successfully closed</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Targets & Deadlines */}
        <Card className="border-accent/10 shadow-md rounded-2xl bg-white">
          <CardHeader className="p-5 pb-3 border-b bg-sand-light/50">
            <CardTitle className="text-xs uppercase tracking-[.15em] font-serif font-bold flex items-center text-secondary">
              Targets &amp; Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 flex flex-col gap-4">
            {data?.timelineGroups?.length > 0 ? (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data.timelineGroups.map((group: any) => (
                <Link key={group._id} href="/agent/leads"
                  className="flex justify-between items-center text-sm border-b border-sand pb-3 last:border-0 last:pb-0 transition-all hover:translate-x-1"
                >
                  <span className="font-bold text-secondary">{group.count} Leads Pending</span>
                  <Badge variant="outline" className="bg-sand text-accent border-accent/20 font-bold text-[9px] px-2">
                    {group._id}D DEADLINE
                  </Badge>
                </Link>
              ))
            ) : (
              <div className="text-sm text-muted italic text-center py-4">No active timeline targets.</div>
            )}
          </CardContent>
        </Card>

        {/* Lead Stages */}
        <Card className="border-accent/10 shadow-md rounded-2xl overflow-hidden bg-white">
          <CardHeader className="p-5 pb-3 border-b bg-sand-light/50">
            <CardTitle className="text-xs uppercase tracking-[.15em] font-serif font-bold flex items-center text-secondary">
              Lead Stages
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-2 gap-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {data?.statusBreakdown?.map((status: any) => (
              <Link href={`/agent/leads?status=${encodeURIComponent(status._id)}`} key={status._id}>
                <div className="flex justify-between items-center p-3 rounded-xl bg-white border border-sand hover:border-accent transition-all cursor-pointer shadow-sm">
                  <span className="text-[10px] font-bold uppercase text-secondary truncate mr-2" title={status._id}>{status._id}</span>
                  <Badge variant="secondary" className="text-[10px] bg-sand-light text-accent font-bold px-2">{status.count}</Badge>
                </div>
              </Link>
            ))}
            {(!data?.statusBreakdown || data.statusBreakdown.length === 0) && (
              <div className="col-span-2 text-sm text-muted italic text-center py-4">No leads recorded.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Follow-ups Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-serif font-bold text-secondary">Follow-up Calls</h2>
          <Button variant="link" size="sm" asChild className="p-0 h-auto text-primary text-[10px] font-bold uppercase tracking-widest">
            <Link href="/agent/leads?status=Follow-up">View All</Link>
          </Button>
        </div>

        {(!data?.followUps || data.followUps.length === 0) ? (
          <div className="text-center p-12 border-2 border-dashed rounded-3xl bg-white border-accent/10 text-muted">
            <Phone className="h-10 w-10 mx-auto mb-4 opacity-20" />
            <p className="font-serif italic">No scheduled follow-ups.</p>
            <p className="text-[10px] text-muted mt-1">Set a reminder in the Update Status drawer.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {data.followUps.map((log: any) => {
              const followDate = new Date(log.nextFollowUpDate);
              const now = new Date();
              const todayMidnight = new Date(); todayMidnight.setHours(0,0,0,0);
              const tomorrowMidnight = new Date(todayMidnight); tomorrowMidnight.setDate(tomorrowMidnight.getDate()+1);
              const isToday = followDate >= todayMidnight && followDate < tomorrowMidnight;
              const isOverdue = followDate < now;
              const isUpcoming = !isToday && !isOverdue;

              const timeStr = followDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
              const dateStr = isToday ? "Today" : followDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

              return (
                <Card key={log._id} className={`border shadow-md bg-white rounded-2xl overflow-hidden transition-all hover:shadow-lg ${isOverdue ? "border-red-200" : isToday ? "border-primary/20" : "border-accent/10"}`}>
                  <div className="flex items-stretch">
                    {/* Time strip */}
                    <div className={`flex flex-col items-center justify-center px-3 py-4 min-w-[64px] ${isOverdue ? "bg-red-500" : isToday ? "bg-secondary" : "bg-gray-100"}`}>
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${isOverdue || isToday ? "text-white/70" : "text-gray-400"}`}>
                        {isOverdue ? "OVERDUE" : dateStr}
                      </span>
                      <span className={`text-sm font-black leading-tight ${isOverdue || isToday ? "text-white" : "text-gray-700"}`}>
                        {timeStr}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-3 flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-serif font-bold text-secondary leading-tight text-sm">{log.leadId?.name}</h3>
                          <p className="text-[10px] font-bold text-muted uppercase tracking-wider mt-0.5">{log.leadId?.phone}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isUpcoming && (
                            <span className="text-[9px] font-bold bg-accent/10 text-accent px-2 py-0.5 rounded-full whitespace-nowrap">{dateStr}</span>
                          )}
                          {/* Remove follow-up button */}
                          <button
                            onClick={() => { setRemoveTarget(log); setRemoveRemark(""); }}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100 hover:text-red-600 transition-colors text-gray-400"
                            title="Remove follow-up"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      {log.comment && (
                        <p className="text-[10px] text-muted mt-1.5 line-clamp-1 italic">&quot;{log.comment}&quot;</p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" className="bg-secondary hover:bg-black text-white font-bold h-9 rounded-xl px-3 flex-1 shadow-sm" asChild>
                          <a href={`tel:${log.leadId?.phone}`} className="flex items-center justify-center gap-1.5">
                            <Phone className="w-3 h-3" /> Call
                          </a>
                        </Button>
                        <Button size="sm" variant="outline" className="border-accent/20 hover:bg-accent/10 h-9 rounded-xl px-3 text-accent font-bold" asChild>
                          <Link href={`/agent/leads/${log.leadId?._id}`}>Update</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Remove Follow-up Modal */}
      {removeTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4" onClick={() => setRemoveTarget(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif font-bold text-secondary text-lg">Remove Follow-up</h3>
                <p className="text-xs text-muted mt-0.5">
                  <span className="font-bold text-gray-700">{removeTarget.leadId?.name}</span> · {removeTarget.leadId?.phone}
                </p>
              </div>
              <button onClick={() => setRemoveTarget(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">Reason / Remark</label>
              <textarea
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
                rows={3}
                placeholder="e.g. Customer not reachable, converted via WhatsApp, etc."
                value={removeRemark}
                onChange={e => setRemoveRemark(e.target.value)}
              />
              <p className="text-[10px] text-muted">This remark will be visible to admin in the lead activity log.</p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => setRemoveTarget(null)}>
                Cancel
              </Button>
              <Button
                className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
                disabled={removing}
                onClick={handleRemoveFollowUp}
              >
                {removing ? "Removing..." : "Remove"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
