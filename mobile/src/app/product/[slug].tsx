import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { colors, radius, space, type } from '@/constants/theme';
import { MAX_SELECTABLE } from '@/lib/config';
import { formatNaira } from '@/lib/format';
import { fetchProductBySlug, type Product } from '@/lib/products';
import { useCart } from '@/lib/cart';
import { SafeTop, EmptyState, usePagePadding } from '@/components/layout';
import { ProductImage } from '@/components/product-image';
import { QuantityStepper } from '@/components/quantity-stepper';
import { Button, Divider, Message } from '@/components/ui';

type LoadState = 'loading' | 'ready' | 'missing' | 'error';

export default function ProductScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const padding = usePagePadding();
  const { width } = useWindowDimensions();
  const { slug: rawSlug } = useLocalSearchParams<{ slug: string }>();
  const slug = typeof rawSlug === 'string' ? rawSlug : '';
  const { addItem, items } = useCart();

  // A missing slug is a property of the route rather than of the request, so it
  // is derived here instead of being pushed through state.
  const unroutable = slug.length === 0;

  const [state, setState] = useState<LoadState>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (unroutable) return;
    const result = await fetchProductBySlug(slug);
    if (result.status === 'ok') {
      setProduct(result.product);
      setState('ready');
    } else if (result.status === 'missing') {
      setState('missing');
    } else {
      setMessage(result.message);
      setState('error');
    }
  }, [slug, unroutable]);

  // Only a retry needs the spinner again: the first load already starts as
  // 'loading'.
  const retry = useCallback(() => {
    setState('loading');
    void load();
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const inCart = product ? items.find((i) => i.product_id === product.id) : undefined;

  const onAdd = async () => {
    if (!product) return;
    setBusy(true);
    setNotice(null);
    const added = await addItem({
      product_id: product.id,
      quantity,
      name: product.name,
      price_ngn: product.price_ngn,
      in_stock: product.in_stock,
      slug: product.slug,
      image_url: product.image_url,
    });
    setBusy(false);

    if (added === 0) {
      setNotice('You already have the maximum of 20 of this in your cart.');
      return;
    }
    setNotice(`Added ${added} to your cart.`);
    if (quantity > added) setQuantity(added);
  };

  const header = (
    <SafeTop>
      <View style={styles.topBar}>
        <Button
          label="Back"
          variant="quiet"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          accessibilityHint="Goes back to the shop"
          style={styles.back}
        />
        <Text style={styles.topBarBrand}>Bench Supply</Text>
      </View>
    </SafeTop>
  );

  if (state === 'loading') {
    return (
      <View style={[styles.screen, { paddingHorizontal: padding }]}>
        {header}
        <View style={styles.centered}>
          <ActivityIndicator color={colors.ink} />
          <Text style={type.bodyMuted}>Loading this part...</Text>
        </View>
      </View>
    );
  }

  if (unroutable || state === 'missing') {
    return (
      <View style={[styles.screen, { paddingHorizontal: padding }]}>
        {header}
        <EmptyState
          title="This part is no longer listed"
          body="It may have been renamed or removed from the shop."
          actionLabel="Browse parts"
          onAction={() => router.replace('/')}
        />
      </View>
    );
  }

  if (state === 'error' || !product) {
    return (
      <View style={[styles.screen, { paddingHorizontal: padding }]}>
        {header}
        <EmptyState
          title="This part could not load"
          body={message ?? 'Check your connection and try again.'}
          actionLabel="Try again"
          onAction={retry}
          tone="error"
        />
      </View>
    );
  }

  const imageWidth = Math.max(240, width - padding * 2);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: padding, paddingBottom: space.eight + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}>
        {header}

        <ProductImage
          slug={product.slug}
          name={product.name}
          imageUrl={product.image_url}
          width={imageWidth}
        />

        <View style={styles.headings}>
          <Text style={type.screenTitle}>{product.name}</Text>
          <Text style={type.small}>{product.category}</Text>
        </View>

        <Text style={type.priceLarge}>{formatNaira(product.price_ngn)}</Text>

        <View style={styles.stockRow}>
          <View
            style={[styles.stockDot, product.in_stock ? styles.stockDotOk : styles.stockDotOut]}
          />
          <Text style={[type.body, !product.in_stock && styles.outOfStockText]}>
            {product.in_stock ? 'In stock' : 'Out of stock'}
          </Text>
          {!!inCart && (
            <Text style={styles.inCartNote}>{inCart.quantity} already in your cart</Text>
          )}
        </View>

        {product.description ? (
          <>
            <Divider />
            <Text style={type.body}>{product.description}</Text>
          </>
        ) : null}

        {!!notice && (
          <Message tone={notice.startsWith('You already') ? 'error' : 'success'} live>
            {notice}
          </Message>
        )}

        {product.in_stock ? (
          <View style={styles.buyBlock}>
            <View style={styles.qtyRow}>
              <Text style={type.label}>Quantity</Text>
              <QuantityStepper
                value={quantity}
                onChange={setQuantity}
                min={1}
                max={MAX_SELECTABLE}
                label={product.name}
              />
            </View>

            <Button
              label={`Add to cart, ${formatNaira(product.price_ngn * quantity)}`}
              onPress={() => void onAdd()}
              busy={busy}
              full
            />

            <View style={styles.secondaryActions}>
              <Button
                label="Go to cart"
                variant="ghost"
                onPress={() => router.push('/cart')}
                full
              />
              <Button
                label="Continue shopping"
                variant="quiet"
                onPress={() => router.replace('/')}
                full
              />
            </View>
          </View>
        ) : (
          <View style={styles.buyBlock}>
            <Button label="Continue shopping" onPress={() => router.replace('/')} full />
          </View>
        )}
      </ScrollView>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.two,
  },
  topBarBrand: {
    ...type.label,
    color: colors.muted,
  },
  back: {
    marginLeft: -space.three,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.three,
  },
  headings: {
    gap: space.one,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: space.two,
  },
  stockDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stockDotOk: {
    backgroundColor: colors.ok,
  },
  stockDotOut: {
    backgroundColor: colors.muted,
  },
  outOfStockText: {
    color: colors.muted,
  },
  inCartNote: {
    ...type.small,
    marginLeft: 'auto',
  },
  buyBlock: {
    gap: space.four,
    paddingTop: space.two,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.two,
    flexWrap: 'wrap',
  },
  secondaryActions: {
    gap: space.three,
    alignItems: 'stretch',
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    borderRadius: radius.sm,
    paddingTop: space.three,
  },
});