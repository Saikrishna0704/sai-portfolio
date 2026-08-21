"use client";

import { Html } from "@react-three/drei";

import styles from "./BodyLabel.module.css";

interface BodyLabelProps {
  text: string;
  /** Where the label sits relative to its body, in world units. */
  position: [number, number, number];
  variant: "domain" | "project";
}

/**
 * Labels are real DOM text rendered at a fixed pixel size (PROJECT.md §9 —
 * no text baked into 3D surfaces). They stay legible even when the system is
 * framed small on a narrow viewport, where the bodies themselves shrink.
 *
 * The whole scene layer is `aria-hidden`, so these are the visual echo of the
 * domain and project names; Quick View carries them for assistive technology.
 */
export function BodyLabel({ text, position, variant }: BodyLabelProps) {
  return (
    <Html
      position={position}
      center
      // Labels never intercept input; selection arrives in Phase 4.
      style={{ pointerEvents: "none" }}
      // Keep labels behind the DOM shell chrome.
      zIndexRange={[5, 0]}
    >
      <span className={variant === "domain" ? styles.domain : styles.project}>
        {text}
      </span>
    </Html>
  );
}
