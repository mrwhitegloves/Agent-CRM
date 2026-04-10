"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, UserPlus, FileUp, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "./AuthProvider";

export function AdminNav() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const links = [
    { href: "/admin", label: "Dashboard", icon: Home },
    { href: "/admin/leads", label: "All Leads", icon: Users },
    { href: "/admin/agents", label: "Agents", icon: UserPlus },
    { href: "/admin/upload", label: "Upload Leads", icon: FileUp },
    { href: "/admin/profile", label: "Profile", icon: User },
  ];

  return (
    <>
      {/* Mobile nav (bottom) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-env(safe-area-inset-bottom)">
        <div className="flex items-center justify-between h-16 px-2 overflow-x-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-shrink-0 w-16 h-full space-y-1 text-[10px] transition-colors",
                  isActive ? "text-blue-600 font-medium" : "text-gray-500 hover:text-gray-900"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-blue-600" : "text-gray-500")} />
                <span className="truncate w-full text-center">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop nav (sidebar) */}
      <nav className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-tight text-blue-600">Sales CRM</h1>
        </div>
        <div className="flex flex-col flex-1 px-4 space-y-2 mt-4">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Icon className={cn("w-5 h-5 mr-3", isActive ? "text-blue-700" : "text-gray-400")} />
                {link.label}
              </Link>
            );
          })}
        </div>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3 text-gray-400 group-hover:text-red-700" />
            Logout
          </button>
        </div>
      </nav>
    </>
  );
}
