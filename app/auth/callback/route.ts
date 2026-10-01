import { createServerSupabaseClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/format";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const next = searchParams.get("next");
  const redirectTo = safeNext(next);

  const supabase = await createServerSupabaseClient();
  const code = searchParams.get("code");
  if (code) {
    try {
      await supabase.auth.exchangeCodeForSession(code);
      return NextResponse.redirect(new URL(redirectTo, request.url));
    } catch (e) {
      console.error(e);
      const url = new URL("/login?error=auth", request.url);
      return NextResponse.redirect(url);
    }
  }

  const url = new URL("/login?error=auth", request.url);
  return NextResponse.redirect(url);
}
