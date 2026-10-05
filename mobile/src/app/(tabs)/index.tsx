import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, space, touchTarget, type } from '@/constants/theme';
import { CATEGORIES, SHOP_NAME } from '@/lib/config';
import { fetchProducts, filterProducts, type Product } from '@/lib/products';
import { Button, Chip, Message } from '@/components/ui';
import { Resistor } from '@/components/resistor';
import { ProductCard, ProductCardSkeleton } from '@/components/product-card';

type LoadState = 'loading' | 'ready' | 'error';

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [products, setProducts] = useState<Product[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const padding = width >= 600 ? space.six : width >= 400 ? space.five : space.four;

  // Two columns once there is room for two readable cards, one below that. The
  // gap comes from the same value as the page padding so it lines up.
  const columns = width >= 600 ? 2 : 1;
  const cardWidth =
    columns === 1
      ? width - padding * 2
      : (width - padding * 2 - space.four) / 2;

  const load = useCallback(async () => {
    const result = await fetchProducts();
    if (result.status === 'ok') {
      setProducts(result.products);
      setErrorMessage(null);
      setState('ready');
    } else {
      setErrorMessage(result.message);
      setState('error');
    }
  }, []);

  // Shown again while a retry runs. The first load already starts as 'loading'.
  const retry = useCallback(() => {
    setState('loading');
    void load();
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () => filterProducts(products, query, category),
    [products, query, category]
  );

  const searching = query.trim().length > 0 || category !== null;

  const clearFilters = () => {
    setQuery('');
    setCategory(null);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <Text style={styles.brand}>{SHOP_NAME}</Text>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Parts for the thing you are building this week.</Text>
        <Text style={styles.heroSubhead}>
          Boards, sensors, tools and components for your bench.
        </Text>
      </View>

      <View style={styles.resistorWrap}>
        <Resistor width={width - padding * 2} />
      </View>

      <View style={styles.searchBlock}>
        <Text style={styles.searchLabel}>Search parts</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Arduino, resistors, sensors"
          placeholderTextColor={colors.muted}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          onSubmitEditing={Keyboard.dismiss}
          accessibilityLabel="Search parts"
          style={styles.search}
        />
        {searching && (
          <Pressable
            onPress={clearFilters}
            accessibilityRole="button"
            accessibilityLabel="Clear search and filters"
            hitSlop={8}
            style={styles.clear}>
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        accessibilityRole="tablist"
        accessibilityLabel="Product categories">
        <Chip label="All" active={category === null} onPress={() => setCategory(null)} />
        {CATEGORIES.map((c) => (
          <Chip
            key={c}
            label={c}
            active={category === c}
            onPress={() => setCategory(category === c ? null : c)}
          />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        numColumns={columns}
        key={`cols-${columns}`}
        columnWrapperStyle={columns > 1 ? styles.column : undefined}
        contentContainerStyle={[
          styles.list,
          {
            paddingHorizontal: padding,
            // Android draws edge to edge, so the status bar needs clearing
            // before the brand is readable.
            paddingTop: Math.max(insets.top, space.three),
            paddingBottom: insets.bottom + space.eight,
          },
        ]}
        ListHeaderComponent={renderHeader}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListEmptyComponent={
          state === 'loading' ? (
            <View style={styles.skeletons}>
              {Array.from({ length: columns === 1 ? 2 : 4 }).map((_, i) => (
                <ProductCardSkeleton key={i} width={cardWidth} />
              ))}
            </View>
          ) : state === 'error' ? (
            <Message tone="error">{errorMessage}</Message>
          ) : searching ? (
            <View style={styles.empty}>
              <Text style={type.sectionTitle}>No parts found</Text>
              <Text style={type.bodyMuted}>
                Nothing matches that search. Try a shorter word, or pick another category.
              </Text>
              <Button label="Clear search" onPress={clearFilters} variant="ghost" />
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={type.sectionTitle}>No products found</Text>
              <Text style={type.bodyMuted}>
                The shop has no products yet. Check again in a moment.
              </Text>
              <Button label="Try again" onPress={retry} variant="ghost" />
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={columns > 1 ? styles.cell : undefined}>
            <ProductCard product={item} width={cardWidth} />
          </View>
        )}
        ListFooterComponent={
          state === 'loading' ? (
            <View style={styles.loadingFooter}>
              <ActivityIndicator color={colors.ink} />
              <Text style={type.small}>Loading parts...</Text>
            </View>
          ) : state === 'error' ? (
            <Button label="Try again" onPress={retry} variant="ghost" />
          ) : (
            <View style={styles.footerSpace} />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  list: {
    paddingTop: 0,
  },
  header: {
    gap: space.four,
    paddingBottom: space.four,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brand: {
    fontFamily: type.screenTitle.fontFamily,
    fontSize: 22,
    lineHeight: 26,
    color: colors.ink,
  },
  hero: {
    gap: space.two,
  },
  heroTitle: {
    ...type.heroTitle,
  },
  heroSubhead: {
    ...type.bodyMuted,
  },
  resistorWrap: {
    paddingVertical: space.two,
  },
  searchBlock: {
    gap: space.one,
  },
  searchLabel: {
    ...type.label,
  },
  search: {
    minHeight: touchTarget,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    paddingHorizontal: space.three + 2,
    backgroundColor: colors.white,
    color: colors.ink,
    fontSize: 16,
  },
  clear: {
    alignSelf: 'flex-start',
    minHeight: 32,
    justifyContent: 'center',
  },
  clearText: {
    ...type.small,
    color: colors.muted,
    textDecorationLine: 'underline',
  },
  chips: {
    gap: space.two,
    paddingVertical: space.two,
    paddingRight: space.four,
  },
  column: {
    gap: space.four,
  },
  cell: {
    marginBottom: space.five,
  },
  skeletons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.four,
  },
  empty: {
    gap: space.two,
    paddingVertical: space.five,
  },
  loadingFooter: {
    alignItems: 'center',
    gap: space.two,
    paddingVertical: space.six,
  },
  footerSpace: {
    height: space.four,
  },
});