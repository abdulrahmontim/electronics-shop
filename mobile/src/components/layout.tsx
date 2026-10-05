import type { ReactNode } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, space, type } from '@/constants/theme';
import { Button } from './ui';

/**
 * Page padding derived from the window, so a small phone is not cramped and a
 * large one is not lost in whitespace. No layout depends on a device width.
 */
export function usePagePadding() {
  const { width } = useWindowDimensions();
  return width >= 600 ? space.six : width >= 400 ? space.five : space.four;
}

/** A screen title with an optional back arrow, used on every pushed screen. */
export function ScreenHeader({
  title,
  subtitle,
  showBack = true,
  right,
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  right?: ReactNode;
}) {
  const router = useRouter();
  return (
    <View style={headerStyles.row}>
      {showBack && (
        <Button
          label="Back"
          variant="quiet"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          accessibilityHint="Goes to the previous screen"
          style={headerStyles.back}
        />
      )}
      <View style={headerStyles.text}>
        <Text style={type.screenTitle}>{title}</Text>
        {!!subtitle && <Text style={type.small}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

const headerStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.two,
    paddingBottom: space.three,
  },
  back: {
    marginLeft: -space.three,
    marginTop: -space.two,
  },
  text: {
    flex: 1,
    gap: space.one,
  },
});

/**
 * An empty or error state always offers the next action, the way the web shop
 * does, so no screen is ever a dead end.
 */
export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
  tone = 'neutral',
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'neutral' | 'error';
}) {
  return (
    <View style={emptyStyles.wrapper}>
      <Text style={type.sectionTitle}>{title}</Text>
      <Text style={[type.bodyMuted, tone === 'error' && emptyStyles.errorBody]}>{body}</Text>
      {!!actionLabel && !!onAction && (
        <Button label={actionLabel} onPress={onAction} style={emptyStyles.action} />
      )}
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  wrapper: {
    gap: space.two,
    paddingVertical: space.four,
  },
  errorBody: {
    color: colors.danger,
  },
  action: {
    alignSelf: 'flex-start',
    marginTop: space.two,
  },
});

/** Wraps a screen's content with the top safe-area inset applied. */
export function SafeTop({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={{ paddingTop: Math.max(insets.top, space.three) }}>{children}</View>;
}