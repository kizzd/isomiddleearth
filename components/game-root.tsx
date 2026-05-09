"use client";

import { useShallow } from "zustand/react/shallow";
import { Trophy, Skull } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGameTick } from "@/lib/game/use-game-tick";
import { useGameStore } from "@/lib/game/store";

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

  const isOver =
    mode === "play" && (status === "victory" || status === "gameOver");
  const isVictory = status === "victory";

  return (
    <Dialog open={isOver}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {isVictory ? (
              <>
                <Trophy className="h-6 w-6 text-amber-500" />
                Wygrana!
              </>
            ) : (
              <>
                <Skull className="h-6 w-6 text-rose-600" />
                Koniec gry
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-base">
            {isVictory
              ? `Twoja osada osiągnęła ${population} mieszkańców w ${day} dni. Brawo!`
              : `Twoja osada upadła w ${day}. dniu — populacja spadła do zera.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={reset} className="w-full" size="lg">
            Zacznij od nowa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function GameRoot() {
  useGameTick();
  return <GameOverModal />;
}
