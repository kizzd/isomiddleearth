"use client";

import { useShallow } from "zustand/react/shallow";
import { Pause, Play, RotateCcw } from "lucide-react";
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
    <div className="flex items-center gap-1 sm:gap-1.5">
      <div
        role="tablist"
        aria-label="Tryb"
        className="inline-flex h-10 overflow-hidden rounded-md border bg-background"
      >
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={mode === m.id}
            onClick={() => setMode(m.id)}
            className={cn(
              "min-w-[60px] px-3 text-sm font-medium transition-colors",
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
          <button
            type="button"
            onClick={togglePause}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-background hover:bg-muted"
            aria-label={status === "running" ? "Pauza" : "Wznów"}
          >
            {status === "running" ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </button>

          <div className="inline-flex h-10 overflow-hidden rounded-md border bg-background">
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={cn(
                  "min-w-[36px] px-2 text-sm font-medium tabular-nums transition-colors",
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

          <button
            type="button"
            onClick={reset}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-background hover:bg-muted"
            aria-label="Reset gry"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </>
      ) : null}
    </div>
  );
}
