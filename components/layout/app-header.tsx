"use client";

import { Menu } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function AppHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="flex items-center gap-3 border-b border-border/60 px-4 py-3 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
          }
        />
        <SheetContent side="left" className="w-[280px] p-0">
          <ChatSidebar
            className="w-full border-0"
            onNavigate={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
      <div className="flex items-center gap-2">
        <Image src="/drew-logo.svg" alt="Drew" width={28} height={28} />
        <span className="font-semibold tracking-tight">Drew</span>
      </div>
    </header>
  );
}
