import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GoogleButton } from "@/components/GoogleButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect("/");
  }

  const nextParam = next || "/";

  return (
    <div>
      <h1>Sign in</h1>
      {error && <div className="error">Authentication failed. Please try again.</div>}
      <div style={{ marginTop: "1rem" }}>
        <GoogleButton next={nextParam} />
      </div>
    </div>
  );
}