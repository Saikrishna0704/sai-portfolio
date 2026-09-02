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
  /** Marks this body as the one currently in focus. */
  active?: boolean;
  /**
   * Selects the body this label belongs to. When given, the label becomes a
   * real target rather than a caption.
   */
  onSelect?: () => void;
  onHover?: (hovering: boolean) => void;
}

/**
 * Labels are real DOM text rendered at a fixed pixel size (PROJECT.md §9 —
 * no text baked into 3D surfaces). They stay legible even when the system is
 * framed small on a narrow viewport, where the bodies themselves shrink.
 *
 * They wait out the opening approach. Being a fixed pixel size is what keeps
 * them legible once the system is framed, but it also means that with the
 * camera still far out they stay full size over bodies the size of a full stop
 * and collect in a heap at the centre of the screen. They belong to the system
 * as it is meant to be seen, so they arrive with it.
 *
 * When `onSelect` is given the label is also the body's largest click target,
 * and is drawn as one — a bordered chip rather than floating text. That is the
 * whole affordance for this scene: a visitor who does not know a sphere can be
 * clicked will recognise a button, and the label is far easier to hit than a
 * moon a few pixels across.
 *
 * It is deliberately clickable but not focusable. The scene layer is
 * `aria-hidden`, so a focusable control inside it would be reachable by
 * keyboard while invisible to a screen reader. The header's domain navigation
 * is the accessible equivalent, and it carries every domain.
 */
export function BodyLabel({
  text,
  position,
  variant,
  dimmed,
  active,
  onSelect,
  onHover,
}: BodyLabelProps) {
  const arrived = useSceneArrived();
  const interactive = Boolean(onSelect);

  return (
    <Html
      position={position}
      center
      style={{ pointerEvents: interactive ? "auto" : "none" }}
      // Keep labels behind the DOM shell chrome.
      zIndexRange={[5, 0]}
    >
      <span
        className={[
          variant === "domain" ? styles.domain : styles.project,
          interactive ? styles.interactive : "",
          active ? styles.active : "",
          dimmed ? styles.dimmed : "",
          arrived ? "" : styles.waiting,
        ]
          .filter(Boolean)
          .join(" ")}
        /* The canvas resets to the overview on `onPointerMissed`, and a click
           on this overlay hits no 3D object, so without stopping the pointer
           sequence the chip selected its body and was immediately overruled.
           A programmatic click worked and a real one did not, which is what
           gave it away. */
        onPointerDown={interactive ? (event) => event.stopPropagation() : undefined}
        onPointerUp={interactive ? (event) => event.stopPropagation() : undefined}
        onClick={
          onSelect
            ? (event) => {
                event.stopPropagation();
                onSelect();
              }
            : undefined
        }
        onPointerEnter={onHover ? () => onHover(true) : undefined}
        onPointerLeave={onHover ? () => onHover(false) : undefined}
      >
        {text}
      </span>
    </Html>
  );
}
