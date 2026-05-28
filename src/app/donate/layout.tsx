import type { Metadata } from "next";
import "./donate.css";

export const metadata: Metadata = {
  title: "抖內 — 逼逼機器人",
  description: "贊助 SHUSHU 與逼逼機器人。",
};

export default function DonateLayout({ children }: { children: React.ReactNode }) {
  return <div className="donate-root dark">{children}</div>;
}
