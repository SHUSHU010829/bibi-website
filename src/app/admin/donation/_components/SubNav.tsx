import Link from "next/link";

const SUB_TABS = [
  { id: "records", label: "紀錄", href: "/admin/donation" },
  { id: "unmatched", label: "未對應", href: "/admin/donation/unmatched" },
  { id: "patrons", label: "贊助者", href: "/admin/donation/patrons" },
  { id: "stats", label: "統計", href: "/admin/donation/stats" },
] as const;

export type DonationTab = (typeof SUB_TABS)[number]["id"];

export function DonationHead({ active }: { active: DonationTab }) {
  return (
    <header className="d-page-head">
      <div className="d-page-head-left">
        <div className="d-tabs">
          {SUB_TABS.map((t) => (
            <Link
              key={t.id}
              href={t.href}
              className={"d-tab" + (active === t.id ? " active" : "")}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
