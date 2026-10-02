"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export function GoogleButton({ next }: { next?: string }) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const signIn = async () => {
    setLoading(true);
    const redirectTo = `${window.location.origin}/auth/callback${next ? "?next=" + encodeURIComponent(next) : ""}`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  };

  return (
    <button onClick={signIn} disabled={loading}>
      {loading ? "Signing in..." : "Continue with Google"}
    </button>
  );
}
