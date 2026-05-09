"use client";

import { useShallow } from "zustand/react/shallow";
import { Trophy, Skull, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ResourceHUD from "@/components/resource-hud";
import { useGameTick } from "@/lib/game/use-game-tick";
import { useGameStore } from "@/lib/game/store";
import { VICTORY_POPULATION } from "@/lib/game/types";

function ObjectiveBanner() {
  const { mode, day, population } = useGameStore(
    useShallow((s) => ({
      mode: s.mode,
      day: s.day,
      population: s.population,
    })),
  );

  if (mode !== "play") return null;

  const remaining = Math.max(0, VICTORY_POPULATION - population);
  const progress = Math.min(1, population / VICTORY_POPULATION);

  return (
    <div className="pointer-events-none absolute left-1/2 top-2 z-30 flex -translate-x-1/2 flex-col items-center gap-1 sm:top-4">
      <div className="flex items-center gap-2 rounded-md border bg-background/95 px-3 py-1.5 text-xs shadow-md backdrop-blur sm:text-sm">
        <Target className="h-4 w-4 text-primary" />
        <span className="font-medium">Cel:</span>
        <span className="tabular-nums">
          {population} / {VICTORY_POPULATION} mieszkańców
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground tabular-nums">
          Dzień {day}
        </span>
      </div>
      <div className="h-1 w-48 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      {remaining > 0 ? null : (
        <span className="text-xs font-medium text-emerald-600">
          Cel osiągnięty!
        </span>
      )}
    </div>
  );
}

function GameOverModal() {
  const { mode, status, day, population, reset } = useGameStore(
    useShallow((s) => ({
      mode: s.mode,
      status: s.status,
      day: s.day,
      population: s.population,
      reset: s.reset,
    })),
  );

  const isOver = mode === "play" && (status === "victory" || status === "gameOver");
  const isVictory = status === "victory";

  return (
    <Dialog open={isOver}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isVictory ? (
              <>
                <Trophy className="h-5 w-5 text-amber-500" />
                Wygrana!
              </>
            ) : (
              <>
                <Skull className="h-5 w-5 text-rose-600" />
                Koniec gry
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isVictory
              ? `Twoja osada osiągnęła ${population} mieszkańców w ${day} dni. Brawo!`
              : `Twoja osada upadła w ${day}. dniu — populacja spadła do zera.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={reset}>Zacznij od nowa</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function GameRoot() {
  useGameTick();
  return (
    <>
      <ResourceHUD />
      <ObjectiveBanner />
      <GameOverModal />
    </>
  );
}
