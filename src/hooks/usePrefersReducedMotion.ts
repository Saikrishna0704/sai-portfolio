"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

let mediaQuery: MediaQueryList | null = null;

function getMediaQuery(): MediaQueryList {
  mediaQuery ??= window.matchMedia(QUERY);
  return mediaQuery;
}

function subscribe(onStoreChange: () => void): () => void {
  const query = getMediaQuery();
  query.addEventListener("change", onStoreChange);
  return () => query.removeEventListener("change", onStoreChange);
}

function getSnapshot(): boolean {
  return getMediaQuery().matches;
}

function getServerSnapshot(): boolean {
  // Stillness is the safe default: the scene's static layout is a complete
  // view, so a first paint that hasn't read the preference yet shows no motion
  // rather than motion someone asked not to see.
  return true;
}

/**
 * Tracks the viewer's reduced-motion preference, and keeps tracking it — the
 * setting can be changed while the page is open.
 *
 * `useSyncExternalStore` rather than an effect writing state: matchMedia is an
 * external store, and subscribing to it this way avoids a render pass where
 * the value is known to be wrong.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
