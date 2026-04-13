"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, UserCircle, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "./AuthProvider";

export function AgentNav() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const links = [
    { href: "/agent", label: "Dashboard", icon: Home },
    { href: "/agent/leads", label: "Leads", icon: Users },
    { href: "/agent/profile", label: "Profile", icon: UserCircle },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-gray-800 safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
      <div className="flex items-center justify-around h-16 px-4">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = link.href === "/agent"
            ? pathname === "/agent"
            : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 text-[10px] transition-all",
                isActive ? "text-accent font-bold" : "text-gray-500 hover:text-white"
              )}
            >
              <div className={cn(
                "p-1 rounded-lg transition-all",
                isActive ? "bg-accent/10" : "bg-transparent"
              )}>
                <Icon className={cn("w-5 h-5", isActive ? "text-accent" : "text-gray-500")} />
              </div>
              <span className="uppercase tracking-wider">{link.label}</span>
            </Link>
          );
        })}
        <button
          onClick={logout}
          className="flex flex-col items-center justify-center w-full h-full space-y-1 text-[10px] text-gray-500 hover:text-primary transition-colors"
        >
          <div className="p-1">
            <LogOut className="w-5 h-5" />
          </div>
          <span className="uppercase tracking-wider">Logout</span>
        </button>
      </div>
    </nav>
  );
}
