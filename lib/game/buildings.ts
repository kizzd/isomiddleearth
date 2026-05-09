import type { ResourceBag, ResourceId } from "@/lib/game/types";

export type BuildingKind =
  | "smial"
  | "wheat_field"
  | "vegetable_garden"
  | "apple_orchard"
  | "pine_grove"
  | "mill"
  | "market"
  | "inn";

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
  /** Multiplicative bonus applied to nearby food production (Mill). */
  foodMultiplier?: number;
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
    description: "Tani warzywnik na podwórku.",
    tileRow: 2,
    tileCol: 5,
    cost: { wood: 6 },
    production: { food: 0.03 },
  },
  apple_orchard: {
    kind: "apple_orchard",
    label: "Sad jabłoniowy",
    description: "Wolny, ale obfity zbiór.",
    tileRow: 2,
    tileCol: 3,
    cost: { wood: 25 },
    production: { food: 0.1 },
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
  mill: {
    kind: "mill",
    label: "Młyn Hobbitona",
    description: "Premia +50% do produkcji jedzenia w całej osadzie.",
    tileRow: 4,
    tileCol: 1,
    cost: { wood: 40, gold: 20 },
    foodMultiplier: 1.5,
  },
  market: {
    kind: "market",
    label: "Stragan",
    description: "Hobbici handlują plonami — przynosi złoto.",
    tileRow: 4,
    tileCol: 2,
    cost: { wood: 20 },
    production: { gold: 0.04 },
  },
  inn: {
    kind: "inn",
    label: "Pod Zielonym Smokiem",
    description: "Karczma — hobbici weseleją, zarabia parę monet.",
    tileRow: 4,
    tileCol: 0,
    cost: { wood: 50, gold: 30 },
    production: { gold: 0.08 },
    moodPerTick: 0.05,
  },
};

export const BUILDING_LIST: BuildingDef[] = Object.values(BUILDING_DEFS);

export const isBuildingKind = (value: unknown): value is BuildingKind =>
  typeof value === "string" && value in BUILDING_DEFS;
