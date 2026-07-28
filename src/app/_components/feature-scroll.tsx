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
  | "level"
  | "dungeon"
  | "farm"
  | "guild"
  | "trade"
  | "theft"
  | "event"
  | "cook";

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
  {
    k: "dungeon", idx: "08", tag: "Game", name: "地城", en: "DUNGEON", href: "/docs/dungeon",
    blurb: "跟怪物拼血條的多輪戰鬥，礦坑暴君、冰晶女王等首領輪番上陣——全服合力打世界 BOSS，接上連段傷害直接 ×1.3。傳說之劍砍斷太多次？恭喜你，本週斷劍王，詛咒認命戴著。",
  },
  {
    k: "farm", idx: "09", tag: "Game", name: "農場", en: "FARMING", href: "/docs/farming",
    blurb: "半夜田鼠烏鴉會來洗劫你的作物，得提刀護院。撐過去才種得出傳說級黑玫瑰——限定種子從地城首領身上掉，收成還有機率挖到打造神器的素材。",
  },
  {
    k: "guild", idx: "10", tag: "Social", name: "公會", en: "GUILD", href: "/docs/guild",
    blurb: "一個人扛不住，全公會一起扛。捐料蓋熔爐、升訓練場，膳坊點滿還能開流水席——一鍵開席，全員同時吃 buff 衝副本。",
  },
  {
    k: "trade", idx: "11", tag: "Sim", name: "交易", en: "TRADING", href: "/docs/trading",
    blurb: "不只是擺攤賣東西。掛收購單讓別人分批賣你、開競標搶稀有礦、或直接以物易物換到你缺的貨——一整套訂單簿，價格公道還防坑人。",
  },
  {
    k: "theft", idx: "12", tag: "Game", name: "偷竊", en: "THEFT", href: "/docs/theft",
    blurb: "半夜摸進別人錢包順手牽羊，得手了神不知鬼不覺；失風就得靠鑽暗巷、飛簷走壁甩開追兵。被偷了別急，花錢請偵探抓人——只是偵探有時候自己就是內鬼。",
  },
  {
    k: "event", idx: "13", tag: "Core", name: "世界事件", en: "EVENTS", href: "/docs/world-events",
    blurb: "挖礦、釣魚、打副本都可能意外觸發全服任務，大家一起捐物資衝目標——達標全服直接吃 48 小時 buff，慢一步就錯過，手腳要快。",
  },
  {
    k: "cook", idx: "14", tag: "Game", name: "料理", en: "COOKING", href: "/docs/cooking",
    blurb: "魚跟菜煮成料理不會馬上見效，放進食物倉庫挑時機吃，新鮮度越高效果越強。拿煤炭下去炭烤還能升級加強版，吃剩放到過期也能變堆肥回田裡。",
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
  if (k === "dungeon")
    return (
      <div className="pv">
        <span className="pv-label">世界 BOSS</span>
        <div className="pv-lv" style={{ marginTop: 26 }}>
          <span className="badge">討伐</span>
          <div className="bar">
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)", marginBottom: 8 }}>連段加成 ×1.3</div>
            <div className="pv-bar"><i /></div>
          </div>
        </div>
        <div style={{ marginTop: 12, fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-4)" }}>本週斷劍王：詛咒纏身中</div>
      </div>
    );
  if (k === "farm")
    return (
      <div className="pv">
        <span className="pv-label">🌹黑玫瑰 · 24H</span>
        <div style={{ marginTop: 30, fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-3)" }}>生長進度</div>
        <div className="pv-bar" style={{ marginTop: 10 }}><i /></div>
        <div style={{ marginTop: 12, fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-4)" }}>⚠ 田鼠來襲，警戒中</div>
      </div>
    );
  if (k === "guild")
    return (
      <div className="pv">
        <span className="pv-label">公會會館 Lv.5</span>
        <div className="pv-coins" style={{ marginTop: 24 }}>
          <div className="pv-stack"><i /><i /><i /></div>
          <div className="pv-amount">流水席 <em>開席中</em></div>
        </div>
        <div style={{ marginTop: 14, fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-4)" }}>全員 +25% 副本傷害・120 分鐘</div>
      </div>
    );
  if (k === "trade")
    return (
      <div className="pv">
        <span className="pv-label">ORDER BOOK</span>
        <div className="pv-line">
          <svg viewBox="0 0 240 70" preserveAspectRatio="none">
            <path className="area" d="M0,60 L34,50 L68,54 L102,30 L136,38 L170,18 L204,26 L240,10 L240,70 L0,70 Z" />
            <path className="stroke" d="M0,60 L34,50 L68,54 L102,30 L136,38 L170,18 L204,26 L240,10" />
            <circle className="dot" cx="240" cy="10" r="3.5" />
          </svg>
        </div>
      </div>
    );
  if (k === "theft")
    return (
      <div className="pv">
        <span className="pv-label">夜間行動</span>
        <div className="pv-chips" style={{ marginTop: 26 }}>
          <span className="pv-chip">🌆</span>
          <span className="pv-chip win">🌫️</span>
          <span className="pv-chip" style={{ background: "transparent", borderStyle: "dashed", color: "var(--ink-4)" }}>?</span>
        </div>
        <div style={{ marginTop: 12, fontFamily: "var(--mono)", fontSize: 13, color: "var(--ink)" }}>逃脫成功・神不知鬼不覺</div>
      </div>
    );
  if (k === "event")
    return (
      <div className="pv">
        <span className="pv-label">⛏ 礦災修復</span>
        <div style={{ marginTop: 30, fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-3)" }}>全服捐獻進度</div>
        <div className="pv-bar" style={{ marginTop: 10 }}><i /></div>
        <div style={{ marginTop: 12, fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-4)" }}>達標全服 +buff・48 小時</div>
      </div>
    );
  if (k === "cook")
    return (
      <div className="pv">
        <span className="pv-label">🥡 食物倉庫</span>
        <div style={{ marginTop: 30, fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-3)" }}>新鮮度</div>
        <div className="pv-bar" style={{ marginTop: 10 }}><i /></div>
        <div style={{ marginTop: 12, fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-4)" }}>炭烤加持・保鮮 +50%</div>
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
                <span className="feat-idx">{f.idx} / 14</span>
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
