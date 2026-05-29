import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "逼逼機器人 BIBIBOT — 在 Discord 裡，開一座小宇宙";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Palette mirrors the landing page (dark editorial, mint-sage accent).
const BG = "#0d0e0d";
const INK = "#f5f5ef";
const INK2 = "#c9cac2";
const INK3 = "#8a8c84";
const LINE = "#282a28";
const ACCENT = "#d8e3c4";
const ACCENT_INK = "#14160f";

export default async function Image() {
  const [serif, mono] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/NotoSerifTC-subset.ttf")),
    readFile(join(process.cwd(), "assets/fonts/JetBrainsMono-subset.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "68px 72px",
          background: BG,
          backgroundImage: `radial-gradient(120% 90% at 88% -15%, ${ACCENT}22 0%, transparent 55%)`,
          color: INK,
          fontFamily: "Serif",
        }}
      >
        {/* top — brand lockup */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: ACCENT,
              color: ACCENT_INK,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Mono",
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: -1,
            }}
          >
            BB
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "Mono",
              fontSize: 19,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: INK3,
            }}
          >
            逼逼機器人 · BIBIBOT
          </div>
        </div>

        {/* middle — headline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 92, lineHeight: 1.02, letterSpacing: -2 }}>
            在 Discord 裡，
          </div>
          <div style={{ display: "flex", fontSize: 92, lineHeight: 1.04, letterSpacing: -2 }}>
            開一座
            <span style={{ color: ACCENT }}>小宇宙</span>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 30,
              fontSize: 27,
              color: INK2,
              letterSpacing: 1,
            }}
          >
            挖礦 · 賭場 · 樂透 · 股市 · 經濟 · 等級
          </div>
        </div>

        {/* bottom — fun line + invite */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `1px solid ${LINE}`,
            paddingTop: 26,
          }}
        >
          <div style={{ display: "flex", fontSize: 24, color: INK2 }}>
            一支機器人，把你的肝變現——有點難戒
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontFamily: "Mono",
              fontSize: 22,
              color: ACCENT,
            }}
          >
            <div style={{ width: 10, height: 10, borderRadius: 10, background: ACCENT, display: "flex" }} />
            discord.gg/shushu010829
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Serif", data: serif, style: "normal", weight: 500 },
        { name: "Mono", data: mono, style: "normal", weight: 500 },
      ],
    },
  );
}
