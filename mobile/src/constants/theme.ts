import { Platform, TextStyle } from 'react-native';

/**
 * The Bench Supply palette, copied from the web app's globals.css so the phone
 * and the desktop are recognisably the same shop.
 */
export const colors = {
  paper: '#F4F5F1',
  panel: '#E7EAE3',
  ink: '#1B2440',
  muted: '#5A6378',
  hairline: '#D3D8D0',
  resistorBlue: '#3E6FA3',
  bandYellow: '#F2B705',
  ok: '#2E7D4F',
  okBg: '#E3F3E8',
  danger: '#B3261E',
  dangerBg: '#FDECEA',
  lead: '#9AA1AD',
  white: '#FFFFFF',
} as const;

/**
 * Base spacing unit. Everything is a multiple of this so gaps stay on the same
 * rhythm across screens.
 */
export const space = {
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  seven: 32,
  eight: 40,
} as const;

/**
 * Page padding scales with the screen so a small phone is not cramped and a
 * large one is not lost in space. Nothing in the layout depends on a fixed
 * device width.
 */
export const pagePadding = (width: number) =>
  width >= 600 ? space.six : width >= 400 ? space.five : space.four;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

/** Apple's guidance is 44pt; Android's Material guidance is 48dp. */
export const touchTarget = 48;

export const fonts = {
  display: 'BricolageGrotesque_600SemiBold',
  displayBold: 'BricolageGrotesque_800ExtraBold',
  body: 'IBMPlexSans_400Regular',
  bodyMedium: 'IBMPlexSans_500Medium',
  bodySemiBold: 'IBMPlexSans_600SemiBold',
} as const;

export const type = {
  screenTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 30,
    lineHeight: 34,
    color: colors.ink,
  } as TextStyle,
  heroTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 34,
    lineHeight: 37,
    color: colors.ink,
  } as TextStyle,
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 26,
    color: colors.ink,
  } as TextStyle,
  productName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    lineHeight: 21,
    color: colors.ink,
  } as TextStyle,
  body: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 23,
    color: colors.ink,
  } as TextStyle,
  bodyMuted: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: colors.muted,
  } as TextStyle,
  small: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  } as TextStyle,
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    lineHeight: 19,
    color: colors.ink,
  } as TextStyle,
  price: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    lineHeight: 21,
    color: colors.ink,
  } as TextStyle,
  priceLarge: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 31,
    color: colors.ink,
  } as TextStyle,
  button: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    lineHeight: 20,
    color: colors.paper,
  } as TextStyle,
} as const;

export const hairlineWidth = Platform.select({ android: 1, default: 1 });