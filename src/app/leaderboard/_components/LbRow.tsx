import Link from "next/link";

const MEDAL = ["🥇", "🥈", "🥉"];

export function fmt(n: number): string {
  return n.toLocaleString("zh-TW");
}

export function LbRowItem({
  rank,
  userId,
  displayName,
  avatar,
  anonymous,
  value,
  unit,
  sub,
}: {
  rank: number;
  userId: string;
  displayName: string | null;
  avatar: string | null;
  anonymous?: boolean;
  value: string;
  unit?: string;
  sub?: string | null;
}) {
  const isTop3 = rank <= 3;
  const showName = anonymous ? "匿名玩家" : displayName ?? "未知玩家";

  const nameInner = (
    <>
      <span className="d-lb-name-display">{showName}</span>
      {sub && <span className="d-lb-name-sub">{sub}</span>}
    </>
  );

  return (
    <li className={"d-lb-row" + (isTop3 ? " d-lb-row-top" : "")}>
      <span className="d-lb-rank">
        {isTop3 ? MEDAL[rank - 1] : `#${rank}`}
      </span>
      {avatar && !anonymous ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatar}
          alt=""
          width={36}
          height={36}
          className="d-lb-avatar"
        />
      ) : (
        <div className="d-lb-avatar d-lb-avatar-fallback">
          {anonymous ? "🔒" : "?"}
        </div>
      )}
      {anonymous ? (
        <span className="d-lb-name d-lb-name-anon">{nameInner}</span>
      ) : (
        <Link href={`/u/${userId}`} className="d-lb-name">
          {nameInner}
        </Link>
      )}
      <span className="d-lb-value">
        <span className="d-lb-value-num">{value}</span>
        {unit && <span className="d-lb-value-unit">{unit}</span>}
      </span>
    </li>
  );
}
