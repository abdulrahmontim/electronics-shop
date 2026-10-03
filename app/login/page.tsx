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
    <div className="container page login">
      <h1>Sign in</h1>
      <p className="login-intro">
        Use your Google account to check out and see your orders.
      </p>
      {error && (
        <p className="msg msg-error">
          Sign-in failed. Please try again, and check that pop-ups are allowed
          for this site.
        </p>
      )}
      <GoogleButton next={nextParam} />
    </div>
  );
}