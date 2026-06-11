import { AuthForm } from "@/components/auth/auth-form";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to talk with Drew</p>
      </div>
      <GoogleSignInButton />
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>
      <AuthForm mode="login" />
      <p className="text-center text-xs text-muted-foreground">
        By continuing, you agree to our terms of service.
      </p>
    </div>
  );
}

export const metadata = {
  title: "Sign in — Drew",
  robots: { index: false },
};
