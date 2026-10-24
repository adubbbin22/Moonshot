/**
 * Build-time switches. EXPO_PUBLIC_ values are compiled into the bundle, so
 * anything here is visible to anyone with the app; keep it to conveniences.
 */

/** Testing shortcuts in the UI (skip onboarding with sample calls). On in dev builds, off in releases unless asked for. */
export const testShortcuts = __DEV__ || process.env.EXPO_PUBLIC_TEST_SHORTCUTS === '1';
