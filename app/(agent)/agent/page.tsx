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
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of your leads and activities.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-6">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Leads</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{data?.myLeads || 0}</div>
            <Users className="h-4 w-4 text-blue-500 absolute top-4 right-4" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Converted</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-green-600">{data?.myConverted || 0}</div>
            <ActivitySquare className="h-4 w-4 text-green-500 absolute top-4 right-4" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
        <Card>
          <CardHeader className="p-4 pb-2 border-b">
            <CardTitle className="text-base font-semibold">Targets & Deadlines</CardTitle>
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
            <CardTitle className="text-base font-semibold">Lead Stage Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-2 gap-2">
             {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
             {data?.statusBreakdown?.map((status: any) => (
                <Link href={`/agent/leads?status=${status._id}`} key={status._id}>
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
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Today's Follow-ups</h2>
          <Button variant="link" size="sm" asChild className="px-0">
            <Link href="/agent/leads?status=Follow-up">View all</Link>
          </Button>
        </div>
        {data?.followUps?.length === 0 ? (
          <div className="text-center p-6 border rounded-lg bg-white border-dashed text-gray-500">
            <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No follow-ups for today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {data?.followUps?.map((log: any) => (
              <Card key={log._id} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-sm">{log.leadId.name}</h3>
                    <p className="text-xs text-gray-500">{log.leadId.phone}</p>
                  </div>
                  <Badge variant="outline">{formatDateTime(log.nextFollowUpDate)}</Badge>
                </div>
                {log.comment && (
                  <p className="text-xs bg-gray-50 p-2 rounded line-clamp-2 mt-2 border border-gray-100">{log.comment}</p>
                )}
                <div className="mt-3 flex gap-2">
                  <Button size="sm" className="w-full text-xs h-8" asChild>
                    <a href={`tel:${log.leadId.phone}`}>Call</a>
                  </Button>
                  <Button size="sm" variant="outline" className="w-full text-xs h-8" asChild>
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
