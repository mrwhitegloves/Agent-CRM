"use client";

import { useEffect, useState, useCallback } from "react";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Clock, AlertCircle, UserCheck, RefreshCw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unassigning, setUnassigning] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
    } catch {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUnassignExpired = async () => {
    setUnassigning(true);
    try {
      const res = await fetch("/api/leads/unassign-expired", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Done");
        fetchData();
      } else {
        toast.error(data.error || "Failed");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setUnassigning(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="h-10 bg-gray-100 rounded animate-pulse w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-serif font-bold tracking-tight text-secondary">Dashboard</h1>
          <p className="text-sm text-muted">Overview of all leads and agent performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-[10px] uppercase font-bold text-accent tracking-[.2em] hidden md:block">
            Updated: {lastUpdated.toLocaleTimeString()}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="text-xs border-accent/20 hover:bg-accent/5"
          >
            <RefreshCw className="w-3 h-3 mr-1.5" /> Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleUnassignExpired}
            disabled={unassigning}
            className="text-xs border-primary/20 text-primary hover:bg-primary/5"
          >
            <AlertCircle className="w-3 h-3 mr-1.5" />
            {unassigning ? "Processing..." : "Unassign Expired"}
          </Button>
        </div>
      </div>

      {/* Stats Cards - 2 col on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Link href="/admin/leads" className="block group">
          <Card className="border-accent/10 shadow-sm bg-sand-light relative overflow-hidden h-full transition-all group-hover:shadow-md group-hover:border-accent/30">
            <div className="absolute top-0 right-0 w-16 h-16 bg-accent/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-[10px] uppercase font-bold tracking-[.1em] text-muted flex items-center gap-2">
                <Users className="w-3 h-3 text-accent" /> Total Leads
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="text-3xl font-serif font-bold text-secondary">{data?.totalLeads || 0}</div>
              <p className="text-[10px] text-accent mt-1 font-medium italic">All leads in system</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/leads?status=Converted" className="block group">
          <Card className="border-primary/10 shadow-sm bg-white relative overflow-hidden h-full transition-all group-hover:shadow-md group-hover:border-primary/30">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-[10px] uppercase font-bold tracking-[.1em] text-muted flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-primary" /> Converted
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="text-3xl font-serif font-bold text-primary">{data?.converted || 0}</div>
              <p className="text-[10px] text-primary/60 mt-1 font-medium italic">Successfully converted</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/leads?status=New Lead" className="block group">
          <Card className="border-accent/10 shadow-sm bg-sand-light relative overflow-hidden h-full transition-all group-hover:shadow-md group-hover:border-accent/30">
            <div className="absolute top-0 right-0 w-16 h-16 bg-accent/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-[10px] uppercase font-bold tracking-[.1em] text-muted flex items-center gap-2">
                <Clock className="w-3 h-3 text-accent" /> New Today
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="text-3xl font-serif font-bold text-secondary">{data?.newToday || 0}</div>
              <p className="text-[10px] text-accent mt-1 font-medium italic">Added in last 24 hours</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/leads" className="block group">
          <Card className="border-orange-200 shadow-sm bg-orange-50 relative overflow-hidden h-full transition-all group-hover:shadow-md group-hover:border-orange-300">
            <div className="absolute top-0 right-0 w-16 h-16 bg-orange-100 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-[10px] uppercase font-bold tracking-[.1em] text-orange-600 flex items-center gap-2">
                <UserCheck className="w-3 h-3 text-orange-500" /> Unassigned
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="text-3xl font-serif font-bold text-orange-700">{data?.unassignedCount || 0}</div>
              <p className="text-[10px] text-orange-500 mt-1 font-medium italic">Awaiting assignment</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Agent Lead Distribution */}
      {data?.agentLeadCounts && data.agentLeadCounts.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-serif font-bold text-secondary">Lead Distribution</h2>
            <p className="text-xs text-muted uppercase tracking-wider font-bold">Leads assigned to each agent</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {data.agentLeadCounts.map((agent: any) => (
              <Card key={agent._id} className="border-accent/10 bg-white hover:shadow-md transition-all">
                <CardContent className="p-4 space-y-3">
                  {/* Agent header */}
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-serif font-bold text-white text-[11px] shrink-0 ${agent.isActive ? "bg-secondary" : "bg-gray-400"}`}>
                      {agent.name?.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-secondary truncate">{agent.name}</p>
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${agent.isActive ? "text-green-600" : "text-red-500"}`}>
                        {agent.isActive ? "● Active" : "○ Inactive"}
                      </span>
                    </div>
                  </div>

                  {/* Assigned / Converted row */}
                  <div className="flex justify-between items-end border-b border-gray-100 pb-2">
                    <div>
                      <p className="text-2xl font-serif font-bold text-secondary">{agent.leadsCount}</p>
                      <p className="text-[9px] text-muted font-bold uppercase">Assigned</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-serif font-bold text-primary">{agent.convertedCount}</p>
                      <p className="text-[9px] text-primary/60 font-bold uppercase">Converted</p>
                    </div>
                  </div>

                  {/* Status breakdown chips */}
                  {agent.statusBreakdown && agent.statusBreakdown.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {agent.statusBreakdown
                        .slice()
                        .sort((a: any, b: any) => b.count - a.count)
                        .map((s: any) => {
                          const colorMap: Record<string, string> = {
                            "New Lead": "bg-blue-50 text-blue-700 border-blue-200",
                            "Contacted": "bg-sky-50 text-sky-700 border-sky-200",
                            "DNP": "bg-red-50 text-red-700 border-red-200",
                            "Interested": "bg-emerald-50 text-emerald-700 border-emerald-200",
                            "Follow-up": "bg-yellow-50 text-yellow-700 border-yellow-200",
                            "Converted": "bg-green-50 text-green-700 border-green-200",
                            "Not Interested": "bg-gray-100 text-gray-600 border-gray-200",
                            "NATC (Not Active To Call)": "bg-orange-50 text-orange-700 border-orange-200",
                          };
                          const color = colorMap[s.status] || "bg-gray-100 text-gray-600 border-gray-200";
                          return (
                            <span
                              key={s.status}
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-bold ${color}`}
                              title={s.status}
                            >
                              <span className="max-w-[70px] truncate">{s.status}</span>
                              <span className="shrink-0 font-extrabold">{s.count}</span>
                            </span>
                          );
                        })}
                    </div>
                  ) : (
                    <p className="text-[9px] text-muted italic">No leads yet</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

        </div>
      )}

      {/* Middle Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-accent/10 shadow-md">
          <CardHeader className="p-5 pb-4 border-b bg-sand-light/50">
            <CardTitle className="text-xs uppercase tracking-[.15em] font-serif font-bold flex items-center text-secondary">
              <div className="w-2 h-2 bg-primary rounded-full mr-3 shadow-[0_0_8px_rgba(192,0,0,0.4)]" />
              Deadlines &amp; Targets
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 flex flex-col gap-4">
            {data?.timelineGroups?.length > 0 ? (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data.timelineGroups.map((group: any) => (
                <Link key={group._id} href={`/admin/leads`} className="flex justify-between items-center group/item hover:translate-x-1 transition-transform">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-secondary">{group.count} Leads Pending</span>
                    <span className="text-[9px] uppercase tracking-wider text-muted font-bold">Pending</span>
                  </div>
                  <Badge variant="outline" className="bg-sand-light text-accent border-accent/20 px-3 py-1 font-bold text-[10px]">
                    TARGET: {group._id} DAYS
                  </Badge>
                </Link>
              ))
            ) : (
              <div className="text-sm text-muted italic text-center py-4">No active timeline targets.</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-accent/10 shadow-md">
          <CardHeader className="p-5 pb-4 border-b bg-sand-light/50">
            <CardTitle className="text-xs uppercase tracking-[.15em] font-serif font-bold flex items-center text-secondary">
              <div className="w-2 h-2 bg-accent rounded-full mr-3 shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
              Lead Stages
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 grid grid-cols-2 gap-3">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {data?.statusBreakdown?.map((status: any) => (
              <Link href={`/admin/leads?status=${encodeURIComponent(status._id)}`} key={status._id} className="group cursor-pointer">
                <div className="flex justify-between items-center p-3 rounded-xl bg-white border border-sand hover:border-accent hover:shadow-sm transition-all">
                  <span className="text-[10px] font-bold uppercase tracking-tight text-secondary truncate mr-2" title={status._id}>{status._id}</span>
                  <span className="w-6 h-6 rounded-lg bg-sand-light text-accent border border-accent/20 flex items-center justify-center text-[10px] font-bold group-hover:bg-accent group-hover:text-white transition-colors">
                    {status.count}
                  </span>
                </div>
              </Link>
            ))}
            {(!data?.statusBreakdown || data.statusBreakdown.length === 0) && (
              <div className="col-span-2 text-sm text-muted italic text-center py-4">No leads recorded.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Agent Performance Table */}
      <div className="space-y-6 pt-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-secondary">Agent Performance</h2>
          <p className="text-xs text-muted uppercase tracking-wider font-bold">Top agents &amp; conversion rates</p>
        </div>

        <Card className="border-accent/10 shadow-xl overflow-hidden rounded-2xl bg-white">
          {/* Mobile: card view */}
          <div className="block md:hidden divide-y divide-gray-50">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {data?.agentPerformance?.map((agent: any) => {
              const convRate = agent.total > 0 ? (agent.converted / agent.total) * 100 : 0;
              const isKiller = convRate >= 10 && agent.converted > 0;
              return (
                <div key={agent._id} className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-serif text-white text-sm shrink-0 ${agent.isActive ? "bg-secondary" : "bg-gray-400"}`}>
                    {agent.name?.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-secondary truncate">{agent.name}</p>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${agent.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {agent.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-muted">{agent.total} leads</span>
                      <span className="text-xs text-primary font-bold">{agent.converted} converted</span>
                      <span className="text-xs font-bold text-secondary">{convRate.toFixed(0)}%</span>
                    </div>
                    {isKiller && <p className="text-[9px] uppercase font-bold text-primary mt-0.5">★ Master Closer</p>}
                  </div>
                </div>
              );
            })}
            {(!data?.agentPerformance || data.agentPerformance.length === 0) && (
              <div className="text-center py-8 text-muted italic text-sm">No agent data.</div>
            )}
          </div>
          {/* Desktop: table view */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-secondary">
                <TableRow className="hover:bg-secondary border-b-accent/20">
                  <TableHead className="text-white font-serif tracking-wide h-14">AGENT NAME</TableHead>
                  <TableHead className="text-center text-white font-serif tracking-wide h-14 uppercase text-[10px]">Status</TableHead>
                  <TableHead className="text-center text-white font-serif tracking-wide h-14 uppercase text-[10px]">Records Assigned</TableHead>
                  <TableHead className="text-center text-accent font-serif tracking-wide h-14 uppercase text-[10px]">Conversions</TableHead>
                  <TableHead className="text-center text-white font-serif tracking-wide h-14 uppercase text-[10px]">Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {data?.agentPerformance?.map((agent: any) => {
                  const convRate = agent.total > 0 ? (agent.converted / agent.total) * 100 : 0;
                  const isKiller = convRate >= 10 && agent.converted > 0;

                  return (
                    <TableRow key={agent._id} className="hover:bg-sand-light/30 border-b-accent/5 transition-colors">
                      <TableCell className="font-medium p-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-serif text-white text-[10px] ${agent.isActive ? "bg-secondary" : "bg-gray-400"}`}>
                            {agent.name?.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-secondary">Agent {agent.name}</span>
                            {isKiller && (
                              <span className="text-[8px] uppercase tracking-widest font-bold text-primary flex items-center gap-1">
                                <span className="w-1 h-1 bg-primary rounded-full animate-pulse" /> Master Closer
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center p-5">
                        <Badge variant="outline" className={agent.isActive ? "bg-green-50 text-green-700 border-green-200 text-[9px]" : "bg-red-50 text-red-700 border-red-200 text-[9px]"}>
                          {agent.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center p-5 font-bold text-secondary">{agent.total}</TableCell>
                      <TableCell className="text-center p-5 font-bold text-primary">{agent.converted}</TableCell>
                      <TableCell className="text-center p-5">
                        <div className="flex items-center justify-center gap-4">
                          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                            <div
                              className={`h-full transition-all duration-1000 ${isKiller ? "bg-gradient-to-r from-primary to-accent" : "bg-accent/40"}`}
                              style={{ width: `${Math.min(convRate, 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-secondary w-8 tracking-tighter">{convRate.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!data?.agentPerformance || data.agentPerformance.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted italic">
                      No agent data available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
