"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/shared/AuthProvider";
import toast from "react-hot-toast";

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || user.role !== "agent") return;

    // Ask for notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const checkFollowUps = async () => {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) return;
        const data = await res.json();
        
        const now = new Date();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.followUps?.forEach((log: any) => {
          if (!log.nextFollowUpDate) return;
          const followUpTime = new Date(log.nextFollowUpDate);
          
          // Check if followUpTime is exactly around now (within 5 minutes)
          const diffMs = followUpTime.getTime() - now.getTime();
          const diffMinutes = Math.floor(diffMs / 60000);

          if (diffMinutes >= 0 && diffMinutes <= 5) {
            const title = "Follow-up Reminder ⏰";
            const body = `Time to contact ${log.leadId.name} (${log.leadId.phone})`;
            
            // Show toast
            toast(body, { icon: '⏰', duration: 8000 });

            // Show native push notification if permitted
            if ("Notification" in window && Notification.permission === "granted") {
              const notif = new Notification(title, { body, icon: "/icon-192x192.png" });
              notif.onclick = () => {
                window.focus();
                window.location.href = "/agent/leads?status=Follow-up";
              };
            }
          }
        });
      } catch (e) {
        console.error("Failed to check notifications", e);
      }
    };

    // Check once immediately, then every 5 minutes
    checkFollowUps();
    const interval = setInterval(checkFollowUps, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  return <>{children}</>;
}
