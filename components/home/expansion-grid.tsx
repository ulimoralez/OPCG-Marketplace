"use client";

import Link from "next/link";
import { useState } from "react";

const CATEGORIES = [
  {
    label: "Booster Packs",
    sets: [
      { code: "OP01", name: "Romance Dawn" },
      { code: "OP02", name: "Paramount War" },
      { code: "OP03", name: "Pillars of Strength" },
      { code: "OP04", name: "Kingdoms of Intrigue" },
      { code: "OP05", name: "Awakening of the New Era" },
      { code: "OP06", name: "Wings of the Captain" },
      { code: "OP07", name: "500 Years in the Future" },
      { code: "OP08", name: "Two Legends" },
      { code: "OP09", name: "Emperors in the New World" },
      { code: "OP10", name: "Royal Blood" },
      { code: "OP11", name: "A Fist of Divine Speed" },
      { code: "OP12", name: "Legacy of the Master" },
      { code: "OP13", name: "Carrying on His Will" },
      { code: "OP14", name: "The Azure Sea's Seven" },
      { code: "OP15", name: "Adventure on Kami's Island" },
    ],
  },
  {
    label: "Extra Boosters",
    sets: [
      { code: "EB01", name: "Memorial Collection" },
      { code: "EB02", name: "Anime 25th Collection" },
      { code: "EB03", name: "Heroines Edition" },
      { code: "EB04", name: "Egghead Crisis" },
    ],
  },
  {
    label: "Starter Decks",
    sets: [
      { code: "ST01", name: "Straw Hat Crew" },
      { code: "ST02", name: "Worst Generation" },
      { code: "ST03", name: "Seven Warlords of the Sea" },
      { code: "ST04", name: "Animal Kingdom Pirates" },
      { code: "ST05", name: "Film Edition" },
      { code: "ST06", name: "Absolute Justice" },
      { code: "ST07", name: "Big Mom Pirates" },
      { code: "ST08", name: "Monkey D. Luffy" },
      { code: "ST09", name: "Yamato" },
      { code: "ST10", name: "The Three Captains" },
      { code: "ST11", name: "Uta" },
      { code: "ST12", name: "Zoro & Sanji" },
      { code: "ST13", name: "The Three Brothers" },
      { code: "ST14", name: "3D2Y" },
      { code: "ST15", name: "Red — Edward Newgate" },
      { code: "ST16", name: "Green — Uta" },
      { code: "ST17", name: "Blue — Doflamingo" },
      { code: "ST18", name: "Purple — Monkey D. Luffy" },
      { code: "ST19", name: "Black — Smoker" },
      { code: "ST20", name: "Yellow — Katakuri" },
      { code: "ST21", name: "EX Gear 5" },
    ],
  },
];

export function ExpansionGrid() {
  const [active, setActive] = useState(0);
  const category = CATEGORIES[active];

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {CATEGORIES.map((cat, i) => (
          <button
            key={cat.label}
            onClick={() => setActive(i)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              active === i
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Set cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {category.sets.map((set) => (
          <Link
            key={set.code}
            href={`/search?set=${set.code}`}
            className="group flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border bg-card hover:border-primary hover:bg-primary/5 transition-all text-center"
          >
            <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
              {set.code}
            </span>
            <span className="text-xs text-muted-foreground group-hover:text-foreground leading-tight transition-colors line-clamp-2">
              {set.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
