"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { nameRenderings } from "@/data/name-renderings";
import { portfolioData } from "@/data/portfolio-data";

import {
  markOpeningPlayed,
  markOpeningRevealing,
  useShouldPlayOpening,
} from "./openingState";

import styles from "./OpeningSequence.module.css";

/** Milliseconds each script holds before the next. Long enough to actually
 *  read the letterforms rather than register a flicker. */
const CYCLE_MS = 180;
/** How long the resolved full name holds before it moves. Long enough for the
 *  tagline to surface beneath it and be read, not so long it needs skipping. */
const HOLD_MS = 1150;
/** The morph itself. Unhurried: this is the moment the page opens. */
const MORPH_MS = 1150;
/** Element the name flies into. */
const BRAND_ID = "site-brand";

type Phase = "cycling" | "resolved" | "morphing";

/**
 * The opening: the name at centre, cycling through scripts at pace, resolving
 * to the full name, then flying into the header.
 *
 * The last step is a real shared-element morph rather than a fade: the intro
 * name is measured against the header brand's actual position and scaled into
 * it, so the thing you were reading becomes the thing in the corner. The scene
 * loads behind the whole time and is usually ready before the overlay clears.
 *
 * Never gates the page. It plays once per tab, skips on any input, and does
 * not run at all when motion is reduced, per PROJECT.md §1: the immersive
 * layer enhances access to information and must never block it.
 */
export function OpeningSequence() {
  const shouldPlay = useShouldPlayOpening();
  const [phase, setPhase] = useState<Phase>("cycling");
  const [index, setIndex] = useState(0);
  const nameRef = useRef<HTMLSpanElement>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  const finish = useCallback(() => {
    clearTimers();
    // Unmounts this component, since the store now reports it as played.
    markOpeningPlayed();
  }, []);

  /** Fly the name into the header, then clear. */
  const morph = useCallback(() => {
    setPhase("morphing");
    // The scene has been holding out in the dark waiting for this.
    markOpeningRevealing();

    const node = nameRef.current;
    const brand = document.getElementById(BRAND_ID);

    if (node && brand) {
      const from = node.getBoundingClientRect();
      const to = brand.getBoundingClientRect();
      // Scale on width: same text in the same face, so matching the width
      // lands the letters on top of the header's own.
      const scale = to.width / from.width;
      const dx = to.left + to.width / 2 - (from.left + from.width / 2);
      const dy = to.top + to.height / 2 - (from.top + from.height / 2);
      node.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
    }

    timers.current.push(window.setTimeout(finish, MORPH_MS));
  }, [finish]);

  // Every effect below is guarded on shouldPlay: hooks run before the early
  // return, so without it the timers would tick for someone who never sees
  // the overlay at all.
  useEffect(() => {
    if (!shouldPlay || phase !== "cycling") return;

    if (index < nameRenderings.length - 1) {
      const id = window.setTimeout(() => setIndex((n) => n + 1), CYCLE_MS);
      timers.current.push(id);
      return;
    }

    const toResolved = window.setTimeout(() => setPhase("resolved"), CYCLE_MS);
    timers.current.push(toResolved);
  }, [shouldPlay, phase, index]);

  useEffect(() => {
    if (!shouldPlay || phase !== "resolved") return;
    const id = window.setTimeout(morph, HOLD_MS);
    timers.current.push(id);
  }, [shouldPlay, phase, morph]);

  // Any input skips. Someone who wants the page should never have to wait.
  useEffect(() => {
    if (!shouldPlay) return;

    const skip = () => morph();
    window.addEventListener("pointerdown", skip, { once: true });
    window.addEventListener("keydown", skip, { once: true });
    window.addEventListener("wheel", skip, { once: true, passive: true });

    return () => {
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("wheel", skip);
    };
  }, [shouldPlay, morph]);

  useEffect(() => clearTimers, []);

  if (!shouldPlay) return null;

  const current = nameRenderings[index] ?? nameRenderings[0];
  const isCycling = phase === "cycling";

  return (
    // Decorative: the name is already in the header and the heading, so there
    // is nothing here for assistive technology to miss.
    <div
      className={`${styles.overlay} ${phase === "morphing" ? styles.clearing : ""}`}
      aria-hidden="true"
    >
      <div className={styles.lockup}>
        <span
          ref={nameRef}
          className={styles.name}
          style={{ transitionDuration: `${MORPH_MS}ms` }}
          lang={isCycling ? current?.lang : "en"}
          // Keyed so each script gets its own entrance rather than morphing
          // letter by letter into the next, which at this pace reads as noise.
          key={isCycling ? current?.script : "full"}
        >
          {isCycling ? current?.text : portfolioData.person.name}
        </span>
        {/* Space reserved throughout so its arrival never shifts the name;
            it surfaces only once the name has resolved, and stays put while
            the name flies — a ground the departure happens over. */}
        <span
          className={`${styles.tagline} ${
            phase !== "cycling" ? styles.taglineShown : ""
          } ${phase === "morphing" ? styles.taglineParting : ""}`}
        >
          {portfolioData.person.tagline}
        </span>
      </div>
    </div>
  );
}
