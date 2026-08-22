import type { Metadata } from "next";

import { DossierContent } from "@/components/dossier/DossierContent";

export const metadata: Metadata = {
  // The root layout's title template appends the name.
  title: "Dossier",
};

/**
 * The page stays a server component so metadata is resolved on the server; the
 * body is a client component because selecting a skill to see where it appears
 * is interactive state.
 */
export default function DossierPage() {
  return <DossierContent />;
}
