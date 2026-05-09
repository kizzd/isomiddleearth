import type { ResourceBag, ResourceId } from "@/lib/game/types";

export type BuildingKind = "house" | "farm" | "lumberjack" | "quarry";

export interface BuildingDef {
  kind: BuildingKind;
  label: string;
  short: string;
  color: string;
  cost: Partial<ResourceBag>;
  housing?: number;
  production?: Partial<Record<ResourceId, number>>;
  capBoost?: Partial<Record<"food" | "wood" | "stone", number>>;
}

export const BUILDING_DEFS: Record<BuildingKind, BuildingDef> = {
  house: {
    kind: "house",
    label: "Dom",
    short: "D",
    color: "#c97a3d",
    cost: { wood: 20 },
    housing: 4,
  },
  farm: {
    kind: "farm",
    label: "Farma",
    short: "F",
    color: "#d6b647",
    cost: { wood: 25 },
    production: { food: 0.04 },
  },
  lumberjack: {
    kind: "lumberjack",
    label: "Drwal",
    short: "L",
    color: "#3f7a3f",
    cost: { wood: 10, stone: 10 },
    production: { wood: 0.03 },
  },
  quarry: {
    kind: "quarry",
    label: "Kamieniołom",
    short: "K",
    color: "#7a7a7a",
    cost: { wood: 30, stone: 5 },
    production: { stone: 0.02 },
  },
};

export const BUILDING_LIST: BuildingDef[] = Object.values(BUILDING_DEFS);

export const isBuildingKind = (value: unknown): value is BuildingKind =>
  typeof value === "string" && value in BUILDING_DEFS;
