"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { publicEnv } from "@/lib/env/public";

export function GoogleSignInButton() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleGoogleSignIn() {
    setIsLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${publicEnv.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });
    setIsLoading(false);
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
    >
      {isLoading ? "Redirecting…" : "Continue with Google"}
    </Button>
  );
}
