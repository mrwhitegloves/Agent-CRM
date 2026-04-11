import { AdminNav } from "@/components/shared/AdminNav";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("crm_token");

  if (!token) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col md:flex-row h-full h-[100dvh] w-full bg-gray-50">
      <AdminNav />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
