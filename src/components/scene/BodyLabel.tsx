"use client";

import { Html } from "@react-three/drei";

import { useSceneArrived } from "./arrivalState";

import styles from "./BodyLabel.module.css";

interface BodyLabelProps {
  text: string;
  /** Where the label sits relative to its body, in world units. */
  position: [number, number, number];
  variant: "domain" | "project";
  /** Recedes with its body when another domain holds focus. */
  dimmed: boolean;
}

/**
 * Labels are real DOM text rendered at a fixed pixel size (PROJECT.md §9 —
 * no text baked into 3D surfaces). They stay legible even when the system is
 * framed small on a narrow viewport, where the bodies themselves shrink.
 *
 * The whole scene layer is `aria-hidden`, so these are the visual echo of the
 * domain and project names; Quick View carries them for assistive technology.
 *
 * They wait out the opening approach. Being a fixed pixel size is what keeps
 * them legible once the system is framed, but it also means that with the
 * camera still far out they stay full size over bodies the size of a full stop
 * and collect in a heap at the centre of the screen. They belong to the system
 * as it is meant to be seen, so they arrive with it.
 */
export function BodyLabel({
  text,
  position,
  variant,
  dimmed,
}: BodyLabelProps) {
  const arrived = useSceneArrived();

  return (
    <Html
      position={position}
      center
      // Labels never intercept input; selection arrives in Phase 4.
      style={{ pointerEvents: "none" }}
      // Keep labels behind the DOM shell chrome.
      zIndexRange={[5, 0]}
    >
      <span
        className={[
          variant === "domain" ? styles.domain : styles.project,
          dimmed ? styles.dimmed : "",
          arrived ? "" : styles.waiting,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {text}
      </span>
    </Html>
  );
}
