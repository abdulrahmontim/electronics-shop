import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { colors, space, type } from '@/constants/theme';
import { SHOP_NAME } from '@/lib/config';
import { safeNext } from '@/lib/format';
import { useSession } from '@/lib/session';
import { Button, Message } from '@/components/ui';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ next?: string; error?: string }>();
  const { user, loading, signIn } = useSession();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    params.error === 'auth' ? 'Sign-in failed. Please try again.' : null
  );

  const next = safeNext(typeof params.next === 'string' ? params.next : '/');

  const onPress = async () => {
    setBusy(true);
    setError(null);
    const failure = await signIn(next);
    setBusy(false);
    if (failure) {
      setError(failure);
      return;
    }
    // signIn already navigates on success; this covers the case where the
    // session arrived without a redirect.
    router.replace(next as never);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Math.max(insets.top, space.five),
          paddingBottom: Math.max(insets.bottom, space.five),
        },
      ]}
      keyboardShouldPersistTaps="handled">
      <View style={[styles.inner, { paddingHorizontal: width >= 600 ? space.six : space.five }]}>
        <Text style={type.screenTitle}>Sign in</Text>
        <Text style={type.bodyMuted}>
          Use your Google account to check out and see your orders. It is the same {SHOP_NAME}{' '}
          account you use on the web.
        </Text>

        {!!error && <Message tone="error" live>{error}</Message>}

        {loading ? (
          <View style={styles.row}>
            <ActivityIndicator color={colors.ink} />
            <Text style={type.bodyMuted}>Checking your session...</Text>
          </View>
        ) : user ? (
          <View style={styles.signedIn}>
            <Message tone="success" live>
              You are already signed in as {user.email}.
            </Message>
            <Button label="Continue" onPress={() => router.replace(next as never)} full />
          </View>
        ) : (
          <Button
            label="Continue with Google"
            onPress={() => void onPress()}
            busy={busy}
            full
            accessibilityHint="Opens Google to sign in"
          />
        )}

        <Button label="Back to shop" variant="quiet" onPress={() => router.replace('/')} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  inner: {
    gap: space.four,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.three,
  },
  signedIn: {
    gap: space.three,
  },
});