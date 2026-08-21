"use client";

import { useSyncExternalStore } from "react";

let arrived = false;
const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

/**
 * Announces that the camera has finished its opening approach.
 *
 * Fired once, from the frame loop, and ignored afterwards: a single render at
 * the end of the arrival is worth it to let the DOM layer respond, but nothing
 * here may tick per frame.
 */
export function markSceneArrived(): void {
  if (arrived) return;
  arrived = true;
  listeners.forEach((listener) => listener());
}

/**
 * Whether the system has settled into place.
 *
 * True immediately when there is no opening approach to wait for, so an
 * ordinary load is not held back by machinery that only the intro needs.
 */
export function useSceneArrived(): boolean {
  return useSyncExternalStore(subscribe, () => arrived, () => true);
}
