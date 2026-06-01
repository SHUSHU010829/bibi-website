import type { Metadata } from "next";
import "../donate/donate.css";
import "./dashboard.css";

export const metadata: Metadata = {
  title: "儀表板 — 逼逼機器人",
  description: "查看你在逼逼機器人的金幣、等級、挖礦與贊助紀錄。",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="donate-root dark">{children}</div>;
}
