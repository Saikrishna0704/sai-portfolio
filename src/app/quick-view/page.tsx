import type { Metadata } from "next";

import { QuickViewContent } from "@/components/quick-view/QuickViewContent";
import { portfolioData } from "@/data/portfolio-data";

export const metadata: Metadata = {
  title: `Quick View · ${portfolioData.person.name}`,
};

/**
 * The page stays a server component so metadata is resolved on the server; the
 * body is a client component because selecting a skill to see where it appears
 * is interactive state.
 */
export default function QuickViewPage() {
  return <QuickViewContent />;
}
