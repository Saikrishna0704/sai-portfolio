"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Where the visitor is in the explicit overview → domain → project navigation
 * (CLAUDE.md). This is the single source of truth: the scene reflects it and
 * writes to it, but application state is never inferred back out of camera or
 * body coordinates.
 */
export type Selection =
  | { kind: "overview" }
  | { kind: "domain"; domainId: string }
  | { kind: "project"; domainId: string; projectId: string }
  /**
   * A minor body out in the belt: a side project or archived work. Its own
   * variant rather than a project with a null domain, so none of the
   * domain-and-project logic has to grow a special case.
   */
  | { kind: "asteroid"; asteroidId: string };

/** What the pointer is currently over, if anything. */
export interface Hover {
  domainId: string;
  projectId?: string;
}

interface SelectionContextValue {
  selection: Selection;
  hover: Hover | null;
  /**
   * The domain currently receiving emphasis — selected if there is a
   * selection, otherwise merely hovered. Hover previews a domain without
   * committing to it.
   */
  activeDomainId: string | null;
  select: (next: Selection) => void;
  setHover: (next: Hover | null) => void;
  /** Steps up one level: project → its domain → overview. */
  goUp: () => void;
  clearSelection: () => void;
}

const SelectionContext = createContext<SelectionContextValue | null>(null);

const OVERVIEW: Selection = { kind: "overview" };

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<Selection>(OVERVIEW);
  const [hover, setHover] = useState<Hover | null>(null);

  const clearSelection = useCallback(() => setSelection(OVERVIEW), []);

  const select = useCallback((next: Selection) => setSelection(next), []);

  const goUp = useCallback(() => {
    setSelection((current) =>
      current.kind === "project"
        ? { kind: "domain", domainId: current.domainId }
        : OVERVIEW,
    );
  }, []);

  // Escape steps back up the hierarchy rather than jumping straight out, so
  // there is always a way back that does not depend on finding a control
  // (PROJECT.md §5) and does not overshoot the level you came from.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") goUp();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goUp]);

  const value = useMemo<SelectionContextValue>(() => {
    // An asteroid belongs to no domain, so focusing one leaves every domain
    // unemphasised rather than picking an arbitrary winner.
    const activeDomainId =
      selection.kind === "domain" || selection.kind === "project"
        ? selection.domainId
        : (hover?.domainId ?? null);

    return {
      selection,
      hover,
      activeDomainId,
      select,
      setHover,
      goUp,
      clearSelection,
    };
  }, [selection, hover, select, goUp, clearSelection]);

  return (
    <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>
  );
}

export function useSelection(): SelectionContextValue {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error("useSelection must be used inside a SelectionProvider");
  }
  return context;
}
