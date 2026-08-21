"use client";

import { useSyncExternalStore } from "react";

import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/** Once per tab: returning to the overview should not replay the opening. */
const SESSION_KEY = "opening-played";

let played = false;
const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function getSnapshot(): boolean {
  if (played) return true;
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    // Private browsing can throw on access. Treat it as not yet played; the
    // worst case is that the opening runs again on the next navigation.
    return false;
  }
}

function getServerSnapshot(): boolean {
  // Nothing renders on the server: the decision depends on a media query and
  // on session state, neither of which exists there.
  return true;
}

/** Records that the opening has run, which unmounts it. */
export function markOpeningPlayed(): void {
  played = true;
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // Not being able to remember is harmless.
  }
  listeners.forEach((listener) => listener());
}

/**
 * Whether the opening should run.
 *
 * Modelled as an external store rather than decided in an effect, matching how
 * the reduced-motion preference is read: an effect that sets state would
 * render once with a value already known to be wrong.
 */
export function useShouldPlayOpening(): boolean {
  const reducedMotion = usePrefersReducedMotion();
  const hasPlayed = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return !reducedMotion && !hasPlayed;
}
