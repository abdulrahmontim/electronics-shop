import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, space, type } from '@/constants/theme';
import {
  HERO_BAND_COLORS,
  HERO_MULTIPLIER_COLORS,
  formatResistorValue,
  toDisplayValue,
} from '@/lib/resistor';

const TOLERANCE_COLOR = '#C9A24A';

/**
 * The shop's one memorable element, rebuilt in React Native. Tapping a band
 * cycles its colour and the value updates live. The body is sized from the
 * available width so it fits any phone without overflowing.
 */
export function Resistor({ width }: { width: number }) {
  const [band1, setBand1] = useState(4);
  const [band2, setBand2] = useState(7);
  const [band3, setBand3] = useState(2);

  const value = toDisplayValue(formatResistorValue(band1, band2, band3));
  const bodyWidth = Math.max(160, Math.min(width * 0.86, 360));
  const bodyHeight = Math.max(56, Math.round(bodyWidth * 0.25));
  const bandWidth = Math.max(14, Math.round(bodyWidth * 0.055));
  const leadWidth = Math.max(6, Math.round((width - bodyWidth) / 2));

  const bands = [
    {
      role: 'First band',
      color: HERO_BAND_COLORS[band1].color,
      label: HERO_BAND_COLORS[band1].label,
      onPress: () => setBand1((band1 % 9) + 1),
    },
    {
      role: 'Second band',
      color: HERO_BAND_COLORS[band2].color,
      label: HERO_BAND_COLORS[band2].label,
      onPress: () => setBand2((band2 + 1) % 10),
    },
    {
      role: 'Multiplier band',
      color: HERO_MULTIPLIER_COLORS[band3].color,
      label: HERO_MULTIPLIER_COLORS[band3].label,
      onPress: () => setBand3((band3 + 1) % HERO_MULTIPLIER_COLORS.length),
    },
  ];

  return (
    <View style={resistorStyles.widget}>
      <View style={resistorStyles.row}>
        <View style={[resistorStyles.lead, { width: leadWidth }]} />
        <View
          style={[
            resistorStyles.body,
            { width: bodyWidth, height: bodyHeight, gap: space.three + 4 },
          ]}>
          {bands.map((band) => (
            <Pressable
              key={band.role}
              onPress={band.onPress}
              accessibilityRole="button"
              accessibilityLabel={`${band.role}, ${band.label}. Activate to change.`}
              style={({ pressed }) => [
                resistorStyles.band,
                { width: bandWidth, backgroundColor: band.color },
                pressed && resistorStyles.bandPressed,
              ]}
            />
          ))}
          <View
            style={[
              resistorStyles.band,
              resistorStyles.tolerance,
              { width: bandWidth, backgroundColor: TOLERANCE_COLOR },
            ]}
          />
        </View>
        <View style={[resistorStyles.lead, { width: leadWidth }]} />
      </View>

      <Text style={resistorStyles.value} accessibilityLiveRegion="polite">
        {value}
      </Text>
      <Text style={resistorStyles.hint}>
        Press a band to change its colour and read the new value.
      </Text>
    </View>
  );
}

const resistorStyles = StyleSheet.create({
  widget: {
    width: '100%',
    gap: space.three,
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
    backgroundColor: colors.resistorBlue,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  band: {
    height: '100%',
  },
  bandPressed: {
    opacity: 0.6,
  },
  tolerance: {
    marginLeft: 'auto',
  },
  value: {
    fontFamily: type.screenTitle.fontFamily,
    fontSize: 34,
    lineHeight: 38,
    color: colors.ink,
  },
  hint: {
    ...type.bodyMuted,
    maxWidth: 320,
  },
});