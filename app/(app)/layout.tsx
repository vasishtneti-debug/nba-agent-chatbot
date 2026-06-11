import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { AppHeader } from "@/components/layout/app-header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-svh overflow-hidden bg-background">
      <div className="hidden md:flex">
        <ChatSidebar />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
