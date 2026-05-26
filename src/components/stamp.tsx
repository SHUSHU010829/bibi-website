"use client";

import { useEffect, useState } from "react";

export default function Stamp() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now ? now.toTimeString().slice(0, 8) : "——:——:——";
  const date = now
    ? `${now.getFullYear()}–${String(now.getMonth() + 1).padStart(2, "0")}–${String(now.getDate()).padStart(2, "0")}`
    : "————–——–——";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontFamily: "var(--font-jetbrains), monospace",
        fontSize: 11,
        letterSpacing: "0.06em",
        color: "var(--color-secondary)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <span>{time}</span>
      <span style={{ opacity: 0.35 }}>—</span>
      <span>{date}</span>
    </div>
  );
}
