import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Shown instead of a stack trace when the app has not been given the public
 * Supabase values yet. The client itself is built on first use, so a missing
 * value can never crash the app while it is starting.
 */
export const configurationError =
  !url || !anonKey
    ? 'Bench Supply is not configured yet. Copy mobile/.env.example to mobile/.env, add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, then restart the app.'
    : null;

let client: SupabaseClient | null = null;

/**
 * One Supabase client for the whole app, pointed at the same project the web
 * shop uses. Only the public anon key lives here; the anon key cannot read
 * another customer's rows because row level security decides that.
 *
 * Sessions are kept in AsyncStorage so a signed-in customer stays signed in
 * after the app is closed.
 *
 * PKCE is used, the same flow the web app uses. A phone has no cookie jar, but
 * that is not a problem: supabase-js keeps the code verifier in the same
 * AsyncStorage it keeps the session in, so it survives the round trip through
 * Google's browser tab. This is strictly better than the implicit flow it
 * replaces, because no access or refresh token is ever put into a URL that
 * passes through the browser and the OS.
 */
export function getSupabase(): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error(configurationError ?? 'Supabase is not configured');
  }
  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        // The redirect is consumed by expo-web-browser, not by a page load, so
        // supabase-js must not try to read the URL itself.
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
    });
  }
  return client;
}

/** The bearer token the checkout endpoint expects when it is called from a phone. */
export async function getAccessToken(): Promise<string | null> {
  try {
    const { data } = await getSupabase().auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}