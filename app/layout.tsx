import "./globals.css";
import { AuthProvider } from "@/components/shared/AuthProvider";
import { NotificationProvider } from "@/components/shared/NotificationProvider";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "White Gloves CRM",
  description: "Elite Mobile-first Sales CRM",
  icons: {
    icon: "/white-gloves-logo.png",
    apple: "/white-gloves-logo.png",
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50 text-gray-900 antialiased h-screen overflow-hidden flex flex-col" suppressHydrationWarning>
        <AuthProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </AuthProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
