import "./globals.css";
import { AuthProvider } from "@/components/shared/AuthProvider";
import { NotificationProvider } from "@/components/shared/NotificationProvider";
import { Toaster } from "react-hot-toast";
import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata = {
  title: "White Gloves CRM",
  description: "Elite Mobile-first Sales CRM",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="bg-gray-50 text-gray-900 antialiased min-h-[100dvh] flex flex-col"
        suppressHydrationWarning
      >
        <AuthProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: { fontSize: "14px", fontWeight: 600 },
            success: { duration: 2500 },
            error: { duration: 3500 },
          }}
        />
      </body>
    </html>
  );
}
