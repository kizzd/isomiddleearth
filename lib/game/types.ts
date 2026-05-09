import type { BuildingKind } from "@/lib/game/buildings";

export type GameMode = "editor" | "play";
export type GameStatus = "running" | "paused" | "gameOver" | "victory";
export type GameSpeed = 1 | 2 | 4;

export const TICK_MS = 1000;
export const TICKS_PER_DAY = 240;

export type ResourceId = "food" | "wood" | "gold";

export type ResourceBag = Record<ResourceId, number>;

export interface ResourceCap {
  food: number;
  wood: number;
}

export interface Building {
  id: string;
  kind: BuildingKind;
  x: number;
  y: number;
  builtOnDay: number;
}

export interface GameState {
  mode: GameMode;
  status: GameStatus;
  speed: GameSpeed;
  tick: number;
  day: number;
  resources: ResourceBag;
  caps: ResourceCap;
  population: number;
  housing: number;
  mood: number;
  buildings: Building[];
  placementMode: BuildingKind | "demolish" | null;
}

export const INITIAL_RESOURCES: ResourceBag = {
  food: 60,
  wood: 100,
  gold: 30,
};

export const INITIAL_CAPS: ResourceCap = {
  food: 300,
  wood: 300,
};

export const INITIAL_POPULATION = 3;
export const INITIAL_MOOD = 100;

export const VICTORY_POPULATION = 20;
export const VICTORY_DAY_LIMIT = 50;
export const FOOD_PER_POP_PER_TICK = 0.04;
export const POP_GROWTH_FOOD_MIN = 5;
export const POP_GROWTH_MOOD_MIN = 50;
