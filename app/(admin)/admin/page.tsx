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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of CRM performance and agents.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Leads</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{data?.totalLeads || 0}</div>
            <Users className="h-4 w-4 text-blue-500 absolute top-4 right-4 hidden md:block" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Converted</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-green-600">{data?.converted || 0}</div>
            <TrendingUp className="h-4 w-4 text-green-500 absolute top-4 right-4 hidden md:block" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">New Leads Today</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-blue-600">{data?.newToday || 0}</div>
          </CardContent>
        </Card>
        
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader className="p-4 pb-2 border-b">
            <CardTitle className="text-base font-semibold">Targets & Deadlines (All Agents)</CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex flex-col gap-3">
             {data?.timelineGroups?.length > 0 ? (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                data.timelineGroups.map((group: any) => (
                  <div key={group._id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
                    <span className="font-medium text-gray-700">{group.count} Leads</span>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      Target: {group._id} Days
                    </Badge>
                  </div>
                ))
             ) : (
                <div className="text-sm text-gray-500 text-center py-2">No active timeline targets.</div>
             )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2 border-b">
            <CardTitle className="text-base font-semibold">Overall Lead Stage Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-2 gap-2">
             {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
             {data?.statusBreakdown?.map((status: any) => (
                <Link href={`/admin/leads?status=${status._id}`} key={status._id}>
                  <div className="flex justify-between items-center p-2 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100 cursor-pointer">
                    <span className="text-xs font-medium text-gray-700 truncate mr-2" title={status._id}>{status._id}</span>
                    <Badge variant="secondary" className="text-xs">{status.count}</Badge>
                  </div>
                </Link>
             ))}
             {(!data?.statusBreakdown || data.statusBreakdown.length === 0) && (
                <div className="col-span-2 text-sm text-gray-500 text-center py-2">No leads available.</div>
             )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Agent Performance</h2>
          <p className="text-sm text-gray-500">Killer vs Time-wasters metrics.</p>
        </div>
        
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Agent Name</TableHead>
                  <TableHead className="text-center">Total Assigned</TableHead>
                  <TableHead className="text-center">Converted</TableHead>
                  <TableHead className="text-center">Conversion %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {data?.agentPerformance?.map((agent: any) => {
                  const convRate = agent.total > 0 ? (agent.converted / agent.total) * 100 : 0;
                  const isKiller = convRate >= 10 && agent.converted > 0;
                  
                  return (
                    <TableRow key={agent._id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {agent.name}
                          {isKiller && <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200">Killer</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{agent.total}</TableCell>
                      <TableCell className="text-center font-semibold text-green-600">{agent.converted}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${isKiller ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-blue-400'}`} 
                              style={{ width: `${Math.min(convRate, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-8">{convRate.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!data?.agentPerformance || data.agentPerformance.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                      No agent performance data. Assign leads and convert them first.
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
