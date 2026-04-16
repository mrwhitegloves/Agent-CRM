"use client";

import { useEffect, useState, use } from "react";
import { formatDateTime, STATUS_COLORS } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  MapPin,
  Building,
  MessageSquare,
  Clock,
  Search,
  User,
  Phone,
  Activity,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEAD_STAGES } from "@/lib/utils";

// ---------- Excel helpers (SheetJS) ----------
async function downloadAgentExcel(
  agentName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  leads: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activities: any[]
) {
  const XLSX = await import("xlsx");

  // ── Sheet 1: Lead Summary ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leadRows = leads.map((lead: any) => {
    const acts = activities.filter(
      (a) => a.leadId?.toString() === lead._id?.toString()
    );
    const latest = acts[0]; // already sorted newest-first
    return {
      "Lead Name": lead.name || "",
      Phone: lead.phone || "",
      City: lead.city || "",
      Source: lead.source || "Direct",
      Status: lead.status || "",
      "Target Days": lead.timelineDays || "",
      "Latest Note": latest?.comment || "",
      "Latest Activity Type": latest?.type || "",
      "Latest Activity Date": latest?.timestamp
        ? new Date(latest.timestamp).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
          })
        : "",
      "Next Follow-up": latest?.nextFollowUpDate
        ? new Date(latest.nextFollowUpDate).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
          })
        : "",
      "Last Updated": lead.lastUpdated
        ? new Date(lead.lastUpdated).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
          })
        : "",
    };
  });

  // ── Sheet 2: Full Activity Log ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actRows = activities.map((act: any) => {
    const lead = leads.find(
      (l) => l._id?.toString() === act.leadId?.toString()
    );
    return {
      "Lead Name": lead?.name || act.leadId?.toString() || "",
      Phone: lead?.phone || "",
      City: lead?.city || "",
      Status: lead?.status || "",
      "Activity Type": act.type || "",
      Comment: act.comment || "",
      "Follow-up Date": act.nextFollowUpDate
        ? new Date(act.nextFollowUpDate).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
          })
        : "",
      Timestamp: act.timestamp
        ? new Date(act.timestamp).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
          })
        : "",
    };
  });

  const wb = XLSX.utils.book_new();

  const ws1 = XLSX.utils.json_to_sheet(leadRows);
  // Auto column widths
  ws1["!cols"] = [
    { wch: 24 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 22 },
    { wch: 12 }, { wch: 40 }, { wch: 18 }, { wch: 22 }, { wch: 22 }, { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, "Lead Summary");

  const ws2 = XLSX.utils.json_to_sheet(actRows.length ? actRows : [{ Note: "No activities recorded." }]);
  ws2["!cols"] = [
    { wch: 24 }, { wch: 16 }, { wch: 16 }, { wch: 22 },
    { wch: 14 }, { wch: 44 }, { wch: 22 }, { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, "Activity Log");

  const safe = agentName.replace(/[^a-z0-9_\- ]/gi, "_");
  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${safe}_leads_${date}.xlsx`);
}

// ─────────────────────────────────────────────

export default function AdminAgentDetailPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = use(params);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [agentData, setAgentData] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [leads, setLeads] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [downloading, setDownloading] = useState(false);

  // Detail drawer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedLead, setSelectedLead] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [leadActivities, setLeadActivities] = useState<any[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/admin/agent-detail/${agentId}`);
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setAgentData(data.agent);
        setLeads(data.leads || []);
        setActivities(data.activities || []);
      } catch {
        toast.error("Failed to load agent data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [agentId]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openLeadDetail = (lead: any) => {
    setSelectedLead(lead);
    const filtered = activities.filter(
      (a) => a.leadId?.toString() === lead._id?.toString()
    );
    setLeadActivities(filtered);
    setDrawerOpen(true);
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      !search ||
      lead.name?.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone?.includes(search) ||
      lead.city?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Summary stats
  const totalLeads = leads.length;
  const converted = leads.filter((l) => l.status === "Converted").length;
  const withNotes = leads.filter((l) => l.latestActivity?.comment).length;

  // ── Download handler ──
  const handleDownload = async (scope: "all" | "filtered") => {
    if (downloading) return;
    setDownloading(true);
    try {
      const targetLeads = scope === "all" ? leads : filteredLeads;
      if (targetLeads.length === 0) {
        toast.error("No leads to export.");
        return;
      }
      // Only include activities for leads in scope
      const leadIds = new Set(targetLeads.map((l) => l._id?.toString()));
      const targetActivities = activities.filter((a) =>
        leadIds.has(a.leadId?.toString())
      );
      await downloadAgentExcel(
        agentData?.name || "Agent",
        targetLeads,
        targetActivities
      );
      toast.success(
        `Downloaded ${targetLeads.length} leads for ${agentData?.name}`
      );
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate Excel file");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-5xl mx-auto">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!agentData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
        <div className="text-5xl">🔍</div>
        <h2 className="text-xl font-bold text-gray-800">Agent Not Found</h2>
        <Link
          href="/admin"
          className="px-6 py-3 bg-secondary text-white rounded-xl font-bold text-sm"
        >
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const hasFilter = search || statusFilter !== "all";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── HEADER ── */}
      <div className="sticky top-0 z-30 bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>

          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0 ${
                agentData.isActive ? "bg-secondary" : "bg-gray-400"
              }`}
            >
              {agentData.name?.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                {agentData.name}
              </h1>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    agentData.isActive ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {agentData.isActive ? "● Active" : "○ Inactive"}
                </span>
                {agentData.email && (
                  <span className="text-xs text-gray-400 hidden sm:inline truncate">
                    · {agentData.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── DOWNLOAD BUTTON ── */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Download visible (filtered) leads */}
            {hasFilter && filteredLeads.length > 0 && (
              <button
                onClick={() => handleDownload("filtered")}
                disabled={downloading}
                title={`Download ${filteredLeads.length} filtered leads`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {downloading ? "Exporting…" : `Export ${filteredLeads.length}`}
                </span>
              </button>
            )}

            {/* Download ALL leads */}
            <button
              onClick={() => handleDownload("all")}
              disabled={downloading || leads.length === 0}
              title="Download all leads as Excel"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 text-xs font-bold transition-colors disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {downloading ? "Exporting…" : `Download All (${leads.length})`}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* ── STATS CARDS ── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-3xl font-bold text-secondary">{totalLeads}</p>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mt-1">
              Assigned
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{converted}</p>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mt-1">
              Converted
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{withNotes}</p>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mt-1">
              With Notes
            </p>
          </div>
        </div>

        {/* ── FILTERS ── */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search name, phone, city…"
              className="pl-9 bg-white border-gray-200 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-36 shrink-0">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-white border-gray-200 rounded-xl h-10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {LEAD_STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── LEADS LIST ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
              {filteredLeads.length} Lead{filteredLeads.length !== 1 ? "s" : ""}
              {hasFilter && (
                <span className="ml-1 text-blue-500">
                  (filtered from {leads.length})
                </span>
              )}
            </p>
          </div>

          {filteredLeads.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <p className="text-gray-400 text-sm">No leads match your filter.</p>
            </div>
          ) : (
            filteredLeads.map((lead) => (
              <button
                key={lead._id}
                onClick={() => openLeadDetail(lead)}
                className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 active:scale-[0.99] transition-all p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: name + meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {lead.name}
                      </h3>
                      <Badge
                        variant="outline"
                        className={`text-[9px] shrink-0 border font-bold ${
                          STATUS_COLORS[lead.status] || "bg-gray-100"
                        }`}
                      >
                        {lead.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {lead.phone}
                      </span>
                      {lead.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {lead.city}
                        </span>
                      )}
                      {lead.source && (
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3" /> {lead.source}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Right: last activity note preview */}
                  <div className="shrink-0 text-right hidden sm:block max-w-[200px]">
                    {lead.latestActivity?.comment ? (
                      <p className="text-[11px] text-gray-500 italic line-clamp-2">
                        &ldquo;{lead.latestActivity.comment}&rdquo;
                      </p>
                    ) : (
                      <p className="text-[11px] text-gray-300 italic">
                        No note yet
                      </p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {lead.lastUpdated ? formatDateTime(lead.lastUpdated) : "—"}
                    </p>
                  </div>
                </div>

                {/* Mobile note */}
                {lead.latestActivity?.comment && (
                  <div className="mt-2 sm:hidden pt-2 border-t border-gray-50">
                    <p className="text-[11px] text-gray-500 italic line-clamp-2">
                      &ldquo;{lead.latestActivity.comment}&rdquo;
                    </p>
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── LEAD DETAIL SLIDE-IN PANEL ── */}
      {drawerOpen && selectedLead && (
        <>
          {/* backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          {/* panel */}
          <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl flex flex-col overflow-hidden animate-slide-in-right">
            {/* Panel header */}
            <div className="border-b px-5 py-4 flex items-start justify-between bg-secondary text-white">
              <div>
                <h2 className="text-lg font-bold">{selectedLead.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge
                    variant="outline"
                    className={`text-[10px] border font-bold ${
                      STATUS_COLORS[selectedLead.status] ||
                      "bg-gray-100 text-gray-800 border-gray-200"
                    }`}
                  >
                    {selectedLead.status}
                  </Badge>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-lg hover:bg-white/20 transition-colors ml-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Lead Info Card */}
              <div className="bg-gray-50 rounded-2xl border p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Lead Information
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">
                      Phone
                    </p>
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-gray-400" />
                      {selectedLead.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">
                      City
                    </p>
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {selectedLead.city || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">
                      Source
                    </p>
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-1 mt-0.5">
                      <Building className="w-3 h-3 text-gray-400" />
                      {selectedLead.source || "Direct"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">
                      Last Updated
                    </p>
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-gray-400" />
                      {selectedLead.lastUpdated
                        ? formatDateTime(selectedLead.lastUpdated)
                        : "—"}
                    </p>
                  </div>
                  {selectedLead.timelineDays && (
                    <div className="col-span-2">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">
                        Target
                      </p>
                      <p className="text-sm font-semibold text-orange-600 mt-0.5">
                        {selectedLead.timelineDays} Days
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Activity Log */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2 mb-3">
                  <Activity className="w-3.5 h-3.5" /> Agent Activity Log
                  <span className="ml-auto bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {leadActivities.length}
                  </span>
                </h3>

                {leadActivities.length === 0 ? (
                  <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-8 text-center">
                    <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400 italic">
                      No activity recorded yet for this lead.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leadActivities.map((act) => (
                      <div
                        key={act._id}
                        className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              {act.type}
                            </span>
                          </div>
                          <time className="text-[10px] text-gray-400 font-mono">
                            {formatDateTime(act.timestamp)}
                          </time>
                        </div>
                        {act.comment && (
                          <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                            {act.comment}
                          </p>
                        )}
                        {act.nextFollowUpDate && (
                          <div className="mt-2">
                            <Badge
                              variant="secondary"
                              className="text-[10px] bg-yellow-50 text-yellow-700 border border-yellow-200"
                            >
                              Follow-up: {formatDateTime(act.nextFollowUpDate)}
                            </Badge>
                          </div>
                        )}
                        {!act.comment && !act.nextFollowUpDate && (
                          <p className="text-xs text-gray-300 italic">
                            No details recorded.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx global>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.28s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
}
