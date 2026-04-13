"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, UserPlus, FileUp, LogOut, User } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useAuth } from "./AuthProvider";

export function AdminNav() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const links = [
    { href: "/admin", label: "Dashboard", icon: Home },
    { href: "/admin/leads", label: "Leads", icon: Users },
    { href: "/admin/agents", label: "Agents", icon: UserPlus },
    { href: "/admin/upload", label: "Upload", icon: FileUp },
    { href: "/admin/profile", label: "Profile", icon: User },
  ];

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <>
      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.4)]" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-center justify-around h-16 px-1">
          {links.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full space-y-0.5 text-[9px] transition-colors",
                  active ? "text-accent font-bold" : "text-gray-500 hover:text-white"
                )}
              >
                <div className={cn("p-1 rounded-lg transition-all", active ? "bg-accent/10" : "")}>
                  <Icon className={cn("w-5 h-5", active ? "text-accent" : "text-gray-500")} />
                </div>
                <span className="uppercase tracking-wider">{link.label}</span>
              </Link>
            );
          })}
          <button
            onClick={logout}
            className="flex flex-col items-center justify-center flex-1 h-full space-y-0.5 text-[9px] text-gray-500 hover:text-primary transition-colors"
          >
            <div className="p-1">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="uppercase tracking-wider">Logout</span>
          </button>
        </div>
      </nav>

      {/* Desktop sidebar */}
      <nav className="hidden md:flex flex-col w-64 dark-gradient text-white border-r border-gray-800 shrink-0">
        <div className="p-8 flex flex-col items-center">
          <div className="relative w-20 h-20 mb-2">
            <Image src="/white-gloves-logo.png" alt="White Gloves" fill className="object-contain" priority />
          </div>
          <h1 className="text-xl font-serif font-bold tracking-tighter text-accent">White Gloves</h1>
        </div>
        <div className="flex flex-col flex-1 px-4 space-y-1.5 mt-2">
          {links.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                  active
                    ? "bg-white/10 text-accent shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                {active && (
                  <span className="absolute left-0 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_10px_rgba(192,0,0,0.5)]" />
                )}
                <Icon className={cn("w-4 h-4 mr-3 transition-colors", active ? "text-accent" : "text-gray-400 group-hover:text-white")} />
                {link.label}
              </Link>
            );
          })}
        </div>
        <div className="p-6 border-t border-gray-800/50">
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-400 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200 group"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center mr-3 group-hover:bg-primary/20 transition-colors">
              <LogOut className="w-4 h-4 text-gray-500 group-hover:text-primary" />
            </div>
            Logout
          </button>
        </div>
      </nav>
    </>
  );
}
