import type { Metadata } from "next";
import "./dashboard.css";

export const metadata: Metadata = {
  title: "DashBoard — 逼逼機器人",
  description: "查看你在逼逼機器人的金幣、等級、挖礦、釣魚與贊助紀錄。",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="dash-root dark">{children}</div>;
}
