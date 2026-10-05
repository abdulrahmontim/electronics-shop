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
 * after the app is closed. The implicit flow is used because a phone has no
 * cookie jar and cannot keep a PKCE verifier between the browser and the app.
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
        detectSessionInUrl: false,
        flowType: 'implicit',
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