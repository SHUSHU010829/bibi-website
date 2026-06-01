const MEDAL = ["🥇", "🥈", "🥉"];

export function fmt(n: number): string {
  return n.toLocaleString("zh-TW");
}

export function LbRowItem({
  rank,
  displayName,
  avatar,
  value,
  unit,
  sub,
}: {
  rank: number;
  displayName: string | null;
  avatar: string | null;
  value: string;
  unit?: string;
  sub?: string | null;
}) {
  const isTop3 = rank <= 3;
  return (
    <li className={"d-lb-row" + (isTop3 ? " d-lb-row-top" : "")}>
      <span className="d-lb-rank">
        {isTop3 ? MEDAL[rank - 1] : `#${rank}`}
      </span>
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatar}
          alt=""
          width={36}
          height={36}
          className="d-lb-avatar"
        />
      ) : (
        <div className="d-lb-avatar d-lb-avatar-fallback">?</div>
      )}
      <span className="d-lb-name">
        <span className="d-lb-name-display">{displayName ?? "未知玩家"}</span>
        {sub && <span className="d-lb-name-sub">{sub}</span>}
      </span>
      <span className="d-lb-value">
        <span className="d-lb-value-num">{value}</span>
        {unit && <span className="d-lb-value-unit">{unit}</span>}
      </span>
    </li>
  );
}
