import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { colors, radius, space, type } from '@/constants/theme';
import { SHOP_NAME, WEB_BASE_URL } from '@/lib/config';
import { useSession } from '@/lib/session';
import { useCart } from '@/lib/cart';
import { Button, Divider, Message } from '@/components/ui';

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user, loading, signIn, signOut } = useSession();
  const { syncState } = useCart();

  const padding = width >= 600 ? space.six : width >= 400 ? space.five : space.four;
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const onSignIn = async () => {
    setSigningIn(true);
    setAuthError(null);
    const error = await signIn('/account');
    setSigningIn(false);
    if (error) setAuthError(error);
  };

  const onSignOut = async () => {
    setSigningIn(true);
    setAuthError(null);
    await signOut();
    setSigningIn(false);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        {
          paddingHorizontal: padding,
          paddingTop: Math.max(insets.top, space.three),
          paddingBottom: insets.bottom + space.eight,
        },
      ]}
      keyboardShouldPersistTaps="handled">
      <Text style={type.screenTitle}>Account</Text>

      {loading ? (
        <View style={styles.row}>
          <ActivityIndicator color={colors.ink} />
          <Text style={type.bodyMuted}>Checking your session...</Text>
        </View>
      ) : user ? (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Signed in as</Text>
          <Text style={styles.email} selectable>
            {user.email}
          </Text>
          <Text style={type.small}>
            This is the same {SHOP_NAME} account you use on the web, so your cart and orders are
            shared between them.
          </Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Signed out</Text>
          <Text style={type.bodyMuted}>
            Sign in with Google to check out, see your orders and keep one cart across your phone
            and the web shop.
          </Text>
        </View>
      )}

      {!!authError && <Message tone="error" live>{authError}</Message>}

      {syncState === 'error' && (
        <Message tone="neutral">
          Your saved cart could not be reached just now. Changes may not be shared until it does.
        </Message>
      )}

      <View style={styles.actions}>
        {user ? (
          <>
            <Button label="Your orders" onPress={() => router.push('/orders')} full />
            <Button
              label="Sign out"
              variant="ghost"
              onPress={() => void onSignOut()}
              busy={signingIn}
              full
            />
          </>
        ) : (
          <Button
            label="Continue with Google"
            onPress={() => void onSignIn()}
            busy={signingIn}
            full
            accessibilityHint="Opens Google to sign in"
          />
        )}
      </View>

      <Divider />

      <View style={styles.section}>
        <Text style={type.sectionTitle}>About {SHOP_NAME}</Text>
        <Text style={type.bodyMuted}>
          Boards, sensors, tools and components for your bench. What you see here is the same
          catalogue the web shop sells from.
        </Text>
        {!!WEB_BASE_URL && (
          <Text style={type.small} selectable>
            Shop address: {WEB_BASE_URL}
          </Text>
        )}
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
    gap: space.four,
  },
  card: {
    gap: space.two,
    backgroundColor: colors.panel,
    borderRadius: radius.lg,
    padding: space.four,
  },
  cardLabel: {
    ...type.label,
  },
  email: {
    ...type.sectionTitle,
    fontSize: 17,
    lineHeight: 23,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.three,
  },
  actions: {
    gap: space.three,
  },
  section: {
    gap: space.two,
    paddingTop: space.four,
  },
});