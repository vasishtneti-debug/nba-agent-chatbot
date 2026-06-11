import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="relative size-14 overflow-hidden rounded-full ring-2 ring-primary ring-offset-2 ring-offset-background">
          <Image src="/drew-logo.svg" alt="Drew" width={56} height={56} />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold tracking-tight">Drew</h2>
          <p className="text-sm text-muted-foreground">Your NBA agent on the inside</p>
        </div>
      </div>
      <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card p-6 shadow-xl">
        {children}
      </div>
    </div>
  );
}
