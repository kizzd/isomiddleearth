"use client";

import { useEffect } from "react";
import { useGameStore } from "@/lib/game/store";
import { TICK_MS } from "@/lib/game/types";

export function useGameTick() {
  const mode = useGameStore((s) => s.mode);
  const status = useGameStore((s) => s.status);
  const speed = useGameStore((s) => s.speed);
  const advanceTick = useGameStore((s) => s.advanceTick);

  useEffect(() => {
    if (mode !== "play" || status !== "running") return;

    const interval = TICK_MS / speed;
    const id = window.setInterval(() => {
      advanceTick();
    }, interval);

    return () => window.clearInterval(id);
  }, [mode, status, speed, advanceTick]);
}
