"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Phone, BadgeIndianRupee, ActivitySquare } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AgentDashboard() {
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
    return <div className="p-4 md:p-8 animate-pulse space-y-4">
      <div className="h-10 bg-gray-200 rounded w-1/3 mb-6"></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-24 bg-gray-200 rounded"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
      </div>
    </div>;
  }

  return (
    <div className="p-5 md:p-8 space-y-8 pb-24 min-h-screen bg-sand-light/30">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-serif font-bold text-secondary">Dashboard</h1>
        <div className="h-1 w-12 bg-primary mt-2 shadow-[0_0_8px_rgba(192,0,0,0.4)]" />
      </div>

      <div className="grid grid-cols-2 gap-4 md:gap-8">
        <Card className="border-accent/10 shadow-lg bg-sand-light relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-12 h-12 bg-accent/5 rounded-bl-full -mr-3 -mt-3" />
          <CardHeader className="p-5 pb-1">
            <CardTitle className="text-[10px] uppercase font-bold tracking-[0.1em] text-muted flex items-center gap-2">
              <Users className="w-3 h-3 text-accent" /> Total Leads
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="text-3xl font-serif font-bold text-secondary">{data?.myLeads || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="border-primary/10 shadow-lg bg-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-12 h-12 bg-primary/5 rounded-bl-full -mr-3 -mt-3" />
          <CardHeader className="p-5 pb-1">
            <CardTitle className="text-[10px] uppercase font-bold tracking-[0.1em] text-muted flex items-center gap-2">
               <ActivitySquare className="w-3 h-3 text-primary" /> Converted
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="text-3xl font-serif font-bold text-primary">{data?.myConverted || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-accent/10 shadow-md rounded-2xl bg-white">
          <CardHeader className="p-5 pb-3 border-b bg-sand-light/50">
            <CardTitle className="text-xs uppercase tracking-[.15em] font-serif font-bold flex items-center text-secondary">
               Targets & Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 flex flex-col gap-4">
             {data?.timelineGroups?.length > 0 ? (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                data.timelineGroups.map((group: any) => (
                  <div key={group._id} className="flex justify-between items-center text-sm border-b border-sand pb-3 last:border-0 last:pb-0 transition-all hover:translate-x-1">
                    <span className="font-bold text-secondary">{group.count} Leads Pending</span>
                    <Badge variant="outline" className="bg-sand text-accent border-accent/20 font-bold text-[9px] px-2">
                      {group._id}D DEADLINE
                    </Badge>
                  </div>
                ))
             ) : (
                <div className="text-sm text-muted italic text-center py-4">No active timeline targets.</div>
             )}
          </CardContent>
        </Card>

        <Card className="border-accent/10 shadow-md rounded-2xl overflow-hidden bg-white">
          <CardHeader className="p-5 pb-3 border-b bg-sand-light/50">
            <CardTitle className="text-xs uppercase tracking-[.15em] font-serif font-bold flex items-center text-secondary">
               Lead Stages
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-2 gap-2">
             {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
             {data?.statusBreakdown?.map((status: any) => (
                <Link href={`/agent/leads?status=${status._id}`} key={status._id}>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-white border border-sand hover:border-accent transition-all cursor-pointer shadow-sm">
                    <span className="text-[10px] font-bold uppercase text-secondary truncate mr-2" title={status._id}>{status._id}</span>
                    <Badge variant="secondary" className="text-[10px] bg-sand-light text-accent font-bold px-2">{status.count}</Badge>
                  </div>
                </Link>
             ))}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-serif font-bold text-secondary">Today's Follow-ups</h2>
          <Button variant="link" size="sm" asChild className="p-0 h-auto text-primary text-[10px] font-bold uppercase tracking-widest">
            <Link href="/agent/leads?status=Follow-up">View All</Link>
          </Button>
        </div>
        
        {data?.followUps?.length === 0 ? (
          <div className="text-center p-12 border-2 border-dashed rounded-3xl bg-white border-accent/10 text-muted">
            <Phone className="h-10 w-10 mx-auto mb-4 opacity-20" />
            <p className="font-serif italic">No follow-ups for today.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {data?.followUps?.map((log: any) => (
              <Card key={log._id} className="p-5 border-accent/10 shadow-lg bg-white rounded-3xl hover:border-accent/40 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-0.5">
                    <h3 className="font-serif font-bold text-secondary">{log.leadId.name}</h3>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider">{log.leadId.phone}</p>
                  </div>
                  <Badge variant="outline" className="bg-primary text-white border-none font-bold text-[9px] px-2 py-1 flex flex-col items-center">
                    <span className="font-black italic">ALERT</span>
                    {formatDateTime(log.nextFollowUpDate).split(',')[1]}
                  </Badge>
                </div>
                {log.comment && (
                  <p className="text-[11px] bg-sand-light/50 text-secondary p-4 rounded-2xl italic border border-accent/5 mb-4 leading-relaxed line-clamp-2">
                    "{log.comment}"
                  </p>
                )}
                <div className="flex gap-3">
                  <Button size="sm" className="bg-secondary hover:bg-black text-white font-bold h-10 rounded-xl px-4 flex-1 shadow-md" asChild>
                    <a href={`tel:${log.leadId.phone}`} className="flex items-center justify-center gap-2">
                       <Phone className="w-3 h-3" /> Call
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" className="border-accent/20 hover:bg-accent/10 h-10 rounded-xl px-4 text-accent font-bold" asChild>
                    <Link href={`/agent/leads`}>Update</Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
