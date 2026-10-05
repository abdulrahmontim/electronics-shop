import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors, radius, space, type } from '@/constants/theme';
import { formatNaira } from '@/lib/format';
import type { Product } from '@/lib/products';
import { ProductImage } from './product-image';

type Props = {
  product: Product;
  /** Width of the tile, so the artwork keeps a 4:3 ratio at any grid size. */
  width: number;
};

/**
 * The web product tile, adapted to touch: the whole card opens the product, and
 * long names wrap instead of being cut off.
 */
export const ProductCard = memo(function ProductCard({ product, width }: Props) {
  const open = () => router.push(`/product/${product.slug}`);

  return (
    <Pressable
      onPress={open}
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${formatNaira(product.price_ngn)}${
        product.in_stock ? '' : ', out of stock'
      }`}
      accessibilityHint="Opens the product"
      style={({ pressed }) => [cardStyles.card, { width }, pressed && cardStyles.pressed]}>
      <ProductImage
        slug={product.slug}
        name={product.name}
        imageUrl={product.image_url}
        width={width}
      />
      <Text style={cardStyles.name} numberOfLines={2}>
        {product.name}
      </Text>
      <View style={cardStyles.meta}>
        <Text style={cardStyles.category} numberOfLines={1}>
          {product.category}
        </Text>
        <Text style={cardStyles.price}>{formatNaira(product.price_ngn)}</Text>
      </View>
      {!product.in_stock && <Text style={cardStyles.outOfStock}>Out of stock</Text>}
    </Pressable>
  );
});

const cardStyles = StyleSheet.create({
  card: {
    gap: space.two,
  },
  pressed: {
    opacity: 0.7,
  },
  name: {
    ...type.productName,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: space.two,
  },
  category: {
    ...type.small,
    flexShrink: 1,
  },
  price: {
    ...type.price,
    fontSize: 14,
  },
  outOfStock: {
    ...type.small,
    color: colors.muted,
  },
});

/** Skeleton shown while the catalogue loads, so the screen is never blank. */
export function ProductCardSkeleton({ width }: { width: number }) {
  return (
    <View style={[cardStyles.card, { width }]} accessibilityElementsHidden>
      <View style={[skeletonStyles.block, { height: Math.round((width * 3) / 4) }]} />
      <View style={[skeletonStyles.line, { width: '80%' }]} />
      <View style={[skeletonStyles.line, { width: '45%' }]} />
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  block: {
    backgroundColor: colors.panel,
    borderRadius: radius.md,
  },
  line: {
    height: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.panel,
  },
});