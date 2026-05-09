import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  BASE_BUILDING_ANCHOR_X,
  BASE_BUILDING_ANCHOR_Y,
  BASE_BUILDING_ID,
  BASE_BUILDING_KIND,
  Building,
  FOOD_PER_POP_PER_TICK,
  GameMode,
  GameSpeed,
  GameState,
  GameStatus,
  INITIAL_CAPS,
  INITIAL_MOOD,
  INITIAL_POPULATION,
  INITIAL_RESOURCES,
  POP_GROWTH_FOOD_MIN,
  POP_GROWTH_MOOD_MIN,
  ResourceBag,
  ResourceId,
  TICKS_PER_DAY,
  VICTORY_POPULATION,
} from "@/lib/game/types";
import {
  BUILDING_DEFS,
  BuildingKind,
  footprintCells,
} from "@/lib/game/buildings";

type PlacementMode = BuildingKind | "demolish" | null;

interface GameStore extends GameState {
  setMode: (mode: GameMode) => void;
  setSpeed: (speed: GameSpeed) => void;
  togglePause: () => void;
  reset: () => void;
  advanceTick: () => void;
  addResource: (id: ResourceId, amount: number) => void;
  spend: (cost: Partial<ResourceBag>) => boolean;
  canAfford: (cost: Partial<ResourceBag>) => boolean;
  setPlacementMode: (kind: PlacementMode) => void;
  placeBuilding: (x: number, y: number) => boolean;
  removeBuildingAt: (x: number, y: number) => void;
}

const createBaseBuilding = (): Building => ({
  id: BASE_BUILDING_ID,
  kind: BASE_BUILDING_KIND,
  x: BASE_BUILDING_ANCHOR_X,
  y: BASE_BUILDING_ANCHOR_Y,
  builtOnDay: 1,
  locked: true,
});

const buildInitialState = (): GameState => {
  const baseBuilding = createBaseBuilding();
  const baseHousing = BUILDING_DEFS[BASE_BUILDING_KIND]?.housing ?? 0;
  return {
    mode: "play",
    status: "running",
    speed: 1,
    tick: 0,
    day: 1,
    resources: { ...INITIAL_RESOURCES },
    caps: { ...INITIAL_CAPS },
    population: INITIAL_POPULATION,
    housing: baseHousing,
    mood: INITIAL_MOOD,
    buildings: [baseBuilding],
    placementMode: null,
  };
};

const clampResource = (
  id: ResourceId,
  value: number,
  caps: GameState["caps"],
) => {
  if (id === "gold") return Math.max(0, value);
  return Math.max(0, Math.min(caps[id], value));
};

const hasResources = (resources: ResourceBag, cost: Partial<ResourceBag>) =>
  (Object.keys(cost) as ResourceId[]).every(
    (id) => resources[id] >= (cost[id] ?? 0),
  );

const subtractResources = (
  resources: ResourceBag,
  cost: Partial<ResourceBag>,
  caps: GameState["caps"],
): ResourceBag => {
  const next: ResourceBag = { ...resources };
  for (const id of Object.keys(cost) as ResourceId[]) {
    next[id] = clampResource(id, next[id] - (cost[id] ?? 0), caps);
  }
  return next;
};

const computeHousing = (buildings: Building[]) =>
  buildings.reduce(
    (sum, b) => sum + (BUILDING_DEFS[b.kind].housing ?? 0),
    0,
  );

interface BuildingsImpact {
  food: number;
  wood: number;
  gold: number;
  moodPerTick: number;
}

const computeBuildingsImpact = (buildings: Building[]): BuildingsImpact => {
  let food = 0;
  let wood = 0;
  let gold = 0;
  let moodPerTick = 0;
  let foodMultiplier = 1;

  for (const b of buildings) {
    const def = BUILDING_DEFS[b.kind];
    if (def.production) {
      food += def.production.food ?? 0;
      wood += def.production.wood ?? 0;
      gold += def.production.gold ?? 0;
    }
    if (def.foodMultiplier && def.foodMultiplier > foodMultiplier) {
      foodMultiplier = def.foodMultiplier;
    }
    if (def.moodPerTick) {
      moodPerTick += def.moodPerTick;
    }
  }

  return {
    food: food * foodMultiplier,
    wood,
    gold,
    moodPerTick,
  };
};

const newBuildingId = () =>
  `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...buildInitialState(),

      setMode: (mode) => {
        const { status } = get();
        const isTerminal = status === "victory" || status === "gameOver";
        set({
          mode,
          placementMode: null,
          status:
            mode === "play"
              ? isTerminal
                ? status
                : status === "paused"
                  ? "running"
                  : status
              : isTerminal
                ? status
                : "paused",
        });
      },

      setSpeed: (speed) => set({ speed }),

      togglePause: () => {
        const { status, mode } = get();
        if (mode !== "play") return;
        if (status === "running") {
          set({ status: "paused" });
        } else if (status === "paused") {
          set({ status: "running" });
        }
      },

      reset: () => {
        const wasPlaying = get().mode === "play";
        set({
          ...buildInitialState(),
          ...(wasPlaying ? { mode: "play", status: "running" } : {}),
        });
      },

      advanceTick: () => {
        const state = get();
        if (state.mode !== "play" || state.status !== "running") return;

        const nextTick = state.tick + 1;
        const nextDay = Math.floor(nextTick / TICKS_PER_DAY) + 1;
        const dayChanged = nextDay !== state.day;

        const impact = computeBuildingsImpact(state.buildings);
        const foodConsumption = state.population * FOOD_PER_POP_PER_TICK;

        const nextResources: ResourceBag = {
          food: clampResource(
            "food",
            state.resources.food - foodConsumption + impact.food,
            state.caps,
          ),
          wood: clampResource(
            "wood",
            state.resources.wood + impact.wood,
            state.caps,
          ),
          gold: Math.max(0, state.resources.gold + impact.gold),
        };

        let nextMood = state.mood;
        if (nextResources.food <= 0) {
          nextMood = Math.max(0, nextMood - 0.05);
        } else if (state.population > state.housing) {
          nextMood = Math.max(0, nextMood - 0.02);
        } else {
          nextMood = Math.min(100, nextMood + 0.01 + impact.moodPerTick);
        }

        let nextPopulation = state.population;
        let nextStatus: GameStatus = state.status;

        if (dayChanged) {
          if (nextResources.food <= 0 && state.population > 0) {
            nextPopulation = Math.max(0, state.population - 1);
          } else if (
            state.housing > state.population &&
            nextResources.food >= POP_GROWTH_FOOD_MIN &&
            nextMood >= POP_GROWTH_MOOD_MIN
          ) {
            nextPopulation = state.population + 1;
          }

          if (nextPopulation >= VICTORY_POPULATION) {
            nextStatus = "victory";
          } else if (nextPopulation === 0 && nextDay > 1) {
            nextStatus = "gameOver";
          }
        }

        set({
          tick: nextTick,
          day: nextDay,
          resources: nextResources,
          mood: nextMood,
          population: nextPopulation,
          status: nextStatus,
        });
      },

      addResource: (id, amount) => {
        const { resources, caps } = get();
        set({
          resources: {
            ...resources,
            [id]: clampResource(id, resources[id] + amount, caps),
          },
        });
      },

      canAfford: (cost) => hasResources(get().resources, cost),

      spend: (cost) => {
        const { resources, caps } = get();
        if (!hasResources(resources, cost)) return false;
        set({ resources: subtractResources(resources, cost, caps) });
        return true;
      },

      setPlacementMode: (kind) => {
        const { mode } = get();
        if (mode !== "play" && kind !== null) return;
        set({ placementMode: kind });
      },

      placeBuilding: (x, y) => {
        const state = get();
        if (state.mode !== "play") return false;
        const placement = state.placementMode;
        if (!placement) return false;

        if (placement === "demolish") {
          // Find any building whose footprint covers (x, y) and remove it.
          const target = state.buildings.find((b) =>
            footprintCells(b.kind, b.x, b.y).some(
              (c) => c.x === x && c.y === y,
            ),
          );
          if (!target || target.locked) return false;
          const nextBuildings = state.buildings.filter((b) => b.id !== target.id);
          set({
            buildings: nextBuildings,
            housing: computeHousing(nextBuildings),
          });
          return true;
        }

        const cells = footprintCells(placement, x, y);
        const occupied = cells.some((c) =>
          state.buildings.some((b) =>
            footprintCells(b.kind, b.x, b.y).some(
              (bc) => bc.x === c.x && bc.y === c.y,
            ),
          ),
        );
        if (occupied) return false;

        const def = BUILDING_DEFS[placement];
        if (!hasResources(state.resources, def.cost)) return false;

        const building: Building = {
          id: newBuildingId(),
          kind: placement,
          x,
          y,
          builtOnDay: state.day,
        };
        const nextBuildings = [...state.buildings, building];
        set({
          buildings: nextBuildings,
          resources: subtractResources(state.resources, def.cost, state.caps),
          housing: computeHousing(nextBuildings),
        });
        return true;
      },

      removeBuildingAt: (x, y) => {
        const state = get();
        const target = state.buildings.find((b) =>
          footprintCells(b.kind, b.x, b.y).some(
            (c) => c.x === x && c.y === y,
          ),
        );
        if (!target || target.locked) return;
        const nextBuildings = state.buildings.filter((b) => b.id !== target.id);
        set({
          buildings: nextBuildings,
          housing: computeHousing(nextBuildings),
        });
      },
    }),
    {
      name: "isoshire-game-v5",
      partialize: (state) => ({
        mode: state.mode,
        speed: state.speed,
        tick: state.tick,
        day: state.day,
        resources: state.resources,
        caps: state.caps,
        population: state.population,
        housing: state.housing,
        mood: state.mood,
        buildings: state.buildings,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.status = "paused";
          state.placementMode = null;
          // Ensure the permanent base is always present after rehydrate.
          const buildings = state.buildings ?? [];
          if (!buildings.some((b) => b.id === BASE_BUILDING_ID)) {
            state.buildings = [createBaseBuilding(), ...buildings];
          } else {
            state.buildings = buildings;
          }
          state.housing = computeHousing(state.buildings);
        }
      },
    },
  ),
);

export const selectGameMode = (s: GameStore): GameMode => s.mode;
export const selectGameStatus = (s: GameStore): GameStatus => s.status;
