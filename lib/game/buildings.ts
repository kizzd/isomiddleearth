import { TILE_GROUPS } from "@/lib/tiles";
import type { ResourceBag, ResourceId } from "@/lib/game/types";

/** "row:col" key. Generated dynamically from TILE_GROUPS. */
export type BuildingKind = string;

export interface BuildingFootprint {
  w: number;
  h: number;
}

export interface BuildingDef {
  kind: BuildingKind;
  label: string;
  category: string;
  tileRow: number;
  tileCol: number;
  cost: Partial<ResourceBag>;
  housing?: number;
  production?: Partial<Record<ResourceId, number>>;
  moodPerTick?: number;
  /** Multiplicative bonus applied to all food production from other buildings. */
  foodMultiplier?: number;
  footprint?: BuildingFootprint;
}

/** Default cost per tile-group row. Specific tiles override below. */
const DEFAULT_COST_BY_ROW: Record<number, Partial<ResourceBag>> = {
  0: { wood: 3 }, // Terrain
  1: { wood: 6 }, // Water & Bridges
  2: { wood: 5 }, // Trees & Vegetation
  3: { wood: 18 }, // Dwellings
  4: { wood: 25 }, // Buildings
  5: { wood: 5 }, // Decorations
};

/** Per-tile overrides. Anything not listed uses DEFAULT_COST_BY_ROW + no mechanics. */
const OVERRIDES: Record<string, Partial<BuildingDef>> = {
  // Row 0 — Terrain
  "0:0": { cost: { wood: 1 } }, // Empty Grass
  "0:1": { cost: { wood: 1 } }, // Tall Grass
  "0:2": { cost: { wood: 1 } }, // Wildflower Meadow
  "0:3": { cost: { wood: 5 } }, // Plowed Farmland
  "0:4": { production: { food: 0.05 } }, // Wheat Field
  "0:5": { production: { food: 0.04 } }, // Pumpkin Patch
  "0:6": { production: { food: 0.02 } }, // Hay Bale
  "0:7": { cost: { wood: 2 } }, // Dirt Path Straight
  "0:8": { cost: { wood: 2 } }, // Dirt Path Curve
  "0:9": { cost: { wood: 3 } }, // Dirt Path Crossroads
  "0:10": { cost: { wood: 4, gold: 3 } }, // Cobblestone Path

  // Row 1 — Water & Bridges
  "1:0": { cost: { wood: 1 } }, // Calm Pond
  "1:1": { cost: { wood: 1 } }, // River Straight
  "1:2": { cost: { wood: 1 } }, // River Bend
  "1:3": { cost: { wood: 1 } }, // River Fork
  "1:4": { cost: { wood: 10 } }, // Small Wooden Bridge
  "1:5": { cost: { wood: 8, gold: 5 } }, // Stone Bridge
  "1:6": { cost: { wood: 1 } }, // Lily Pad Pond
  "1:7": { cost: { wood: 1 } }, // Waterfall
  "1:8": { cost: { wood: 1 } }, // Shallow Stream

  // Row 2 — Trees & Vegetation
  "2:0": { production: { wood: 0.03 } }, // Single Oak Tree
  "2:1": { production: { wood: 0.04 } }, // Birch Trees Cluster
  "2:2": {
    cost: { wood: 50, gold: 20 },
    moodPerTick: 0.08,
    footprint: { w: 2, h: 2 },
  }, // The Party Tree
  "2:3": {
    cost: { wood: 30 },
    production: { food: 0.06 },
    footprint: { w: 2, h: 2 },
  }, // Apple Orchard
  "2:5": {
    cost: { wood: 24 },
    production: { food: 0.04 },
    footprint: { w: 2, h: 2 },
  }, // Vegetable Garden
  "2:8": { production: { wood: 0.04 } }, // Pine Tree

  // Row 3 — Dwellings
  "3:0": { housing: 4 }, // Small Dwelling
  "3:1": { cost: { wood: 30 }, housing: 8 }, // Medium Dwelling
  "3:2": { cost: { wood: 50, gold: 25 }, housing: 12 }, // Landmark Residence (Bag End)
  "3:3": { housing: 4 }, // Dwelling with Fence
  "3:4": { housing: 4 }, // Dwelling with Laundry
  "3:5": { housing: 4 }, // Dwelling with Mailbox

  // Row 4 — Buildings
  "4:0": {
    cost: { wood: 50, gold: 30 },
    production: { gold: 0.08 },
    moodPerTick: 0.05,
  }, // Green Dragon Inn
  "4:1": { cost: { wood: 40, gold: 20 }, foodMultiplier: 1.5 }, // Hobbiton Mill
  "4:2": { cost: { wood: 25 }, production: { gold: 0.04 } }, // Market Stall
  "4:3": { cost: { wood: 25 } }, // Bywater Bridge
  "4:4": { cost: { wood: 20, gold: 15 }, foodMultiplier: 1.2 }, // Stone Well
  "4:5": { cost: { wood: 3 } }, // Wooden Fence
  "4:6": { cost: { wood: 5 } }, // Stone Wall
  "4:7": { cost: { wood: 2, gold: 1 } }, // Lamp Post
  "4:8": { cost: { wood: 12 }, moodPerTick: 0.02 }, // Party Tent

  // Row 5 — Decorations
  "5:5": { production: { gold: 0.02 }, moodPerTick: 0.05 }, // Campfire
  "5:6": { cost: { wood: 30, gold: 20 }, moodPerTick: 0.15 }, // Gandalf's Fireworks
};

const buildAllDefs = (): Record<string, BuildingDef> => {
  const defs: Record<string, BuildingDef> = {};
  for (const group of TILE_GROUPS) {
    for (const tile of group.tiles) {
      if (tile.label === "Empty") continue;
      const kind = `${group.row}:${tile.col}`;
      const override = OVERRIDES[kind] ?? {};
      const baseCost = DEFAULT_COST_BY_ROW[group.row] ?? { wood: 5 };
      defs[kind] = {
        kind,
        label: tile.label,
        category: group.name,
        tileRow: group.row,
        tileCol: tile.col,
        cost: override.cost ?? baseCost,
        housing: override.housing,
        production: override.production,
        moodPerTick: override.moodPerTick,
        foodMultiplier: override.foodMultiplier,
        footprint: override.footprint,
      };
    }
  }
  return defs;
};

export const BUILDING_DEFS: Record<string, BuildingDef> = buildAllDefs();
export const BUILDING_LIST: BuildingDef[] = Object.values(BUILDING_DEFS);

export const isBuildingKind = (value: unknown): value is BuildingKind =>
  typeof value === "string" && value in BUILDING_DEFS;

export const getFootprint = (kind: BuildingKind): BuildingFootprint =>
  BUILDING_DEFS[kind]?.footprint ?? { w: 1, h: 1 };

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
