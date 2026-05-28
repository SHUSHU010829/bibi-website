import Link from "next/link";

const LINKS = [
  { label: "文件", href: "/docs" },
  { label: "抖內", href: "/donate" },
  { label: "儀表板", href: "/dashboard" },
];

export default function DonateNav({ active }: { active?: string }) {
  return (
    <nav className="donate-nav">
      <Link href="/" className="donate-nav-brand">
        BB
      </Link>
      {LINKS.map((l) => (
        <Link
          key={l.label}
          href={l.href}
          className={active === l.href ? "active" : undefined}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
