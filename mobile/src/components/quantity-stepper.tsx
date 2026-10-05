import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, touchTarget, type } from '@/constants/theme';

type Props = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max: number;
  label: string;
  disabled?: boolean;
};

/**
 * Minus and plus controls instead of a desktop dropdown, so the quantity can be
 * changed with one thumb. The buttons stay disabled at the limits rather than
 * silently doing nothing.
 */
export function QuantityStepper({ value, onChange, min = 1, max, label, disabled }: Props) {
  const canDecrease = !disabled && value > min;
  const canIncrease = !disabled && value < max;

  return (
    <View style={styles.row} accessibilityLabel={label}>
      <Pressable
        onPress={() => onChange(value - 1)}
        disabled={!canDecrease}
        accessibilityRole="button"
        accessibilityLabel={`Decrease quantity of ${label}`}
        accessibilityState={{ disabled: !canDecrease }}
        hitSlop={6}
        style={({ pressed }) => [
          styles.button,
          !canDecrease && styles.buttonDisabled,
          pressed && canDecrease && styles.pressed,
        ]}>
        <Text style={styles.symbol}>−</Text>
      </Pressable>

      <Text style={styles.value} accessibilityLiveRegion="polite">
        {value}
      </Text>

      <Pressable
        onPress={() => onChange(value + 1)}
        disabled={!canIncrease}
        accessibilityRole="button"
        accessibilityLabel={`Increase quantity of ${label}`}
        accessibilityState={{ disabled: !canIncrease }}
        hitSlop={6}
        style={({ pressed }) => [
          styles.button,
          !canIncrease && styles.buttonDisabled,
          pressed && canIncrease && styles.pressed,
        ]}>
        <Text style={styles.symbol}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.hairline,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  button: {
    width: touchTarget,
    height: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.35,
  },
  pressed: {
    backgroundColor: colors.panel,
  },
  symbol: {
    ...type.sectionTitle,
    fontSize: 22,
    lineHeight: 26,
  },
  value: {
    ...type.price,
    minWidth: 36,
    textAlign: 'center',
  },
});