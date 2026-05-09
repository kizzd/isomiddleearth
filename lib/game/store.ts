import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
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

interface GameStore extends GameState {
  setMode: (mode: GameMode) => void;
  setSpeed: (speed: GameSpeed) => void;
  togglePause: () => void;
  reset: () => void;
  advanceTick: () => void;
  addResource: (id: ResourceId, amount: number) => void;
  spend: (cost: Partial<ResourceBag>) => boolean;
  canAfford: (cost: Partial<ResourceBag>) => boolean;
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

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...buildInitialState(),

      setMode: (mode) => {
        const { status } = get();
        set({
          mode,
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

        const foodConsumption = state.population * 0.05;
        const nextResources: ResourceBag = {
          food: clampResource("food", state.resources.food - foodConsumption, state.caps),
          wood: state.resources.wood,
          stone: state.resources.stone,
          gold: state.resources.gold,
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
        const next: ResourceBag = { ...resources };
        for (const id of Object.keys(cost) as ResourceId[]) {
          next[id] = clampResource(id, next[id] - (cost[id] ?? 0), caps);
        }
        set({ resources: next });
        return true;
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
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.status = "paused";
        }
      },
    },
  ),
);

export const selectGameMode = (s: GameStore): GameMode => s.mode;
export const selectGameStatus = (s: GameStore): GameStatus => s.status;
