import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { colors, space, type } from '@/constants/theme';
import { SHOP_NAME } from '@/lib/config';
import { formatNaira } from '@/lib/format';
import { placeOrder, validateCheckout, type CheckoutDetails } from '@/lib/checkout';
import { useCart } from '@/lib/cart';
import { useSession } from '@/lib/session';
import { SafeTop, EmptyState, usePagePadding } from '@/components/layout';
import { Button, Divider, Field, Message } from '@/components/ui';

const EMPTY: CheckoutDetails = {
  full_name: '',
  phone: '',
  address: '',
  city: '',
  state: '',
};

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const padding = usePagePadding();
  const { user, loading: sessionLoading } = useSession();
  const { items, subtotal, count, refresh, clearCart, syncState } = useCart();

  const [details, setDetails] = useState<CheckoutDetails>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Google puts the buyer's name in the profile, so prefill it exactly as the web
  // checkout does rather than asking for it twice.
  const set = useCallback((key: keyof CheckoutDetails, value: string) => {
    setDetails((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Google puts a name on the profile, so it is prefilled the way the web
  // checkout does. The account id is tracked so this only ever runs once per
  // sign-in, and it never overwrites a name the customer has typed. Adjusting
  // state during render is the documented pattern for reacting to a new prop,
  // and the guard stops it from looping.
  const [prefilledFor, setPrefilledFor] = useState<string | null>(null);
  if (user && prefilledFor !== user.id) {
    setPrefilledFor(user.id);
    const meta = user.user_metadata ?? {};
    const candidate =
      (typeof meta.full_name === 'string' && meta.full_name) ||
      (typeof meta.name === 'string' && meta.name) ||
      '';
    if (candidate) {
      setDetails((prev) => (prev.full_name.trim() ? prev : { ...prev, full_name: candidate }));
    }
  }

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const lines = useMemo(
    () => items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
    [items]
  );

  const onSubmit = async () => {
    setError(null);

    const invalid = validateCheckout(details, lines);
    if (invalid) {
      setError(invalid);
      return;
    }

    setSubmitting(true);
    const result = await placeOrder(details, lines);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      if (result.status === 401) router.replace('/login?next=/checkout');
      return;
    }

    // The order is saved server-side and the shared cart is emptied there, so
    // this only drops the device copy and shows the confirmation screen.
    await clearCart();
    router.replace(`/order/${result.orderId}?email=${result.emailSent ? 'sent' : 'failed'}`);
  };

  if (sessionLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.screen, styles.padded]}>
        <SafeTop>
          <Button label="Back" variant="quiet" onPress={() => router.back()} style={styles.back} />
        </SafeTop>
        <EmptyState
          title="Sign in to check out"
          body="Checkout needs your account so the order and its confirmation email have somewhere to go."
          actionLabel="Sign in"
          onAction={() => router.replace('/login?next=/checkout')}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingHorizontal: padding, paddingBottom: space.eight + insets.bottom },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}>
          <SafeTop>
            <Button label="Back" variant="quiet" onPress={() => router.back()} style={styles.back} />
            <Text style={type.screenTitle}>Checkout</Text>
            <Text style={type.bodyMuted}>
              We will email a confirmation to {user.email} once the order is placed.
            </Text>
          </SafeTop>

          {syncState === 'error' && (
            <Message tone="neutral">
              Your saved cart could not be refreshed. Prices shown below come from the shop
              database, so what you are charged is always correct.
            </Message>
          )}

          <View style={styles.section}>
            <Text style={type.sectionTitle}>Delivery</Text>
            <Field
              label="Email"
              value={user.email ?? ''}
              onChangeText={() => undefined}
              editable={false}
              keyboardType="email-address"
              autoComplete="email"
            />
            <Field
              label="Full name"
              value={details.full_name}
              onChangeText={(v) => set('full_name', v)}
              placeholder="Your name"
              autoComplete="name"
            />
            <Field
              label="Phone"
              value={details.phone}
              onChangeText={(v) => set('phone', v)}
              placeholder="0803 000 0000"
              keyboardType="phone-pad"
              autoComplete="tel"
            />
            <Field
              label="Address"
              value={details.address}
              onChangeText={(v) => set('address', v)}
              placeholder="Street and area"
              autoComplete="street-address"
              multiline
            />
            <Field
              label="City"
              value={details.city}
              onChangeText={(v) => set('city', v)}
              placeholder="Lagos"
              autoComplete="address-line2"
            />
            <Field
              label="State"
              value={details.state}
              onChangeText={(v) => set('state', v)}
              placeholder="Lagos"
              autoComplete="address-line1"
            />
          </View>

          <Divider />

          <View style={styles.section}>
            <Text style={type.sectionTitle}>Order summary</Text>
            {items.length === 0 ? (
              <Message tone="neutral">
                Your cart is empty, so there is nothing to order yet.
              </Message>
            ) : (
              items.map((item) => (
                <View key={item.product_id} style={styles.line}>
                  <Text style={styles.lineName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={type.small}>
                    {item.quantity} × {formatNaira(item.price_ngn)}
                  </Text>
                  <Text style={type.price}>
                    {formatNaira(item.price_ngn * item.quantity)}
                  </Text>
                </View>
              ))
            )}

            <View style={styles.totalRow}>
              <Text style={type.body}>Total</Text>
              <Text style={type.priceLarge}>{formatNaira(subtotal)}</Text>
            </View>
            <Text style={type.small}>
              {count} {count === 1 ? 'item' : 'items'}. {SHOP_NAME} does not take payment in the
              app; you will be contacted to arrange it.
            </Text>
          </View>

          {!!error && <Message tone="error" live>{error}</Message>}

          <Button
            label={`Place order, ${formatNaira(subtotal)}`}
            onPress={() => void onSubmit()}
            busy={submitting}
            disabled={items.length === 0}
            full
          />
          <Button
            label="Continue shopping"
            variant="quiet"
            onPress={() => router.replace('/cart')}
            full
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  flex: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: space.six,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  content: {
    gap: space.four,
    paddingTop: space.two,
  },
  back: {
    alignSelf: 'flex-start',
    marginLeft: -space.three,
  },
  section: {
    gap: space.three,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: space.two,
    paddingVertical: space.two,
  },
  lineName: {
    ...type.productName,
    flexShrink: 1,
    minWidth: 120,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: space.two,
    paddingTop: space.three,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
});