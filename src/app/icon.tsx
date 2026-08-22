import { ImageResponse } from "next/og";

import { STAR_COLOR } from "@/scene/layout";

/**
 * The favicon: the star at the centre of the system.
 *
 * Generated rather than committed, for the same reason every surface in the
 * scene is: this project ships no bitmaps. It is also the one mark that has
 * to survive at 16px, so it is a single lit disc on the void and nothing else.
 */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#04060b",
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: 20,
            background: STAR_COLOR,
            boxShadow: `0 0 10px 3px ${STAR_COLOR}`,
          }}
        />
      </div>
    ),
    size,
  );
}
