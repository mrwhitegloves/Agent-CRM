"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function AdminDashboard() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="animate-pulse space-y-4">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-3xl font-serif font-bold tracking-tight text-secondary">Dashboard</h1>
          <p className="text-sm text-muted">Overview of all leads and agent performance.</p>
        </div>
        <div className="hidden md:block">
          <p className="text-[10px] uppercase font-bold text-accent tracking-[.2em]">Last updated: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-accent/10 shadow-sm bg-sand-light relative overflow-hidden group">
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
        
        <Card className="border-primary/10 shadow-sm bg-white relative overflow-hidden group">
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

        <Card className="border-accent/10 shadow-sm bg-sand-light relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-accent/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-[10px] uppercase font-bold tracking-[.1em] text-muted">New Today</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="text-3xl font-serif font-bold text-secondary">{data?.newToday || 0}</div>
            <p className="text-[10px] text-accent mt-1 font-medium italic">Added in last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-accent/10 shadow-md">
          <CardHeader className="p-5 pb-4 border-b bg-sand-light/50">
            <CardTitle className="text-xs uppercase tracking-[.15em] font-serif font-bold flex items-center text-secondary">
              <div className="w-2 h-2 bg-primary rounded-full mr-3 shadow-[0_0_8px_rgba(192,0,0,0.4)]" />
              Deadlines & Targets
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 flex flex-col gap-4">
             {data?.timelineGroups?.length > 0 ? (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                data.timelineGroups.map((group: any) => (
                  <div key={group._id} className="flex justify-between items-center group/item hover:translate-x-1 transition-transform">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-secondary">{group.count} Leads Pending</span>
                      <span className="text-[9px] uppercase tracking-wider text-muted font-bold">Pending</span>
                    </div>
                    <Badge variant="outline" className="bg-sand-light text-accent border-accent/20 px-3 py-1 font-bold text-[10px]">
                      TARGET: {group._id} DAYS
                    </Badge>
                  </div>
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
                <Link href={`/admin/leads?status=${status._id}`} key={status._id} className="group cursor-pointer">
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

      <div className="space-y-6 pt-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-secondary">Agent Performance</h2>
          <p className="text-xs text-muted uppercase tracking-wider font-bold">Top agents & conversion rates</p>
        </div>
        
        <Card className="border-accent/10 shadow-xl overflow-hidden rounded-2xl bg-white">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-secondary">
                <TableRow className="hover:bg-secondary border-b-accent/20">
                  <TableHead className="text-white font-serif tracking-wide h-14">AGENT NAME</TableHead>
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
                          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-serif text-white text-[10px]">
                            {agent.name.substring(0,2).toUpperCase()}
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
                      <TableCell className="text-center p-5 font-bold text-secondary">{agent.total}</TableCell>
                      <TableCell className="text-center p-5 font-bold text-primary">{agent.converted}</TableCell>
                      <TableCell className="text-center p-5">
                        <div className="flex items-center justify-center gap-4">
                          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                            <div 
                              className={`h-full transition-all duration-1000 ${isKiller ? 'bg-gradient-to-r from-primary to-accent' : 'bg-accent/40'}`} 
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
                    <TableCell colSpan={4} className="text-center py-12 text-muted italic">
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
