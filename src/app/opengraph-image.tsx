import { ImageResponse } from "next/og";

import { portfolioData } from "@/data/portfolio-data";
import { STAR_COLOR } from "@/scene/layout";

/**
 * The card people actually see first.
 *
 * A shared link is often the only impression this site gets before someone
 * decides whether to open it, and until now it had none: no image, no title
 * card, nothing. Drawn with the scene's own vocabulary — the star, an orbit,
 * the void — so the preview and the page look like the same object.
 *
 * No font is loaded on purpose. Fetching one at build turns a static export
 * into something that can fail offline, and the identity here is carried by
 * the composition rather than the letterforms.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const { person } = portfolioData;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#04060b",
          padding: 80,
          alignItems: "center",
        }}
      >
        {/* The system, off to the right: a star and the orbit it anchors. */}
        <div
          style={{
            position: "absolute",
            top: 105,
            right: -170,
            width: 620,
            height: 620,
            borderRadius: 620,
            border: "1px solid rgba(185, 212, 255, 0.16)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 215,
            right: -60,
            width: 400,
            height: 400,
            borderRadius: 400,
            border: "1px solid rgba(185, 212, 255, 0.1)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 355,
            right: 100,
            width: 120,
            height: 120,
            borderRadius: 120,
            background: STAR_COLOR,
            boxShadow: `0 0 120px 40px rgba(255, 215, 163, 0.28)`,
            display: "flex",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: 700,
          }}
        >
          <div
            style={{
              fontSize: 22,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: "#5e6979",
              marginBottom: 28,
            }}
          >
            Portfolio
          </div>

          <div
            style={{
              fontSize: 82,
              lineHeight: 1.04,
              color: "#e6ecf6",
              letterSpacing: -2,
            }}
          >
            {person.name}
          </div>

          <div
            style={{
              fontSize: 26,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#b9d4ff",
              marginTop: 30,
            }}
          >
            {person.tagline}
          </div>

          <div
            style={{
              width: 120,
              height: 1,
              background: "rgba(214, 226, 245, 0.22)",
              marginTop: 42,
              marginBottom: 30,
              display: "flex",
            }}
          />

          <div
            style={{
              fontSize: 25,
              lineHeight: 1.45,
              color: "#909db4",
            }}
          >
            {person.bio}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
