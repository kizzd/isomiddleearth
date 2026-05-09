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
                Party at Bag End!
              </>
            ) : (
              <>
                <Skull className="h-6 w-6 text-rose-600" />
                Hobbiton opustoszało
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-base">
            {isVictory
              ? `${population} hobbitów zebrało się w Hobbiton dnia ${day}. Pora otworzyć fajeczkę i nakarmić Gandalfa fajerwerkami!`
              : `Dnia ${day} ostatni hobbit spakował tobołek i odszedł na wschód. Spróbuj jeszcze raz, mistrzu burmistrzu.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={reset} className="w-full" size="lg">
            Nowa osada
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
