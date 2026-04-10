import { AuthProvider } from "@/components/shared/AuthProvider";
import { AdminNav } from "@/components/shared/AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row h-full h-[100dvh] w-full bg-gray-50">
      <AdminNav />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
