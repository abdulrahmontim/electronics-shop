import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { colors, radius, space, type } from '@/constants/theme';
import { MAX_PER_ITEM, resolveImageUrl } from '@/lib/config';
import { formatNaira } from '@/lib/format';
import { slugBandColors } from '@/lib/resistor';
import { useCart, type CartItem } from '@/lib/cart';
import { Button, Divider, LinkButton, Message } from '@/components/ui';
import { QuantityStepper } from '@/components/quantity-stepper';
import { EmptyState } from '@/components/layout';

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const {
    items,
    count,
    subtotal,
    loading,
    isSignedIn,
    syncState,
    updateQuantity,
    removeItem,
    clearCart,
    refresh,
  } = useCart();

  const padding = width >= 600 ? space.six : width >= 400 ? space.five : space.four;
  const thumbSize = 64;

  // Opening the cart is one of the moments the cart is revalidated, so a change
  // made on the desktop shows up as soon as the customer looks at it.
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  if (loading && items.length === 0) {
    return (
      <View style={styles.screen}>
        <View style={[styles.header, { paddingHorizontal: padding }]}>
          <Text style={type.screenTitle}>Your cart</Text>
        </View>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.ink} />
          <Text style={type.bodyMuted}>Loading your cart...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.product_id}
        contentContainerStyle={[
          styles.list,
          {
            paddingHorizontal: padding,
            paddingTop: Math.max(insets.top, space.three),
            paddingBottom: insets.bottom + space.six,
          },
        ]}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={type.screenTitle}>Your cart</Text>
            {syncState === 'error' && (
              <Message tone="neutral" live>
                We could not reach your saved cart, so changes may not be shared yet.
              </Message>
            )}
            {syncState === 'local' && (
              <Message tone="neutral">
                This cart is on this device only. Sign in and it will follow you to every device.
              </Message>
            )}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="Your cart is empty"
            body="Pick a part from the shop to start an order."
            actionLabel="Browse parts"
            onAction={() => router.replace('/')}
          />
        }
        renderItem={({ item }) => (
          <CartRow
            item={item}
            thumbSize={thumbSize}
            onChangeQuantity={(next) => void updateQuantity(item.product_id, next)}
            onRemove={() => void removeItem(item.product_id)}
            onOpen={() => router.push(`/product/${item.slug}`)}
          />
        )}
        ItemSeparatorComponent={Divider}
        ListFooterComponent={
          items.length > 0 ? (
            <View style={styles.summary}>
              <View style={styles.summaryHead}>
                <Text style={type.body}>Subtotal</Text>
                <Text style={type.priceLarge}>{formatNaira(subtotal)}</Text>
              </View>
              <Text style={type.small}>
                {count} {count === 1 ? 'item' : 'items'} across {items.length}{' '}
                {items.length === 1 ? 'product' : 'products'}
              </Text>

              <View style={styles.actions}>
                <Button
                  label="Go to checkout"
                  onPress={() => router.push('/checkout')}
                  full
                  disabled={!isSignedIn}
                  accessibilityHint={
                    isSignedIn ? 'Opens checkout' : 'Sign in first to check out'
                  }
                />
                {!isSignedIn && (
                  <Text style={styles.signInNote}>
                    Sign in to check out. Your cart will be waiting when you come back.
                  </Text>
                )}
                <Button
                  label="Continue shopping"
                  variant="ghost"
                  onPress={() => router.replace('/')}
                  full
                />
                <LinkButton label="Clear cart" onPress={() => void clearCart()} />
              </View>
            </View>
          ) : null
        }
      />
    </View>
  );
}

function CartRow({
  item,
  thumbSize,
  onChangeQuantity,
  onRemove,
  onOpen,
}: {
  item: CartItem;
  thumbSize: number;
  onChangeQuantity: (next: number) => void;
  onRemove: () => void;
  onOpen: () => void;
}) {
  const uri = resolveImageUrl(item.image_url);

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={item.name}
        accessibilityHint="Opens the product"
        style={styles.thumbPressable}>
        {uri ? (
          <Image
            source={{ uri }}
            style={[styles.thumb, { width: thumbSize, height: thumbSize }]}
            resizeMode="cover"
          />
        ) : (
          <BandThumb slug={item.slug} size={thumbSize} />
        )}
      </Pressable>

      <View style={styles.rowMain}>
        <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={item.name}>
          <Text style={type.productName} numberOfLines={2}>
            {item.name}
          </Text>
        </Pressable>
        <Text style={type.small}>{formatNaira(item.price_ngn)} each</Text>
        <View style={styles.rowControls}>
          <QuantityStepper
            value={item.quantity}
            onChange={onChangeQuantity}
            min={1}
            max={MAX_PER_ITEM}
            label={item.name}
          />
          <LinkButton label="Remove" onPress={onRemove} />
        </View>
      </View>

      <Text style={styles.rowTotal}>{formatNaira(item.price_ngn * item.quantity)}</Text>
    </View>
  );
}

function BandThumb({ slug, size }: { slug: string; size: number }) {
  const bandColors = slugBandColors(slug);
  return (
    <View
      style={[styles.thumb, { width: size, height: size }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Resistor artwork">
      <View style={styles.bandRow}>
        {bandColors.map((color, index) => (
          <View key={index} style={[styles.band, { backgroundColor: color }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  list: {
    flexGrow: 1,
  },
  header: {
    gap: space.three,
    paddingBottom: space.four,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.three,
  },
  row: {
    flexDirection: 'row',
    gap: space.three,
    paddingVertical: space.four,
    alignItems: 'flex-start',
  },
  thumbPressable: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  thumb: {
    borderRadius: radius.md,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bandRow: {
    flexDirection: 'row',
    gap: 3,
  },
  band: {
    width: 5,
    height: 28,
  },
  rowMain: {
    flex: 1,
    gap: space.one,
  },
  rowControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.two,
    marginTop: space.one,
    flexWrap: 'wrap',
  },
  rowTotal: {
    ...type.price,
    minWidth: 72,
    textAlign: 'right',
  },
  summary: {
    gap: space.two,
    paddingTop: space.four,
  },
  summaryHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: space.two,
  },
  actions: {
    gap: space.three,
    paddingTop: space.three,
    alignItems: 'flex-start',
  },
  signInNote: {
    ...type.small,
  },
});