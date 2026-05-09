"use client";

import { useShallow } from "zustand/react/shallow";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/lib/game/store";
import type { GameMode, GameSpeed } from "@/lib/game/types";

const MODES: { id: GameMode; label: string }[] = [
  { id: "editor", label: "Edytor" },
  { id: "play", label: "Gra" },
];

const SPEEDS: GameSpeed[] = [1, 2, 4];

export default function GameModeSwitch() {
  const { mode, status, speed, setMode, setSpeed, togglePause, reset } =
    useGameStore(
      useShallow((s) => ({
        mode: s.mode,
        status: s.status,
        speed: s.speed,
        setMode: s.setMode,
        setSpeed: s.setSpeed,
        togglePause: s.togglePause,
        reset: s.reset,
      })),
    );

  const isPlaying = mode === "play";

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <div
          role="tablist"
          aria-label="Tryb"
          className="inline-flex overflow-hidden rounded-md border bg-background"
        >
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={mode === m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                "px-3 py-1 text-xs font-medium transition-colors sm:text-sm",
                mode === m.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        {isPlaying ? (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={togglePause}
                  aria-label={status === "running" ? "Pauza" : "Wznów"}
                >
                  {status === "running" ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {status === "running" ? "Pauza" : "Wznów"}
              </TooltipContent>
            </Tooltip>

            <div className="inline-flex overflow-hidden rounded-md border bg-background">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpeed(s)}
                  className={cn(
                    "px-2 py-1 text-xs font-medium tabular-nums transition-colors",
                    speed === s
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                  aria-pressed={speed === s}
                  aria-label={`Prędkość ${s}x`}
                >
                  {s}×
                </button>
              ))}
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={reset}
                  aria-label="Reset gry"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset gry</TooltipContent>
            </Tooltip>
          </>
        ) : null}
      </div>
    </TooltipProvider>
  );
}
