"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

/**
 * Reports the moment the scene has actually drawn something.
 *
 * Mounting is not the same as being visible: R3F has to measure its container
 * and render before there is anything on the canvas. Fading in on mount would
 * reveal an empty canvas and then pop, which is the problem being solved.
 */
export function FirstFrameSignal({ onFirstFrame }: { onFirstFrame: () => void }) {
  const reported = useRef(false);

  useFrame(() => {
    if (reported.current) return;
    reported.current = true;
    onFirstFrame();
  });

  return null;
}
