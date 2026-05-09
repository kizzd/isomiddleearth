"use client";

import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  Hammer,
  Home,
  Wheat,
  Trees,
  Mountain,
  X,
  Trash2,
  Pause,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/lib/game/store";
import { BUILDING_LIST, BuildingKind } from "@/lib/game/buildings";
import type { ResourceBag, ResourceId } from "@/lib/game/types";

const RESOURCE_ICON_TEXT: Record<ResourceId, string> = {
  food: "🌾",
  wood: "🌲",
  stone: "🪨",
  gold: "🪙",
};

const BUILDING_ICON: Record<
  BuildingKind,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  house: Home,
  farm: Wheat,
  lumberjack: Trees,
  quarry: Mountain,
};

const formatCost = (cost: Partial<ResourceBag>) =>
  (Object.entries(cost) as [ResourceId, number][])
    .map(([id, amount]) => `${RESOURCE_ICON_TEXT[id]}${amount}`)
    .join(" ");

export default function BuildPanel() {
  const {
    mode,
    status,
    placementMode,
    resources,
    setPlacementMode,
    togglePause,
  } = useGameStore(
    useShallow((s) => ({
      mode: s.mode,
      status: s.status,
      placementMode: s.placementMode,
      resources: s.resources,
      setPlacementMode: s.setPlacementMode,
      togglePause: s.togglePause,
    })),
  );

  useEffect(() => {
    if (mode !== "play") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && placementMode) {
        setPlacementMode(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, placementMode, setPlacementMode]);

  if (mode !== "play") return null;

  const canAfford = (cost: Partial<ResourceBag>) =>
    (Object.keys(cost) as ResourceId[]).every(
      (id) => resources[id] >= (cost[id] ?? 0),
    );

  const toggle = (kind: BuildingKind | "demolish") => {
    setPlacementMode(placementMode === kind ? null : kind);
  };

  const placingLabel = placementMode
    ? placementMode === "demolish"
      ? "Tryb wyburzania"
      : `Stawianie: ${BUILDING_LIST.find((b) => b.kind === placementMode)?.label ?? ""}`
    : null;

  return (
    <div
      className="shrink-0 border-t bg-background/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {placingLabel ? (
        <div className="flex items-center justify-between gap-2 border-b bg-primary/10 px-3 py-1.5 text-xs sm:text-sm">
          <span className="flex items-center gap-1.5 font-medium">
            <Hammer className="h-3.5 w-3.5" />
            {placingLabel}
          </span>
          <button
            type="button"
            onClick={() => setPlacementMode(null)}
            className="flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium text-muted-foreground hover:bg-background"
            aria-label="Anuluj"
          >
            <X className="h-3.5 w-3.5" />
            Anuluj
          </button>
        </div>
      ) : null}

      <div className="flex items-stretch gap-1.5 overflow-x-auto px-2 py-2 sm:gap-2 sm:px-3">
        <button
          type="button"
          onClick={togglePause}
          className="flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
          aria-label={status === "running" ? "Pauza" : "Wznów"}
        >
          {status === "running" ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {status === "running" ? "Pauza" : "Wznów"}
          </span>
        </button>

        {BUILDING_LIST.map((def) => {
          const Icon = BUILDING_ICON[def.kind];
          const affordable = canAfford(def.cost);
          const active = placementMode === def.kind;
          return (
            <button
              key={def.kind}
              type="button"
              onClick={() => toggle(def.kind)}
              disabled={!affordable && !active}
              className={cn(
                "flex shrink-0 min-w-[88px] flex-col items-center justify-between gap-0.5 rounded-md border px-2 py-1.5 text-xs transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary"
                  : affordable
                    ? "bg-background hover:bg-muted"
                    : "cursor-not-allowed bg-muted/50 text-muted-foreground opacity-60",
              )}
              aria-pressed={active}
              aria-label={`${def.label}, koszt ${formatCost(def.cost)}`}
            >
              <Icon
                className="h-5 w-5"
                style={!active ? { color: def.color } : undefined}
              />
              <span className="text-xs font-semibold leading-tight">
                {def.label}
              </span>
              <span
                className={cn(
                  "text-[10px] tabular-nums leading-tight",
                  active ? "text-primary-foreground/90" : "text-muted-foreground",
                )}
              >
                {formatCost(def.cost)}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => toggle("demolish")}
          className={cn(
            "flex shrink-0 min-w-[88px] flex-col items-center justify-between gap-0.5 rounded-md border px-2 py-1.5 text-xs transition-colors",
            placementMode === "demolish"
              ? "border-rose-600 bg-rose-600 text-white ring-2 ring-rose-600"
              : "bg-background hover:bg-muted",
          )}
          aria-pressed={placementMode === "demolish"}
          aria-label="Tryb wyburzania"
        >
          <Trash2
            className={cn(
              "h-5 w-5",
              placementMode === "demolish" ? "text-white" : "text-rose-600",
            )}
          />
          <span className="text-xs font-semibold leading-tight">Wyburz</span>
          <span
            className={cn(
              "text-[10px] leading-tight",
              placementMode === "demolish"
                ? "text-white/80"
                : "text-muted-foreground",
            )}
          >
            zwrot 0%
          </span>
        </button>
      </div>
    </div>
  );
}
