import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { colors, space, type } from '@/constants/theme';
import { formatDateTime, formatNaira, orderReference, statusLabel } from '@/lib/format';
import { fetchOrderById, type Order } from '@/lib/orders';
import { SafeTop, EmptyState, usePagePadding } from '@/components/layout';
import { Button, Divider, Message, Pill } from '@/components/ui';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type LoadState = 'loading' | 'ready' | 'missing' | 'error';

export default function OrderScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const padding = usePagePadding();
  const { id: rawId, email } = useLocalSearchParams<{ id: string; email?: string }>();
  const id = typeof rawId === 'string' ? rawId : '';

  // Whether this address could ever name an order is a property of the route,
  // not of the request, so it is derived rather than pushed through state.
  const unroutable = !UUID_PATTERN.test(id);

  const [state, setState] = useState<LoadState>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  const load = useCallback(async () => {
    if (unroutable) return;
    const result = await fetchOrderById(id);
    if (result.status === 'ok') {
      setOrder(result.order);
      setState('ready');
    } else if (result.status === 'missing') {
      setState('missing');
    } else {
      setMessage(result.message);
      setState('error');
    }
  }, [id, unroutable]);

  // Only a retry needs the spinner again: the first load already starts as
  // 'loading'.
  const retry = useCallback(() => {
    setState('loading');
    void load();
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const header = (
    <SafeTop>
      <Button
        label="Back"
        variant="quiet"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/orders'))}
        accessibilityHint="Goes back to your orders"
        style={styles.back}
      />
    </SafeTop>
  );

  if (state === 'loading') {
    return (
      <View style={[styles.screen, { paddingHorizontal: padding }]}>
        {header}
        <View style={styles.centered}>
          <ActivityIndicator color={colors.ink} />
          <Text style={type.bodyMuted}>Loading this order...</Text>
        </View>
      </View>
    );
  }

  if (unroutable || state === 'missing') {
    return (
      <View style={[styles.screen, { paddingHorizontal: padding }]}>
        {header}
        <EmptyState
          title="This order could not be found"
          body="It may belong to a different account, or the link may be wrong."
          actionLabel="Your orders"
          onAction={() => router.replace('/orders')}
        />
      </View>
    );
  }

  if (state === 'error' || !order) {
    return (
      <View style={[styles.screen, { paddingHorizontal: padding }]}>
        {header}
        <EmptyState
          title="This order could not load"
          body={message ?? 'Check your connection and try again.'}
          actionLabel="Try again"
          onAction={retry}
          tone="error"
        />
      </View>
    );
  }

  const items = order.order_items ?? [];

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: padding, paddingBottom: space.eight + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}>
        {header}

        {email === 'sent' && (
          <Message tone="success" live>
            Order placed and a confirmation email is on its way to {order.email}.
          </Message>
        )}
        {email === 'failed' && (
          <Message tone="neutral">
            Your order is saved, but the confirmation email could not be sent. Please keep this
            reference: {orderReference(order.id)}.
          </Message>
        )}

        <View style={styles.headings}>
          <Text style={type.screenTitle}>Order {orderReference(order.id)}</Text>
          <Pill label={statusLabel(order.status)} />
          <Text style={type.small}>{formatDateTime(order.created_at)}</Text>
        </View>

        <Divider />

        <View style={styles.section}>
          <Text style={type.sectionTitle}>Items</Text>
          {items.length === 0 ? (
            <Text style={type.bodyMuted}>This order has no line items recorded.</Text>
          ) : (
            items.map((item) => (
              <View key={item.id} style={styles.line}>
                <Text style={styles.lineName} numberOfLines={3}>
                  {item.product_name}
                </Text>
                <Text style={type.small}>
                  {item.quantity} × {formatNaira(item.unit_price_ngn)}
                </Text>
                <Text style={type.price}>
                  {formatNaira(item.unit_price_ngn * item.quantity)}
                </Text>
              </View>
            ))
          )}

          <View style={styles.totalRow}>
            <Text style={type.body}>Total</Text>
            <Text style={type.priceLarge}>{formatNaira(order.total_ngn)}</Text>
          </View>
        </View>

        <Divider />

        <View style={styles.section}>
          <Text style={type.sectionTitle}>Delivery</Text>
          <Detail label="Name" value={order.full_name} />
          <Detail label="Phone" value={order.phone} />
          <Detail label="Address" value={order.address} multiline />
          <Detail label="City" value={order.city} />
          <Detail label="State" value={order.state} />
          <Detail label="Email" value={order.email} />
        </View>

        <Button label="Continue shopping" onPress={() => router.replace('/')} full />
      </ScrollView>
    </View>
  );
}

function Detail({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[type.body, multiline && styles.detailMultiline]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.three,
  },
  headings: {
    gap: space.two,
    alignItems: 'flex-start',
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
  detail: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.two,
  },
  detailLabel: {
    ...type.label,
    width: 72,
    color: colors.muted,
  },
  detailMultiline: {
    flex: 1,
    minWidth: 160,
  },
});