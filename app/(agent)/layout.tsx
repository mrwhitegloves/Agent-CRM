import { AgentNav } from "@/components/shared/AgentNav";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("crm_token");

  if (!token) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col min-h-[100dvh] w-full bg-sand-light/10">
      <header className="sticky top-0 px-4 md:px-6 py-3 bg-white border-b border-accent/5 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8">
            <Image src="/white-gloves-logo.png" alt="White Gloves" fill sizes="32px" className="object-contain" />
          </div>
          <span className="font-serif font-bold text-secondary text-sm">White Gloves</span>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto pb-20" style={{ WebkitOverflowScrolling: "touch" }}>
        {children}
      </main>
      <AgentNav />
    </div>
  );
}
