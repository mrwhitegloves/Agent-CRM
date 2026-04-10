import Link from "next/link";
import { formatDateTime, STATUS_COLORS } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, ChevronRight } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function MobileLeadCard({ lead }: { lead: any }) {
  return (
    <Link href={`/agent/leads/${lead._id}`} className="block">
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-transform relative overflow-hidden">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-lg text-gray-900">{lead.name}</h3>
            {lead.city && (
              <div className="flex items-center text-gray-500 text-xs mt-1">
                <MapPin className="w-3 h-3 mr-1" />
                {lead.city}
              </div>
            )}
          </div>
          <Badge variant="outline" className={`border font-medium ${STATUS_COLORS[lead.status] || "bg-gray-100"}`}>
            {lead.status}
          </Badge>
        </div>

        {lead.timelineDays && (
          <div className="mb-3">
            <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-100 font-mono text-[10px] py-0 px-2">
              Target: {lead.timelineDays} Days
            </Badge>
          </div>
        )}
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center text-xs text-gray-400">
            <Clock className="w-3 h-3 mr-1" />
            Last updated: {formatDateTime(lead.lastUpdated)}
          </div>
          <div className="bg-gray-50 p-1.5 rounded-full">
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
    </Link>
  );
}
