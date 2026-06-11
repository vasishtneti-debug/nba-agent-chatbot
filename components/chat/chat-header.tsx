import Image from "next/image";

type ChatHeaderProps = {
  title: string;
};

export function ChatHeader({ title }: ChatHeaderProps) {
  return (
    <header className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
      <div className="relative size-9 overflow-hidden rounded-full ring-1 ring-primary/50">
        <Image src="/drew-logo.svg" alt="Drew" width={36} height={36} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">NBA Agent · Always on the wire</p>
      </div>
    </header>
  );
}
