import { AuthForm } from "@/components/auth/auth-form";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Separator } from "@/components/ui/separator";

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
        <p className="text-sm text-muted-foreground">Get insider NBA intel from Drew</p>
      </div>
      <GoogleSignInButton />
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>
      <AuthForm mode="signup" />
    </div>
  );
}

export const metadata = {
  title: "Sign up — Drew",
  robots: { index: false },
};
