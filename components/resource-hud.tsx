"use client";

import { useShallow } from "zustand/react/shallow";
import {
  Wheat,
  TreePine,
  Coins,
  Users,
  Smile,
  Target,
  CalendarDays,
} from "lucide-react";
import { useGameStore } from "@/lib/game/store";
import { TICKS_PER_DAY, VICTORY_POPULATION } from "@/lib/game/types";

const formatNumber = (value: number) =>
  Number.isInteger(value) ? value.toString() : value.toFixed(1);

interface ResourceCellProps {
  icon: React.ReactNode;
  value: string;
  cap?: string;
  label: string;
  tone?: "default" | "warn";
}

function ResourceCell({
  icon,
  value,
  cap,
  label,
  tone = "default",
}: ResourceCellProps) {
  return (
    <div
      className={`flex min-w-0 flex-col items-center justify-center rounded-md border px-2 py-1 ${
        tone === "warn"
          ? "border-rose-300 bg-rose-50 dark:bg-rose-950/30"
          : "bg-background"
      }`}
      aria-label={label}
    >
      <div className="flex items-center gap-1 text-base font-semibold leading-tight tabular-nums">
        {icon}
        <span>{value}</span>
        {cap ? (
          <span className="text-xs font-normal text-muted-foreground">
            /{cap}
          </span>
        ) : null}
      </div>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export default function ResourceHUD() {
  const { mode, day, tick, resources, caps, population, housing, mood } =
    useGameStore(
      useShallow((s) => ({
        mode: s.mode,
        day: s.day,
        tick: s.tick,
        resources: s.resources,
        caps: s.caps,
        population: s.population,
        housing: s.housing,
        mood: s.mood,
      })),
    );

  if (mode !== "play") return null;

  const dayProgress = (tick % TICKS_PER_DAY) / TICKS_PER_DAY;
  const goalProgress = Math.min(1, population / VICTORY_POPULATION);
  const overcrowded = population > housing;
  const starving = resources.food < 5;

  return (
    <div className="border-b bg-background/95 px-2 py-2 backdrop-blur sm:px-4">
      <div className="mb-2 flex items-center gap-2">
        <Target className="h-4 w-4 shrink-0 text-primary" />
        <div className="flex-1">
          <div className="flex items-baseline justify-between gap-2 text-xs sm:text-sm">
            <span className="font-medium">
              <span className="hidden sm:inline">Party at Bag End: </span>
              <span className="sm:hidden">Cel: </span>
              <span className="tabular-nums">
                {population} / {VICTORY_POPULATION}
              </span>
              <span className="hidden text-muted-foreground sm:inline">
                {" "}
                hobbitów
              </span>
            </span>
            <span className="flex items-center gap-1 text-muted-foreground tabular-nums">
              <CalendarDays className="h-3.5 w-3.5" />
              Dzień {day}
              <span className="hidden sm:inline">
                · {Math.round(dayProgress * 100)}%
              </span>
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${goalProgress * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
        <ResourceCell
          icon={<Wheat className="h-4 w-4 text-amber-600" />}
          value={formatNumber(resources.food)}
          cap={String(caps.food)}
          label="Jedzenie"
          tone={starving ? "warn" : "default"}
        />
        <ResourceCell
          icon={<TreePine className="h-4 w-4 text-emerald-700" />}
          value={formatNumber(resources.wood)}
          cap={String(caps.wood)}
          label="Drewno"
        />
        <ResourceCell
          icon={<Coins className="h-4 w-4 text-yellow-500" />}
          value={formatNumber(resources.gold)}
          label="Złoto"
        />
        <ResourceCell
          icon={<Users className="h-4 w-4 text-sky-600" />}
          value={String(population)}
          cap={String(housing)}
          label="Hobbici"
          tone={overcrowded ? "warn" : "default"}
        />
        <ResourceCell
          icon={<Smile className="h-4 w-4 text-pink-500" />}
          value={`${Math.round(mood)}%`}
          label="Mood"
          tone={mood < 30 ? "warn" : "default"}
        />
      </div>
    </div>
  );
}
