"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

type FeatureKey =
  | "mine"
  | "fish"
  | "casino"
  | "lotto"
  | "stock"
  | "econ"
  | "level";

type Feature = {
  k: FeatureKey;
  idx: string;
  tag: string;
  name: string;
  en: string;
  blurb: string;
  href: string;
};

const FEATURES: Feature[] = [
  {
    k: "mine", idx: "01", tag: "Game", name: "挖礦", en: "MINING", href: "/docs/mining",
    blurb: "敲下去就對了。升級你的鎬、賭一把區段風險、把運氣加成疊好疊滿——下一鏟，說不定就是傳說礦。",
  },
  {
    k: "fish", idx: "02", tag: "Game", name: "釣魚", en: "FISHING", href: "/docs/fishing",
    blurb: "甩竿、等浮標、收線——靜靜等的不只是魚，還有熔岩魚、章魚、鯊魚那種會讓你尖叫的稀客。",
  },
  {
    k: "casino", idx: "03", tag: "Game", name: "賭場", en: "CASINO", href: "/docs/casino",
    blurb: "21 點、輪盤、骰寶、老虎機全都有。莊家總是贏？那就來當那個例外（祝你好運）。",
  },
  {
    k: "lotto", idx: "04", tag: "Game", name: "樂透", en: "LOTTERY", href: "/docs/lottery",
    blurb: "每日開獎，彩金一直往上疊。今天的歐皇，會不會剛好戴著你的名字？",
  },
  {
    k: "stock", idx: "05", tag: "Sim", name: "股市", en: "STOCK", href: "/docs/stocks",
    blurb: "模擬持股、追走勢、接財報事件。零風險體驗一夜翻身，也順便體驗一下住套房。",
  },
  {
    k: "econ", idx: "06", tag: "Core", name: "經濟", en: "ECONOMY", href: "/docs/economy",
    blurb: "金幣、商店、交易、每日簽到——一條龍，把你的肝平滑地變現成購買力。",
  },
  {
    k: "level", idx: "07", tag: "Social", name: "等級", en: "LEVELS", href: "/docs/leveling",
    blurb: "多嘴就有獎勵。聊天升級、解鎖稱號、季賽搶排名——安靜的人，這裡吃虧。",
  },
];

function Preview({ k }: { k: FeatureKey }) {
  if (k === "mine")
    return (
      <div className="pv">
        <span className="pv-label">DEPTH 1,204m</span>
        <div style={{ marginTop: 30, fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-3)" }}>礦脈進度</div>
        <div className="pv-bar" style={{ marginTop: 10 }}><i /></div>
        <div style={{ marginTop: 12, fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-4)" }}>運氣加成 ×1.8　·　鎬 Lv.7</div>
      </div>
    );
  if (k === "fish")
    return (
      <div className="pv pv-fish">
        <span className="pv-label">CAST · 18m</span>
        <svg className="pv-fish-svg" viewBox="0 0 240 88" preserveAspectRatio="none" aria-hidden>
          <path className="wave wave-1" d="M0,40 Q30,32 60,40 T120,40 T180,40 T240,40 V88 H0 Z" />
          <path className="wave wave-2" d="M0,52 Q30,46 60,52 T120,52 T180,52 T240,52 V88 H0 Z" />
          <line className="line" x1="40" y1="6" x2="120" y2="44" />
          <circle className="float" cx="120" cy="44" r="4" />
          <g className="fishy">
            <path d="M0,0 Q8,-6 18,0 Q8,6 0,0 Z M-4,0 L0,-3 L0,3 Z" />
          </g>
        </svg>
        <div style={{ position: "absolute", left: 14, bottom: 12, fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-4)" }}>
          竹釣竿　·　魚袋 12 / 30
        </div>
      </div>
    );
  if (k === "casino")
    return (
      <div className="pv">
        <span className="pv-label">BLACKJACK</span>
        <div className="pv-chips" style={{ marginTop: 26 }}>
          <span className="pv-chip">A♠</span>
          <span className="pv-chip win">K♥</span>
          <span className="pv-chip" style={{ background: "transparent", borderStyle: "dashed", color: "var(--ink-4)" }}>?</span>
        </div>
        <div style={{ marginTop: 12, fontFamily: "var(--mono)", fontSize: 13, color: "var(--ink)" }}>21 · BLACKJACK</div>
      </div>
    );
  if (k === "lotto")
    return (
      <div className="pv">
        <span className="pv-label">DRAW #318</span>
        <div className="pv-balls" style={{ marginTop: 26 }}>
          <span className="pv-ball">07</span>
          <span className="pv-ball hot">23</span>
          <span className="pv-ball">41</span>
        </div>
        <div style={{ marginTop: 12, fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-3)" }}>彩金池 <span style={{ color: "var(--accent)" }}>842,500</span></div>
      </div>
    );
  if (k === "stock")
    return (
      <div className="pv">
        <span className="pv-label">$SHUSHU ▲</span>
        <div className="pv-line">
          <svg viewBox="0 0 240 70" preserveAspectRatio="none">
            <path className="area" d="M0,54 L34,48 L68,52 L102,34 L136,40 L170,22 L204,28 L240,8 L240,70 L0,70 Z" />
            <path className="stroke" d="M0,54 L34,48 L68,52 L102,34 L136,40 L170,22 L204,28 L240,8" />
            <circle className="dot" cx="240" cy="8" r="3.5" />
          </svg>
        </div>
      </div>
    );
  if (k === "econ")
    return (
      <div className="pv">
        <span className="pv-label">WALLET</span>
        <div className="pv-coins" style={{ marginTop: 24 }}>
          <div className="pv-stack"><i /><i /><i /></div>
          <div className="pv-amount">12,480 <em>金幣</em></div>
        </div>
        <div style={{ marginTop: 14, fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-4)" }}>每日簽到 +250　·　連續 47 天</div>
      </div>
    );
  if (k === "level")
    return (
      <div className="pv">
        <span className="pv-label">SEASON 4</span>
        <div className="pv-lv" style={{ marginTop: 24 }}>
          <span className="badge">LV<br />28</span>
          <div className="bar">
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)", marginBottom: 8 }}>距離下一級 720 XP</div>
            <div className="pv-bar"><i /></div>
          </div>
        </div>
        <div style={{ marginTop: 12, fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-4)" }}>稱號：嘴最碎的礦工</div>
      </div>
    );
  return null;
}

export default function FeatureScroll() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let down = false;
    let startX = 0;
    let startScroll = 0;
    let moved = false;
    const onDown = (e: PointerEvent) => {
      down = true;
      moved = false;
      startX = e.pageX;
      startScroll = el.scrollLeft;
      el.classList.add("dragging");
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.pageX - startX;
      if (Math.abs(dx) > 4) moved = true;
      el.scrollLeft = startScroll - dx;
    };
    const onUp = () => {
      down = false;
      el.classList.remove("dragging");
    };
    const onClick = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("click", onClick, true);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      el.removeEventListener("click", onClick, true);
    };
  }, []);

  return (
    <section className="features" id="features">
      <div className="wrap">
        <div className="sec-head reveal">
          <h2>能玩的，<em>真的不少</em></h2>
          <span className="hint"><span className="arrows">←→</span> 拖一下，往右逛</span>
        </div>
      </div>
      <div className="wrap" style={{ maxWidth: "var(--maxw)" }}>
        <div className="feat-scroll" ref={ref}>
          {FEATURES.map((f) => (
            <Link className="feat" key={f.k} data-key={f.k} href={f.href}>
              <div className="feat-top">
                <span className="feat-idx">{f.idx} / 07</span>
                <span className="feat-tag">{f.tag}</span>
              </div>
              <h3 className="feat-name">{f.name}<span className="en">{f.en}</span></h3>
              <p className="feat-blurb">{f.blurb}</p>
              <Preview k={f.k} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
