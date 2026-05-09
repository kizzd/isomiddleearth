"use client";

import { useShallow } from "zustand/react/shallow";
import { Wheat, TreePine, Mountain, Coins, Users, Smile } from "lucide-react";
import { useGameStore } from "@/lib/game/store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const formatNumber = (value: number) =>
  Number.isInteger(value) ? value.toString() : value.toFixed(1);

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

  const dayProgress = (tick % 240) / 240;

  return (
    <TooltipProvider>
      <div className="pointer-events-auto absolute right-2 top-2 z-30 flex flex-col gap-1 rounded-md border bg-background/95 px-3 py-2 text-sm shadow-md backdrop-blur sm:right-4 sm:top-4">
        <div className="flex items-center justify-between gap-3 border-b pb-1 text-xs text-muted-foreground">
          <span>Dzień {day}</span>
          <span>{Math.round(dayProgress * 100)}%</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 tabular-nums">
                <Wheat className="h-4 w-4 text-amber-600" />
                {formatNumber(resources.food)}
                <span className="text-muted-foreground">/{caps.food}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent>Jedzenie</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 tabular-nums">
                <TreePine className="h-4 w-4 text-emerald-700" />
                {formatNumber(resources.wood)}
                <span className="text-muted-foreground">/{caps.wood}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent>Drewno</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 tabular-nums">
                <Mountain className="h-4 w-4 text-stone-500" />
                {formatNumber(resources.stone)}
                <span className="text-muted-foreground">/{caps.stone}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent>Kamień</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 tabular-nums">
                <Coins className="h-4 w-4 text-yellow-500" />
                {formatNumber(resources.gold)}
              </span>
            </TooltipTrigger>
            <TooltipContent>Złoto</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 tabular-nums">
                <Users className="h-4 w-4 text-sky-600" />
                {population}
                <span className="text-muted-foreground">/{housing}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent>Populacja / mieszkania</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 tabular-nums">
                <Smile className="h-4 w-4 text-pink-500" />
                {Math.round(mood)}%
              </span>
            </TooltipTrigger>
            <TooltipContent>Szczęście</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
