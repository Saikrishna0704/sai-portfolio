import type { Metadata } from "next";

import { DossierContent } from "@/components/dossier/DossierContent";
import { portfolioData } from "@/data/portfolio-data";

export const metadata: Metadata = {
  title: `Dossier · ${portfolioData.person.name}`,
};

/**
 * The page stays a server component so metadata is resolved on the server; the
 * body is a client component because selecting a skill to see where it appears
 * is interactive state.
 */
export default function DossierPage() {
  return <DossierContent />;
}
