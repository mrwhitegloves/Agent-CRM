import { AuthProvider } from "@/components/shared/AuthProvider";
import { AgentNav } from "@/components/shared/AgentNav";

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full h-[100dvh] w-full bg-gray-50">
      <main className="flex-1 overflow-y-auto pb-16">
        {children}
      </main>
      <AgentNav />
    </div>
  );
}
