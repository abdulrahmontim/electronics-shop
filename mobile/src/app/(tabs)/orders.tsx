import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { colors, space, type } from '@/constants/theme';
import { formatDay, formatNaira, orderReference, statusLabel } from '@/lib/format';
import { fetchOrders, type Order } from '@/lib/orders';
import { useSession } from '@/lib/session';
import { Divider, Pill } from '@/components/ui';
import { EmptyState } from '@/components/layout';

type LoadState = 'loading' | 'ready' | 'error';

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user, loading: sessionLoading } = useSession();

  const [orders, setOrders] = useState<Order[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [message, setMessage] = useState<string | null>(null);

  const padding = width >= 600 ? space.six : width >= 400 ? space.five : space.four;

  // Orders are re-read whenever this tab comes into view, so a new order placed
  // anywhere shows up without a manual refresh.
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let active = true;
      setState('loading');
      void fetchOrders().then((result) => {
        if (!active) return;
        if (result.status === 'ok') {
          setOrders(result.orders);
          setMessage(null);
          setState('ready');
        } else {
          setMessage(result.message);
          setState('error');
        }
      });
      return () => {
        active = false;
      };
    }, [user])
  );

  if (sessionLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.screen, { paddingHorizontal: padding }]}>
        <Text style={type.screenTitle}>Your orders</Text>
        <EmptyState
          title="Sign in to see your orders"
          body="Use the same Google account you shop with on the web and your orders will appear here."
          actionLabel="Sign in"
          onAction={() => router.push('/login?next=/orders')}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          {
            paddingHorizontal: padding,
            paddingTop: Math.max(insets.top, space.three),
            paddingBottom: insets.bottom + space.eight,
          },
        ]}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={type.screenTitle}>Your orders</Text>
            {state === 'error' && (
              <Text style={styles.error}>{message}</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          state === 'loading' ? (
            <View style={styles.centeredRow}>
              <ActivityIndicator color={colors.ink} />
              <Text style={type.bodyMuted}>Loading your orders...</Text>
            </View>
          ) : state === 'error' ? (
            <EmptyState
              title="Your orders could not load"
              body="Check your connection and try again."
              actionLabel="Try again"
              onAction={() => router.replace('/orders')}
            />
          ) : (
            <EmptyState
              title="No orders yet"
              body="You have not ordered anything yet. Your orders will appear here once you place one."
              actionLabel="Browse parts"
              onAction={() => router.replace('/')}
            />
          )
        }
        ItemSeparatorComponent={Divider}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/order/${item.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`Order ${orderReference(item.id)}, ${formatNaira(item.total_ngn)}`}
            accessibilityHint="Opens the order"
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <View style={styles.rowMain}>
              <Text style={type.productName}>Order {orderReference(item.id)}</Text>
              <Text style={type.small}>{formatDay(item.created_at)}</Text>
            </View>
            <Pill label={statusLabel(item.status)} />
            <Text style={styles.rowTotal}>{formatNaira(item.total_ngn)}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  centeredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.three,
    paddingVertical: space.five,
  },
  list: {
    flexGrow: 1,
  },
  header: {
    gap: space.three,
    paddingBottom: space.four,
  },
  error: {
    ...type.body,
    color: colors.danger,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: space.two,
    paddingVertical: space.four,
  },
  pressed: {
    opacity: 0.7,
  },
  rowMain: {
    flexGrow: 1,
    flexShrink: 1,
    gap: space.one,
    minWidth: 140,
  },
  rowTotal: {
    ...type.price,
    marginLeft: 'auto',
  },
});