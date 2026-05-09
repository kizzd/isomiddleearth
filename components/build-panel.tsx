"use client";

import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { Hammer, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGameStore } from "@/lib/game/store";
import { BUILDING_LIST, BuildingKind } from "@/lib/game/buildings";
import type { ResourceBag, ResourceId } from "@/lib/game/types";

const RESOURCE_LABEL: Record<ResourceId, string> = {
  food: "j",
  wood: "d",
  stone: "k",
  gold: "z",
};

const formatCost = (cost: Partial<ResourceBag>) =>
  (Object.entries(cost) as [ResourceId, number][])
    .map(([id, amount]) => `${amount}${RESOURCE_LABEL[id]}`)
    .join(" ");

export default function BuildPanel() {
  const {
    mode,
    placementMode,
    resources,
    setPlacementMode,
  } = useGameStore(
    useShallow((s) => ({
      mode: s.mode,
      placementMode: s.placementMode,
      resources: s.resources,
      setPlacementMode: s.setPlacementMode,
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

  const toggle = (kind: BuildingKind) => {
    setPlacementMode(placementMode === kind ? null : kind);
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 rounded-md border bg-background px-1 py-0.5">
        <Hammer className="h-4 w-4 text-muted-foreground ml-1" />
        {BUILDING_LIST.map((def) => {
          const affordable = canAfford(def.cost);
          const active = placementMode === def.kind;
          return (
            <Tooltip key={def.kind}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => toggle(def.kind)}
                  disabled={!affordable && !active}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded text-xs font-bold transition-colors",
                    active
                      ? "bg-primary text-primary-foreground ring-2 ring-primary"
                      : affordable
                        ? "bg-muted hover:bg-muted/70"
                        : "bg-muted/40 text-muted-foreground cursor-not-allowed",
                  )}
                  style={
                    active
                      ? undefined
                      : { color: affordable ? def.color : undefined }
                  }
                  aria-pressed={active}
                  aria-label={`Postaw ${def.label}`}
                >
                  {def.short}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <div className="font-medium">{def.label}</div>
                  <div className="text-muted-foreground">
                    Koszt: {formatCost(def.cost)}
                  </div>
                  {def.housing ? (
                    <div className="text-muted-foreground">
                      Mieszkania: +{def.housing}
                    </div>
                  ) : null}
                  {def.production ? (
                    <div className="text-muted-foreground">
                      Produkcja: {formatCost(def.production)}/tick
                    </div>
                  ) : null}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
        {placementMode ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setPlacementMode(null)}
                aria-label="Anuluj stawianie"
              >
                <X className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Anuluj (Esc)</TooltipContent>
          </Tooltip>
        ) : null}
      </div>
    </TooltipProvider>
  );
}
