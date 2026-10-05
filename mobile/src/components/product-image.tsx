import { useState } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, space } from '@/constants/theme';
import { resolveImageUrl } from '@/lib/config';
import { slugBandColors } from '@/lib/resistor';

type Props = {
  slug: string;
  name: string;
  imageUrl?: string | null;
  width: number;
  height?: number;
};

/**
 * A product's picture, or a resistor drawn from a hash of its slug when there is
 * no picture. The hash is stable, so a product keeps the same artwork on every
 * device, exactly as the web app does.
 */
export function ProductImage({ slug, name, imageUrl, width, height }: Props) {
  const [failed, setFailed] = useState(false);
  const uri = resolveImageUrl(imageUrl);
  const boxHeight = height ?? Math.round((width * 3) / 4);

  if (!uri || failed) {
    return <BandArt slug={slug} width={width} height={boxHeight} />;
  }

  return (
    <Image
      source={{ uri }}
      style={[styles.image, { width, height: boxHeight, borderRadius: radius.md }]}
      resizeMode="cover"
      onError={() => setFailed(true)}
      accessibilityLabel={name}
      accessible
    />
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.panel,
  },
});

/** Four bands on a blue body, the same fallback the web app renders. */
export function BandArt({
  slug,
  width,
  height,
  style,
}: {
  slug: string;
  width: number;
  height: number;
  style?: StyleProp<ViewStyle>;
}) {
  const colorsForSlug = slugBandColors(slug);
  const bandWidth = Math.max(8, Math.round(width * 0.045));
  const bodyWidth = Math.round(width * 0.62);
  const bodyHeight = Math.max(40, Math.round(height * 0.34));

  return (
    <View
      style={[
        bandStyles.frame,
        { width, height, borderRadius: radius.md },
        style,
      ]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${slug} resistor artwork`}>
      <View style={bandStyles.row}>
        <View style={[bandStyles.lead, { width: Math.max(4, (width - bodyWidth) / 2) }]} />
        <View style={[bandStyles.body, { width: bodyWidth, height: bodyHeight }]}>
          {colorsForSlug.map((color, index) => (
            <View key={index} style={[bandStyles.band, { width: bandWidth, backgroundColor: color }]} />
          ))}
        </View>
        <View style={[bandStyles.lead, { width: Math.max(4, (width - bodyWidth) / 2) }]} />
      </View>
    </View>
  );
}

const bandStyles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.panel,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lead: {
    height: 4,
    backgroundColor: colors.lead,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: space.one + 2,
    backgroundColor: colors.resistorBlue,
    borderRadius: radius.pill,
  },
  band: {
    height: '100%',
  },
});