"use client";

import ResourceHUD from "@/components/resource-hud";
import { useGameTick } from "@/lib/game/use-game-tick";

export default function GameRoot() {
  useGameTick();
  return <ResourceHUD />;
}
