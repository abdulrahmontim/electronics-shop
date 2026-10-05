import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { router, type Href } from 'expo-router';
import { getSupabase } from './supabase';
import { safeNext } from './format';

/**
 * The address the phone comes back to after Google signs the customer in. It
 * uses the app's own scheme, which is why it cannot be copied from the web
 * app's callback URL.
 */
export function authRedirectUri(): string {
  return Linking.createURL('auth/callback');
}

/**
 * Pulls a value out of a URL fragment or query string.
 *
 * The implicit flow hands the tokens back in the fragment
 * (benchsupply://auth/callback#access_token=...&refresh_token=...), so they are
 * read here rather than by a browser redirect that a phone cannot perform.
 */
function readParam(url: string, name: string): string | null {
  const fragmentStart = url.indexOf('#');
  const fragment = fragmentStart >= 0 ? url.slice(fragmentStart + 1) : '';
  const queryStart = url.indexOf('?');
  const queryEnd = fragmentStart >= 0 ? fragmentStart : url.length;
  const query = queryStart >= 0 ? url.slice(queryStart + 1, queryEnd) : '';
  const source = `${fragment}&${query}`;
  for (const pair of source.split('&')) {
    if (!pair) continue;
    const eq = pair.indexOf('=');
    if (eq < 0) continue;
    if (decodeURIComponent(pair.slice(0, eq)) === name) {
      return decodeURIComponent(pair.slice(eq + 1).replace(/\+/g, ' '));
    }
  }
  return null;
}

export type SignInResult = { error: string | null };

/**
 * Signs in with the same Google account the web shop uses, because both go
 * through the same Supabase project and the same Google provider. The browser
 * opens as a system tab and closes itself on the way back.
 */
export async function signInWithGoogle(next?: string): Promise<SignInResult> {
  const supabase = getSupabase();
  const redirectTo = authRedirectUri();

  // Printed so the exact string can be added to the Supabase redirect URL list.
  // Android's own scheme handling decides whether this comes back with one or
  // two slashes, and guessing wrong here means the sign-in silently bounces.
  console.log('[auth] redirect URI:', redirectTo);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data?.url) {
    return { error: 'Could not start Google sign-in. Check your connection and try again.' };
  }

  let result: WebBrowser.WebBrowserAuthSessionResult;
  try {
    result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  } catch {
    return { error: 'The sign-in browser closed before it finished. Please try again.' };
  }

  if (result.type !== 'success') {
    return { error: 'Sign-in was cancelled. Please try again when you are ready.' };
  }

  const accessToken = readParam(result.url, 'access_token');
  const refreshToken = readParam(result.url, 'refresh_token');
  const providerError =
    readParam(result.url, 'error_description') ?? readParam(result.url, 'error');

  if (!accessToken || !refreshToken) {
    return {
      error: providerError
        ? 'Google sign-in failed. Please try again.'
        : 'Google sign-in did not return a session. Please try again.',
    };
  }

  const { error: setError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (setError) {
    return { error: 'Could not save your session. Please try again.' };
  }

  // Send the customer on to wherever they were heading before signing in.
  router.replace(safeNext(next) as Href);
  return { error: null };
}

export async function signOut(): Promise<void> {
  await getSupabase().auth.signOut();
}

/** Lets the system browser finish any pending session redirect. */
export function completeAuthSession(): void {
  WebBrowser.maybeCompleteAuthSession();
}