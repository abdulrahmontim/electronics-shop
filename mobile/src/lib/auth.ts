import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { router, type Href } from 'expo-router';
import { getSupabase } from './supabase';
import { safeNext } from './format';

/**
 * The address the phone comes back to after Google signs the customer in.
 *
 * It is built with Linking.createURL rather than written out by hand, because
 * the correct value depends on how the app is being run:
 *
 *   dev build / APK  ->  benchsupply://auth/callback
 *   Expo Go          ->  exp://<your-lan-ip>:8081/--/auth/callback
 *
 * Only the first can ever work for a real install, because Expo Go does not
 * register the benchsupply scheme. Whichever it returns must be present in the
 * Supabase redirect URL list, otherwise Supabase silently ignores it and sends
 * the customer to the Site URL instead, which looks like a mysterious failure.
 */
export function authRedirectUri(): string {
  return Linking.createURL('auth/callback');
}

/**
 * True only when the app is running inside Expo Go itself.
 *
 * executionEnvironment cannot be used for this: its StoreClient value also
 * covers a development build made with expo-dev-client, which is the very thing
 * that does work. expoGoConfig is only populated by Expo Go, so it is the
 * reliable signal.
 */
function isExpoGo(): boolean {
  return Constants.expoGoConfig != null;
}

/**
 * Reads one parameter out of a redirect URL's query string or fragment.
 *
 * PKCE puts the authorisation code in the query string as `?code=...`, so this
 * looks there first. The fragment is still checked because a provider that
 * rejects the request reports the reason there.
 */
function readParam(url: string, name: string): string | null {
  const fragmentStart = url.indexOf('#');
  const fragment = fragmentStart >= 0 ? url.slice(fragmentStart + 1) : '';
  const queryStart = url.indexOf('?');
  const queryEnd = fragmentStart >= 0 ? fragmentStart : url.length;
  const query = queryStart >= 0 ? url.slice(queryStart + 1, queryEnd) : '';

  for (const source of [query, fragment]) {
    for (const pair of source.split('&')) {
      if (!pair) continue;
      const eq = pair.indexOf('=');
      if (eq < 0) continue;
      if (decodeURIComponent(pair.slice(0, eq)) === name) {
        return decodeURIComponent(pair.slice(eq + 1).replace(/\+/g, ' '));
      }
    }
  }
  return null;
}

export type SignInResult = { error: string | null };

/**
 * Signs in with Google using the same Supabase project and the same Google
 * provider as the web shop, so it resolves to the same user account and
 * therefore the same orders and the same shared cart.
 *
 * The session is established here, in the app, from the authorisation code.
 * The browser is only used for Google's consent screen and is closed as soon
 * as the redirect comes back, so nothing about the session depends on a cookie
 * belonging to the web app.
 */
export async function signInWithGoogle(next?: string): Promise<SignInResult> {
  const supabase = getSupabase();
  const redirectTo = authRedirectUri();

  // Printed because this exact string is what has to be allowed in Supabase.
  console.log('[auth] redirect URI:', redirectTo);
  if (isExpoGo()) {
    console.warn(
      '[auth] Running in Expo Go. Google sign-in cannot return to the app from here; use a development build.'
    );
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      // The redirect has to arrive at this app, not at a browser tab that
      // supabase-js would try to open.
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
    return { error: 'The sign-in screen could not be opened. Please try again.' };
  }

  if (result.type !== 'success') {
    return {
      error: isExpoGo()
        ? 'Google sign-in needs a development build. Expo Go cannot return to this app, so please install the dev build and try again.'
        : 'The Google sign-in screen was closed before it finished. Please try again.',
    };
  }

  const providerError = readParam(result.url, 'error_description') ?? readParam(result.url, 'error');
  if (providerError) {
    return { error: 'Google sign-in was refused. Please try again.' };
  }

  // PKCE returns a single-use code. No tokens ever appear in the URL.
  const code = readParam(result.url, 'code');
  if (!code) {
    return {
      error: `Google sign-in did not come back to the app. Add ${redirectTo} to Supabase, under Authentication > URL Configuration > Redirect URLs.`,
    };
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return { error: 'Could not finish signing in. Please try again in a moment.' };
  }

  // Send the customer on to wherever they were heading before signing in, which
  // keeps them inside the app.
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