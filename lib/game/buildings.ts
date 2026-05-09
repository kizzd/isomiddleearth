import type { ResourceBag, ResourceId } from "@/lib/game/types";

export type BuildingKind =
  | "smial"
  | "wheat_field"
  | "vegetable_garden"
  | "apple_orchard"
  | "pine_grove"
  | "well"
  | "market"
  | "campfire";

export interface BuildingFootprint {
  w: number;
  h: number;
}

export interface BuildingDef {
  kind: BuildingKind;
  label: string;
  description: string;
  tileRow: number;
  tileCol: number;
  cost: Partial<ResourceBag>;
  housing?: number;
  production?: Partial<Record<ResourceId, number>>;
  moodPerTick?: number;
  /** Multiplicative bonus applied to all food production from other buildings. */
  foodMultiplier?: number;
  /** Multi-cell footprint anchored at click position. Defaults to 1×1. */
  footprint?: BuildingFootprint;
}

export const BUILDING_DEFS: Record<BuildingKind, BuildingDef> = {
  smial: {
    kind: "smial",
    label: "Smial",
    description: "Hobbicka norka — mieszkanie dla 4 dusz.",
    tileRow: 3,
    tileCol: 0,
    cost: { wood: 15 },
    housing: 4,
  },
  wheat_field: {
    kind: "wheat_field",
    label: "Pole pszenicy",
    description: "Stałe źródło ziarna.",
    tileRow: 0,
    tileCol: 4,
    cost: { wood: 10 },
    production: { food: 0.05 },
  },
  vegetable_garden: {
    kind: "vegetable_garden",
    label: "Ogród",
    description: "Dwa na dwa kafle warzywnika — większy plon.",
    tileRow: 2,
    tileCol: 5,
    cost: { wood: 24 },
    production: { food: 0.12 },
    footprint: { w: 2, h: 2 },
  },
  apple_orchard: {
    kind: "apple_orchard",
    label: "Sad jabłoniowy",
    description: "Cały gaj jabłoni — 2×2 kafle, obfity zbiór.",
    tileRow: 2,
    tileCol: 3,
    cost: { wood: 40 },
    production: { food: 0.16 },
    footprint: { w: 2, h: 2 },
  },
  pine_grove: {
    kind: "pine_grove",
    label: "Zagajnik",
    description: "Sosny do wycinki — odnawialne drewno.",
    tileRow: 2,
    tileCol: 8,
    cost: { wood: 5 },
    production: { wood: 0.05 },
  },
  well: {
    kind: "well",
    label: "Studnia",
    description:
      "Czysta woda dla pól — premia ×1.5 do produkcji jedzenia w całej osadzie.",
    tileRow: 4,
    tileCol: 4,
    cost: { wood: 20, gold: 15 },
    foodMultiplier: 1.5,
  },
  market: {
    kind: "market",
    label: "Stragan",
    description: "Hobbicki targ — 2×2 kafle, więcej kupców.",
    tileRow: 4,
    tileCol: 2,
    cost: { wood: 40, gold: 10 },
    production: { gold: 0.1 },
    footprint: { w: 2, h: 2 },
  },
  campfire: {
    kind: "campfire",
    label: "Ognisko",
    description:
      "Hobbici zbierają się wieczorem — wzrost morale + parę monet od podróżnych.",
    tileRow: 5,
    tileCol: 5,
    cost: { wood: 8 },
    production: { gold: 0.02 },
    moodPerTick: 0.05,
  },
};

export const BUILDING_LIST: BuildingDef[] = Object.values(BUILDING_DEFS);

export const isBuildingKind = (value: unknown): value is BuildingKind =>
  typeof value === "string" && value in BUILDING_DEFS;

export const getFootprint = (kind: BuildingKind): BuildingFootprint =>
  BUILDING_DEFS[kind].footprint ?? { w: 1, h: 1 };

/** All cells covered by a building anchored at (anchorX, anchorY). */
export const footprintCells = (
  kind: BuildingKind,
  anchorX: number,
  anchorY: number,
): { x: number; y: number }[] => {
  const { w, h } = getFootprint(kind);
  const cells: { x: number; y: number }[] = [];
  for (let dx = 0; dx < h; dx++) {
    for (let dy = 0; dy < w; dy++) {
      cells.push({ x: anchorX + dx, y: anchorY + dy });
    }
  }
  return cells;
};
