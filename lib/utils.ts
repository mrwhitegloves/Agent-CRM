import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

export const STATUS_COLORS: Record<string, string> = {
  "New Lead": "bg-blue-500/20 text-blue-700 border-blue-500/30",
  Contacted: "bg-blue-200 text-blue-800 border-blue-300",
  DNP: "bg-red-100 text-red-800 border-red-200",
  Interested: "bg-emerald-100 text-emerald-800 border-emerald-300",
  "Follow-up": "bg-yellow-100 text-yellow-800 border-yellow-300",
  Converted: "bg-green-100 text-green-800 border-green-300",
  "Not Interested": "bg-gray-100 text-gray-800 border-gray-300",
  "NATC (Not able to connect)": "bg-orange-100 text-orange-800 border-orange-200",
};

export const LEAD_STAGES = [
  "New Lead",
  "Contacted",
  "DNP",
  "Interested",
  "Follow-up",
  "Converted",
  "Not Interested",
  "NATC (Not able to connect)",
];
