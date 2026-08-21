"use client";

import { useSyncExternalStore } from "react";

/** Matches the breakpoint the CSS already uses for the narrow layout. */
const QUERY = "(max-width: 47.99rem)";

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
  // The scene is client only, so this is never really used; assume the roomier
  // layout rather than stripping bodies out on a guess.
  return false;
}

/**
 * Whether the viewport is narrow enough to warrant a simplified scene.
 *
 * PROJECT.md §12 allows mobile to show fewer bodies. Same `useSyncExternalStore`
 * approach as the reduced-motion hook: matchMedia is an external store, and
 * subscribing this way avoids a render pass with a known-wrong value.
 */
export function useIsCompact(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
