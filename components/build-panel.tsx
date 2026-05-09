"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useShallow } from "zustand/react/shallow";
import { Hammer, X, Trash2, Pause, Play, Eraser } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/lib/game/store";
import { useMapStore } from "@/lib/store";
import { BUILDING_LIST, BuildingKind } from "@/lib/game/buildings";
import { MIXED_TEXTURE_PLACE_ID, TEXTURE_PLACES } from "@/lib/textures";
import type { ResourceBag, ResourceId } from "@/lib/game/types";

const RESOURCE_GLYPH: Record<ResourceId, string> = {
  food: "🌾",
  wood: "🌲",
  gold: "🪙",
};

const formatCost = (cost: Partial<ResourceBag>) =>
  (Object.entries(cost) as [ResourceId, number][])
    .map(([id, amount]) => `${RESOURCE_GLYPH[id]}${amount}`)
    .join(" ");

const formatProduction = (
  production: Partial<Record<ResourceId, number>> | undefined,
) =>
  production
    ? (Object.entries(production) as [ResourceId, number][])
        .map(([id, amount]) => `${RESOURCE_GLYPH[id]}+${amount.toFixed(2)}`)
        .join(" ")
    : null;

export default function BuildPanel() {
  const {
    mode,
    status,
    placementMode,
    resources,
    setPlacementMode,
    togglePause,
    reset,
  } = useGameStore(
    useShallow((s) => ({
      mode: s.mode,
      status: s.status,
      placementMode: s.placementMode,
      resources: s.resources,
      setPlacementMode: s.setPlacementMode,
      togglePause: s.togglePause,
      reset: s.reset,
    })),
  );

  const { location, initMap } = useMapStore(
    useShallow((s) => ({
      location: s.location,
      initMap: s.initMap,
    })),
  );

  const handleResetBoard = () => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "Wyczyścić planszę do samej trawy? Edytor i wszystkie budynki gry zostaną zresetowane.",
      )
    ) {
      return;
    }
    initMap();
    reset();
    setPlacementMode(null);
  };

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

  const previewRealm =
    location === MIXED_TEXTURE_PLACE_ID ? TEXTURE_PLACES[0].id : location;

  const canAfford = (cost: Partial<ResourceBag>) =>
    (Object.keys(cost) as ResourceId[]).every(
      (id) => resources[id] >= (cost[id] ?? 0),
    );

  const toggle = (kind: BuildingKind | "demolish") => {
    setPlacementMode(placementMode === kind ? null : kind);
  };

  const placingDef =
    placementMode && placementMode !== "demolish"
      ? BUILDING_LIST.find((b) => b.kind === placementMode)
      : null;

  const placingLabel = placementMode
    ? placementMode === "demolish"
      ? "Tryb wyburzania"
      : `Stawianie: ${placingDef?.label ?? ""}`
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
          const affordable = canAfford(def.cost);
          const active = placementMode === def.kind;
          const previewSrc = `/tiles/${previewRealm}/r${def.tileRow}-c${def.tileCol}.png`;
          return (
            <button
              key={def.kind}
              type="button"
              onClick={() => toggle(def.kind)}
              disabled={!affordable && !active}
              className={cn(
                "flex shrink-0 min-w-[96px] flex-col items-center justify-between gap-0.5 rounded-md border px-2 py-1 text-xs transition-colors",
                active
                  ? "border-primary bg-primary/10 ring-2 ring-primary"
                  : affordable
                    ? "bg-background hover:bg-muted"
                    : "cursor-not-allowed bg-muted/50 opacity-60",
              )}
              aria-pressed={active}
              aria-label={`${def.label}, koszt ${formatCost(def.cost)}`}
              title={def.description}
            >
              <div className="relative h-10 w-12">
                <Image
                  src={previewSrc}
                  alt=""
                  fill
                  sizes="48px"
                  className="object-contain"
                  unoptimized
                />
              </div>
              <span className="text-xs font-semibold leading-tight">
                {def.label}
              </span>
              <span className="text-[10px] tabular-nums leading-tight text-muted-foreground">
                {formatCost(def.cost)}
              </span>
              {def.production || def.housing || def.foodMultiplier ? (
                <span className="text-[10px] tabular-nums leading-tight text-emerald-700">
                  {def.housing ? `+${def.housing} 🏠 ` : null}
                  {formatProduction(def.production) ?? ""}
                  {def.foodMultiplier ? `×${def.foodMultiplier} 🌾` : null}
                </span>
              ) : null}
            </button>
          );
        })}

        <button
          type="button"
          onClick={handleResetBoard}
          className="flex shrink-0 min-w-[88px] flex-col items-center justify-between gap-0.5 rounded-md border border-dashed bg-background px-2 py-1.5 text-xs hover:bg-muted"
          aria-label="Zresetuj planszę do trawy (debug)"
          title="Wyczyść planszę i zresetuj grę"
        >
          <Eraser className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs font-semibold leading-tight">Wyczyść</span>
          <span className="text-[10px] leading-tight text-muted-foreground">
            do trawy
          </span>
        </button>

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
