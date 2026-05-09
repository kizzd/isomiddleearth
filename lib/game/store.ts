import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Building,
  GameMode,
  GameSpeed,
  GameState,
  GameStatus,
  INITIAL_CAPS,
  INITIAL_MOOD,
  INITIAL_POPULATION,
  INITIAL_RESOURCES,
  ResourceBag,
  ResourceId,
  TICKS_PER_DAY,
} from "@/lib/game/types";
import { BUILDING_DEFS, BuildingKind } from "@/lib/game/buildings";

interface GameStore extends GameState {
  setMode: (mode: GameMode) => void;
  setSpeed: (speed: GameSpeed) => void;
  togglePause: () => void;
  reset: () => void;
  advanceTick: () => void;
  addResource: (id: ResourceId, amount: number) => void;
  spend: (cost: Partial<ResourceBag>) => boolean;
  canAfford: (cost: Partial<ResourceBag>) => boolean;
  setPlacementMode: (kind: BuildingKind | null) => void;
  placeBuilding: (x: number, y: number) => boolean;
  removeBuildingAt: (x: number, y: number) => void;
}

const buildInitialState = (): GameState => ({
  mode: "editor",
  status: "paused",
  speed: 1,
  tick: 0,
  day: 1,
  resources: { ...INITIAL_RESOURCES },
  caps: { ...INITIAL_CAPS },
  population: INITIAL_POPULATION,
  housing: 0,
  mood: INITIAL_MOOD,
  buildings: [],
  placementMode: null,
});

const clampResource = (id: ResourceId, value: number, caps: GameState["caps"]) => {
  if (id === "gold") return Math.max(0, value);
  const cap = caps[id];
  return Math.max(0, Math.min(cap, value));
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

const computeProduction = (buildings: Building[]): Partial<ResourceBag> => {
  const out: Partial<ResourceBag> = {};
  for (const b of buildings) {
    const prod = BUILDING_DEFS[b.kind].production;
    if (!prod) continue;
    for (const id of Object.keys(prod) as ResourceId[]) {
      out[id] = (out[id] ?? 0) + (prod[id] ?? 0);
    }
  }
  return out;
};

const newBuildingId = () =>
  `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...buildInitialState(),

      setMode: (mode) => {
        const { status } = get();
        set({
          mode,
          placementMode: null,
          status: mode === "play" ? (status === "paused" ? "running" : status) : "paused",
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

      reset: () => set(buildInitialState()),

      advanceTick: () => {
        const state = get();
        if (state.mode !== "play" || state.status !== "running") return;

        const nextTick = state.tick + 1;
        const nextDay = Math.floor(nextTick / TICKS_PER_DAY) + 1;

        const production = computeProduction(state.buildings);
        const foodConsumption = state.population * 0.05;

        const nextResources: ResourceBag = {
          food: clampResource(
            "food",
            state.resources.food - foodConsumption + (production.food ?? 0),
            state.caps,
          ),
          wood: clampResource(
            "wood",
            state.resources.wood + (production.wood ?? 0),
            state.caps,
          ),
          stone: clampResource(
            "stone",
            state.resources.stone + (production.stone ?? 0),
            state.caps,
          ),
          gold: Math.max(0, state.resources.gold + (production.gold ?? 0)),
        };

        let nextMood = state.mood;
        if (nextResources.food <= 0) {
          nextMood = Math.max(0, nextMood - 0.05);
        } else if (nextMood < 100) {
          nextMood = Math.min(100, nextMood + 0.01);
        }

        set({
          tick: nextTick,
          day: nextDay,
          resources: nextResources,
          mood: nextMood,
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
        const kind = state.placementMode;
        if (!kind) return false;
        if (state.buildings.some((b) => b.x === x && b.y === y)) return false;

        const def = BUILDING_DEFS[kind];
        if (!hasResources(state.resources, def.cost)) return false;

        const building: Building = {
          id: newBuildingId(),
          kind,
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
        const nextBuildings = state.buildings.filter(
          (b) => !(b.x === x && b.y === y),
        );
        if (nextBuildings.length === state.buildings.length) return;
        set({
          buildings: nextBuildings,
          housing: computeHousing(nextBuildings),
        });
      },
    }),
    {
      name: "isoshire-game",
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
          state.housing = computeHousing(state.buildings ?? []);
        }
      },
    },
  ),
);

export const selectGameMode = (s: GameStore): GameMode => s.mode;
export const selectGameStatus = (s: GameStore): GameStatus => s.status;
