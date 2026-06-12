import { Platform } from 'react-native';
import type { EdgeInsets } from 'react-native-safe-area-context';

/** Height reserved for tab icons + labels (centered row, no extra top padding). */
export const TAB_BAR_CONTENT_HEIGHT = 48;

/** Extra space between tab labels and the system navigation / home-indicator zone. */
export const TAB_BAR_ITEM_BOTTOM_GAP = 12;

/** Minimum bottom inset when Android reports 0 (3-button navigation bar). */
const ANDROID_NAV_BAR_FALLBACK = 16;

/**
 * Bottom inset for the tab bar: native safe area, with Android fallback when the OS reports 0.
 */
export function getBottomTabInset(insets: EdgeInsets): number {
  return Math.max(insets.bottom, Platform.OS === 'android' ? ANDROID_NAV_BAR_FALLBACK : 0);
}

/** Total tab bar height including item gap and system navigation / home-indicator clearance. */
export function getTabBarTotalHeight(insets: EdgeInsets): number {
  return TAB_BAR_CONTENT_HEIGHT + TAB_BAR_ITEM_BOTTOM_GAP + getBottomTabInset(insets);
}
