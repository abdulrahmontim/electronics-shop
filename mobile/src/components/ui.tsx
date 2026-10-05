import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, radius, space, touchTarget, type } from '@/constants/theme';

type Variant = 'primary' | 'ghost' | 'quiet';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  busy?: boolean;
  full?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

/**
 * Buttons say what happens next, using the same wording as the web shop, and
 * every one is at least 48dp tall so it is comfortable under a thumb.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  busy = false,
  full = false,
  style,
  accessibilityHint,
}: ButtonProps) {
  const isDisabled = disabled || busy;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy }}
      style={({ pressed }) => [
        buttonStyles.base,
        variant === 'primary' && buttonStyles.primary,
        variant === 'ghost' && buttonStyles.ghost,
        variant === 'quiet' && buttonStyles.quiet,
        full && buttonStyles.full,
        pressed && !isDisabled && buttonStyles.pressed,
        isDisabled && buttonStyles.disabled,
        style,
      ]}>
      {busy ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.paper : colors.ink}
        />
      ) : (
        <Text
          style={[
            type.button,
            variant !== 'primary' && buttonStyles.textDark,
            full && buttonStyles.centeredText,
          ]}
          numberOfLines={2}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const buttonStyles = StyleSheet.create({
  base: {
    minHeight: touchTarget,
    paddingHorizontal: space.six,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  primary: {
    backgroundColor: colors.ink,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: colors.ink,
  },
  quiet: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    paddingHorizontal: space.two,
  },
  textDark: {
    color: colors.ink,
  },
  full: {
    alignSelf: 'stretch',
  },
  centeredText: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.45,
  },
});

/** A pill used for the category filter, matching the web app's chips. */
export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={active ? `${label}, selected` : label}
      style={({ pressed }) => [
        chipStyles.chip,
        active && chipStyles.active,
        pressed && buttonStyles.pressed,
      ]}>
      <Text style={[type.label, active && chipStyles.activeText]}>{label}</Text>
    </Pressable>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    minHeight: 40,
    paddingHorizontal: space.four,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    backgroundColor: 'transparent',
  },
  active: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  activeText: {
    color: colors.paper,
  },
});

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
  editable?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoComplete?:
    | 'name'
    | 'tel'
    | 'email'
    | 'street-address'
    | 'address-line1'
    | 'address-line2';
  multiline?: boolean;
  error?: string | null;
};

/** A labelled text field. Every input in the app goes through this. */
export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
  keyboardType,
  autoComplete,
  multiline = false,
  error,
}: FieldProps) {
  return (
    <View style={fieldStyles.wrapper}>
      <Text style={type.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        editable={editable}
        keyboardType={keyboardType}
        autoComplete={autoComplete}
        multiline={multiline}
        accessibilityLabel={label}
        style={[
          fieldStyles.input,
          multiline && fieldStyles.multiline,
          !editable && fieldStyles.readOnly,
          !!error && fieldStyles.inputError,
        ]}
      />
      {!!error && <Text style={fieldStyles.error}>{error}</Text>}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrapper: {
    gap: space.one,
  },
  input: {
    minHeight: touchTarget,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    paddingHorizontal: space.three + 2,
    paddingVertical: space.two,
    backgroundColor: colors.white,
    color: colors.ink,
    fontSize: 16,
  },
  multiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  readOnly: {
    backgroundColor: colors.panel,
    color: colors.muted,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    ...type.small,
    color: colors.danger,
  },
});

/** A status strip. `live` makes screen readers announce changes. */
export function Message({
  tone,
  children,
  live = false,
}: {
  tone: 'success' | 'error' | 'neutral';
  children: ReactNode;
  live?: boolean;
}) {
  return (
    <View
      accessible
      accessibilityLiveRegion={live ? 'polite' : 'none'}
      style={[
        messageStyles.base,
        tone === 'success' && messageStyles.success,
        tone === 'error' && messageStyles.error,
        tone === 'neutral' && messageStyles.neutral,
      ]}>
      <Text style={messageStyles.text}>{children}</Text>
    </View>
  );
}

const messageStyles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    padding: space.three + 2,
  },
  success: {
    backgroundColor: colors.okBg,
  },
  error: {
    backgroundColor: colors.dangerBg,
  },
  neutral: {
    backgroundColor: colors.panel,
  },
  text: {
    ...type.body,
    fontSize: 15,
    lineHeight: 21,
  },
});

/** A small rounded label, used for order status. */
export function Pill({ label }: { label: string }) {
  return (
    <View style={pillStyles.pill}>
      <Text style={pillStyles.text}>{label}</Text>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.panel,
    paddingHorizontal: space.three,
    paddingVertical: space.one + 2,
    borderRadius: radius.pill,
  },
  text: {
    ...type.label,
    fontSize: 13,
  },
});

/** A hairline rule, matching the ruled rows the web cart uses. */
export function Divider() {
  return <View style={dividerStyles.line} />;
}

const dividerStyles = StyleSheet.create({
  line: {
    height: 1,
    backgroundColor: colors.hairline,
  },
});

/** A plain text link that still meets the minimum touch target. */
export function LinkButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        linkStyles.base,
        pressed && !disabled && buttonStyles.pressed,
        disabled && buttonStyles.disabled,
      ]}>
      <Text style={linkStyles.text}>{label}</Text>
    </Pressable>
  );
}

const linkStyles = StyleSheet.create({
  base: {
    minHeight: touchTarget,
    justifyContent: 'center',
  },
  text: {
    ...type.body,
    fontSize: 15,
    color: colors.muted,
    textDecorationLine: 'underline',
  },
});