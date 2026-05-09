"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Minus, Maximize2 } from "lucide-react";
import { useMapStore } from "@/lib/store";
import { useGameStore } from "@/lib/game/store";
import { useShallow } from "zustand/react/shallow";
import { SPRITE_TILE_H, SPRITE_TILE_W, TILE_GROUPS } from "@/lib/tiles";
import {
  getTilePath,
  MIXED_TEXTURE_PLACE_ID,
  TEXTURE_PLACES,
} from "@/lib/textures";
import {
  CHARACTERS,
  getCharacterPath,
  isCharacterId,
} from "@/lib/characters";
import {
  BUILDING_DEFS,
  BuildingKind,
  footprintCells,
} from "@/lib/game/buildings";

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const ZOOM_STEP = 1.2;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export default function IsoCanvas() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLCanvasElement>(null);
  const fgRef = useRef<HTMLCanvasElement>(null);
  const tileCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const characterCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const isPlacingRef = useRef(false);
  const [displayScale, setDisplayScale] = useState(1);
  const [userZoom, setUserZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const pinchStateRef = useRef<{
    initialDistance: number;
    initialZoom: number;
    initialCenter: { x: number; y: number };
    initialPan: { x: number; y: number };
  } | null>(null);

  const {
    map,
    characterMap,
    gridSize,
    activeTool,
    activeCharacterTool,
    setTile,
    setCharacter,
    clearAt,
    location,
  } = useMapStore(
    useShallow((state) => ({
      map: state.map,
      characterMap: state.characterMap,
      gridSize: state.gridSize,
      activeTool: state.activeTool,
      activeCharacterTool: state.activeCharacterTool,
      setTile: state.setTile,
      setCharacter: state.setCharacter,
      clearAt: state.clearAt,
      location: state.location,
    })),
  );

  const {
    gameMode,
    placementMode,
    buildings,
    resources,
    placeBuilding,
    removeBuildingAt,
    setPlacementMode,
  } = useGameStore(
    useShallow((s) => ({
      gameMode: s.mode,
      placementMode: s.placementMode,
      buildings: s.buildings,
      resources: s.resources,
      placeBuilding: s.placeBuilding,
      removeBuildingAt: s.removeBuildingAt,
      setPlacementMode: s.setPlacementMode,
    })),
  );

  const canAffordBuilding = useCallback(
    (kind: BuildingKind) => {
      const cost = BUILDING_DEFS[kind].cost;
      return (Object.entries(cost) as [keyof typeof resources, number][]).every(
        ([id, amount]) => (resources[id] ?? 0) >= amount,
      );
    },
    [resources],
  );

  const tileWidth = 128;
  const tileHeight = 64;

  const canvasWidth = (gridSize + 1) * tileWidth;
  const canvasHeight = gridSize * tileHeight + SPRITE_TILE_H;

  const originX = canvasWidth / 2;
  const originY = tileHeight * 2;

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const updateScale = () => {
      const availableWidth = Math.max(wrapper.clientWidth - 16, 1);
      const availableHeight = Math.max(wrapper.clientHeight - 16, 1);
      const widthScale = availableWidth / canvasWidth;
      const heightScale = availableHeight / canvasHeight;
      const nextScale = Math.min(1, widthScale, heightScale);
      setDisplayScale(Number.isFinite(nextScale) && nextScale > 0 ? nextScale : 1);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [canvasWidth, canvasHeight]);

  const tilePosFromClient = useCallback(
    (clientX: number, clientY: number, canvas: HTMLCanvasElement) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const offsetX = (clientX - rect.left) * scaleX;
      const offsetY = (clientY - rect.top) * scaleY;
      const relX = offsetX - originX;
      const relY = offsetY - originY;
      const _x = relX / tileWidth;
      const _y = relY / tileHeight;
      const x = Math.floor(_y - _x);
      const y = Math.floor(_x + _y);
      return { x, y };
    },
    [originX, originY, tileWidth, tileHeight],
  );

  const drawImageTile = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      row: number,
      col: number,
      tileRealm?: string,
    ) => {
      const realmId =
        location === MIXED_TEXTURE_PLACE_ID
          ? tileRealm ?? TEXTURE_PLACES[0].id
          : location;
      const tilePath = getTilePath(realmId, row, col);
      const baseTilePath = getTilePath(realmId, 0, 0);
      const tileImage =
        tileCacheRef.current.get(tilePath) ??
        tileCacheRef.current.get(baseTilePath);
      if (!tileImage) return;
      ctx.save();
      ctx.translate(
        originX + (y - x) * (tileWidth / 2),
        originY + (x + y) * (tileHeight / 2),
      );
      ctx.drawImage(
        tileImage,
        -SPRITE_TILE_W / 2,
        -130,
        SPRITE_TILE_W,
        SPRITE_TILE_H,
      );
      ctx.restore();
    },
    [location, originX, originY, tileWidth, tileHeight],
  );

  const drawCharacterTile = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      characterId: string | null,
    ) => {
      if (!characterId) return;
      const characterPath = getCharacterPath(characterId);
      if (!characterPath) return;
      const character = characterCacheRef.current.get(characterPath);
      if (!character) return;

      ctx.save();
      ctx.translate(
        originX + (y - x) * (tileWidth / 2),
        originY + (x + y) * (tileHeight / 2),
      );
      ctx.drawImage(
        character,
        -SPRITE_TILE_W / 2,
        -130,
        SPRITE_TILE_W,
        SPRITE_TILE_H,
      );
      ctx.restore();
    },
    [originX, originY, tileWidth, tileHeight],
  );

  const drawBuildingAt = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      kind: BuildingKind,
      alpha: number,
    ) => {
      const def = BUILDING_DEFS[kind];
      if (alpha < 1) {
        ctx.save();
        ctx.globalAlpha = alpha;
        drawImageTile(ctx, x, y, def.tileRow, def.tileCol);
        ctx.restore();
      } else {
        drawImageTile(ctx, x, y, def.tileRow, def.tileCol);
      }
    },
    [drawImageTile],
  );

  /** Map every cell covered by any building's footprint to its kind. */
  const buildingCellMap = useCallback(() => {
    const m = new Map<string, BuildingKind>();
    for (const b of buildings) {
      for (const c of footprintCells(b.kind, b.x, b.y)) {
        m.set(`${c.x}:${c.y}`, b.kind);
      }
    }
    return m;
  }, [buildings]);

  const drawMap = useCallback(() => {
    const bg = bgRef.current?.getContext("2d");
    if (!bg) return;
    bg.clearRect(0, 0, canvasWidth, canvasHeight);

    if (gameMode !== "play") {
      // Editor mode: original row-major iteration.
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          drawImageTile(bg, i, j, map[i][j][0], map[i][j][1], map[i][j][2]);
          drawCharacterTile(bg, i, j, characterMap[i][j]);
        }
      }
      return;
    }

    // Play mode: global iso z-sort across terrain + characters + every
    // footprint cell of every game building. Each item gets a depth key
    // and is painted strictly back-to-front so a 2×2 building behind a
    // tall editor tree still composites correctly with neighbors.
    type DrawItem =
      | { kind: "tile"; i: number; j: number; depth: number }
      | { kind: "character"; i: number; j: number; depth: number }
      | {
          kind: "building";
          buildingKind: BuildingKind;
          cx: number;
          cy: number;
          depth: number;
        };

    const cellMap = buildingCellMap();
    const items: DrawItem[] = [];

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        // Cells covered by a building skip terrain + character — building
        // tile-swap replaces the underlying cell.
        if (cellMap.has(`${i}:${j}`)) continue;
        items.push({ kind: "tile", i, j, depth: (i + j) * 2 });
        if (characterMap[i][j]) {
          items.push({ kind: "character", i, j, depth: (i + j) * 2 + 1 });
        }
      }
    }

    for (const b of buildings) {
      for (const c of footprintCells(b.kind, b.x, b.y)) {
        // +1 keeps each building cell ordered after a same-row terrain
        // tile in case a non-occupied neighbor sits exactly behind.
        items.push({
          kind: "building",
          buildingKind: b.kind,
          cx: c.x,
          cy: c.y,
          depth: (c.x + c.y) * 2 + 1,
        });
      }
    }

    items.sort((a, b) => a.depth - b.depth);

    for (const item of items) {
      if (item.kind === "tile") {
        drawImageTile(
          bg,
          item.i,
          item.j,
          map[item.i][item.j][0],
          map[item.i][item.j][1],
          map[item.i][item.j][2],
        );
      } else if (item.kind === "character") {
        drawCharacterTile(bg, item.i, item.j, characterMap[item.i][item.j]);
      } else {
        drawBuildingAt(bg, item.cx, item.cy, item.buildingKind, 1);
      }
    }
  }, [
    map,
    characterMap,
    gridSize,
    canvasWidth,
    canvasHeight,
    drawImageTile,
    drawCharacterTile,
    drawBuildingAt,
    buildingCellMap,
    buildings,
    gameMode,
  ]);

  const getTileCoordinates = useCallback(() => {
    const coordKeys = new Set<string>();
    coordKeys.add("0:0");

    for (const group of TILE_GROUPS) {
      for (const tile of group.tiles) {
        if (tile.label !== "Empty") {
          coordKeys.add(`${group.row}:${tile.col}`);
        }
      }
    }

    for (const mapRow of map) {
      for (const [row, col] of mapRow) {
        if (
          Number.isInteger(row) &&
          row >= 0 &&
          Number.isInteger(col) &&
          col >= 0
        ) {
          coordKeys.add(`${row}:${col}`);
        }
      }
    }

    return Array.from(coordKeys, (coordKey) => {
      const [row, col] = coordKey.split(":").map(Number);
      return { row, col };
    });
  }, [map]);

  const getCharacterIdsToPreload = useCallback(() => {
    const characterIds = new Set<string>();
    for (const character of CHARACTERS) {
      characterIds.add(character.id);
    }
    for (const row of characterMap) {
      for (const characterId of row) {
        if (typeof characterId === "string" && isCharacterId(characterId)) {
          characterIds.add(characterId);
        }
      }
    }
    return Array.from(characterIds);
  }, [characterMap]);

  useEffect(() => {
    let cancelled = false;
    const loadAsset = (
      path: string,
      cache: { current: Map<string, HTMLImageElement> },
    ) =>
      new Promise<void>((resolve, reject) => {
        if (cache.current.has(path)) {
          resolve();
          return;
        }
        const img = new Image();
        img.src = path;
        img.onload = () => {
          cache.current.set(path, img);
          resolve();
        };
        img.onerror = () => reject(new Error(path));
      });

    const realmIds =
      location === MIXED_TEXTURE_PLACE_ID
        ? TEXTURE_PLACES.map((place) => place.id)
        : [location];

    const tileCoords = getTileCoordinates();
    const tilePaths = Array.from(
      new Set(
        realmIds.flatMap((realmId) =>
          tileCoords.map(({ row, col }) => getTilePath(realmId, row, col)),
        ),
      ),
    );

    const characterPaths = getCharacterIdsToPreload()
      .map((characterId) => getCharacterPath(characterId))
      .filter((path): path is string => Boolean(path));

    const loads = [
      ...tilePaths.map((path) => loadAsset(path, tileCacheRef)),
      ...characterPaths.map((path) => loadAsset(path, characterCacheRef)),
    ];

    Promise.allSettled(loads).then((results) => {
      if (cancelled) return;
      const failed = results.filter((result) => result.status === "rejected");
      if (failed.length > 0) {
        console.error(
          `Failed to load ${failed.length} asset(s) for location: ${location}`,
        );
      }
      drawMap();
    });

    return () => {
      cancelled = true;
    };
  }, [location, getTileCoordinates, getCharacterIdsToPreload, drawMap]);

  useEffect(() => {
    drawMap();
  }, [map, gridSize, drawMap]);

  const drawHover = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, y: number) => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return;

      if (gameMode === "play" && placementMode) {
        const isDemolish = placementMode === "demolish";

        if (isDemolish) {
          const target = buildings.find((b) =>
            footprintCells(b.kind, b.x, b.y).some(
              (c) => c.x === x && c.y === y,
            ),
          );
          const cells = target
            ? footprintCells(target.kind, target.x, target.y)
            : [{ x, y }];
          const isLocked = target?.locked ?? false;
          const fillStyle = !target
            ? "rgba(150,150,150,0.15)"
            : isLocked
              ? "rgba(180,150,40,0.25)"
              : "rgba(220,40,40,0.25)";
          const strokeStyle = !target
            ? "rgba(150,150,150,0.6)"
            : isLocked
              ? "rgba(180,150,40,0.9)"
              : "rgba(220,40,40,0.85)";
          for (const c of cells) {
            ctx.save();
            ctx.translate(
              originX + (c.y - c.x) * (tileWidth / 2),
              originY + (c.x + c.y) * (tileHeight / 2),
            );
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(tileWidth / 2, tileHeight / 2);
            ctx.lineTo(0, tileHeight);
            ctx.lineTo(-tileWidth / 2, tileHeight / 2);
            ctx.closePath();
            ctx.fillStyle = fillStyle;
            ctx.fill();
            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = 2;
            if (isLocked) ctx.setLineDash([6, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
          }
          return;
        }

        const cells = footprintCells(placementMode, x, y);
        const allInGrid = cells.every(
          (c) => c.x >= 0 && c.x < gridSize && c.y >= 0 && c.y < gridSize,
        );
        const anyOccupied = cells.some((c) =>
          buildings.some((b) =>
            footprintCells(b.kind, b.x, b.y).some(
              (bc) => bc.x === c.x && bc.y === c.y,
            ),
          ),
        );
        const affordable = canAffordBuilding(placementMode);
        const valid = allInGrid && !anyOccupied && affordable;

        // Render ghost tiles in iso back-to-front order so footprint
        // overlap is sane.
        const sortedCells = [...cells].sort(
          (a, b) => a.x + a.y - (b.x + b.y),
        );
        if (valid) {
          for (const c of sortedCells) {
            drawBuildingAt(ctx, c.x, c.y, placementMode, 0.55);
          }
        }

        for (const c of cells) {
          if (c.x < 0 || c.x >= gridSize || c.y < 0 || c.y >= gridSize) continue;
          ctx.save();
          ctx.translate(
            originX + (c.y - c.x) * (tileWidth / 2),
            originY + (c.x + c.y) * (tileHeight / 2),
          );
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(tileWidth / 2, tileHeight / 2);
          ctx.lineTo(0, tileHeight);
          ctx.lineTo(-tileWidth / 2, tileHeight / 2);
          ctx.closePath();
          ctx.strokeStyle = valid
            ? "rgba(40,180,40,0.85)"
            : "rgba(220,40,40,0.85)";
          if (!valid) {
            ctx.fillStyle = "rgba(220,40,40,0.18)";
            ctx.fill();
          }
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        }
        return;
      }

      ctx.save();
      ctx.translate(
        originX + (y - x) * (tileWidth / 2),
        originY + (x + y) * (tileHeight / 2),
      );
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(tileWidth / 2, tileHeight / 2);
      ctx.lineTo(0, tileHeight);
      ctx.lineTo(-tileWidth / 2, tileHeight / 2);
      ctx.closePath();
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fill();
      ctx.restore();
    },
    [
      canvasWidth,
      canvasHeight,
      gridSize,
      gameMode,
      placementMode,
      buildings,
      drawBuildingAt,
      canAffordBuilding,
      originX,
      originY,
      tileWidth,
      tileHeight,
    ],
  );

  const paintAt = useCallback(
    (x: number, y: number) => {
      if (activeCharacterTool === null || !isCharacterId(activeCharacterTool)) {
        setTile(x, y, activeTool);
        return;
      }
      setCharacter(x, y, activeCharacterTool);
    },
    [activeCharacterTool, activeTool, setCharacter, setTile],
  );

  const tryPlacement = useCallback(
    (x: number, y: number) => {
      if (!placementMode) return;
      if (placementMode === "demolish") {
        placeBuilding(x, y);
        return;
      }
      const cells = footprintCells(placementMode, x, y);
      const allInGrid = cells.every(
        (c) => c.x >= 0 && c.x < gridSize && c.y >= 0 && c.y < gridSize,
      );
      if (!allInGrid) return;
      placeBuilding(x, y);
    },
    [placementMode, placeBuilding, gridSize],
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = tilePosFromClient(e.clientX, e.clientY, e.currentTarget);
    if (pos.x < 0 || pos.x >= gridSize || pos.y < 0 || pos.y >= gridSize) return;

    if (gameMode === "play") {
      if (e.button === 2) {
        if (placementMode) {
          setPlacementMode(null);
        } else {
          removeBuildingAt(pos.x, pos.y);
        }
        return;
      }
      if (placementMode) {
        tryPlacement(pos.x, pos.y);
      }
      return;
    }

    if (e.button === 2) {
      clearAt(pos.x, pos.y);
    } else {
      paintAt(pos.x, pos.y);
    }
    isPlacingRef.current = true;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cf = fgRef.current?.getContext("2d");
    if (!cf) return;
    const pos = tilePosFromClient(e.clientX, e.clientY, e.currentTarget);

    if (gameMode === "editor" && isPlacingRef.current) {
      if (pos.x >= 0 && pos.x < gridSize && pos.y >= 0 && pos.y < gridSize) {
        if (e.buttons === 2) {
          clearAt(pos.x, pos.y);
        } else if (e.buttons === 1) {
          paintAt(pos.x, pos.y);
        }
      }
    }

    drawHover(cf, pos.x, pos.y);
  };

  const handleMouseUp = () => {
    isPlacingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY === 0) return;
    e.stopPropagation();
    setUserZoom((z) =>
      clamp(z * (e.deltaY > 0 ? 1 / ZOOM_STEP : ZOOM_STEP), ZOOM_MIN, ZOOM_MAX),
    );
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      const a = e.touches[0];
      const b = e.touches[1];
      const dx = b.clientX - a.clientX;
      const dy = b.clientY - a.clientY;
      pinchStateRef.current = {
        initialDistance: Math.hypot(dx, dy),
        initialZoom: userZoom,
        initialCenter: {
          x: (a.clientX + b.clientX) / 2,
          y: (a.clientY + b.clientY) / 2,
        },
        initialPan: { ...pan },
      };
      return;
    }

    const touch = e.touches[0];
    if (!touch) return;
    const canvas = e.currentTarget;
    const pos = tilePosFromClient(touch.clientX, touch.clientY, canvas);
    if (pos.x < 0 || pos.x >= gridSize || pos.y < 0 || pos.y >= gridSize) return;

    const cf = fgRef.current?.getContext("2d");
    if (cf) drawHover(cf, pos.x, pos.y);

    if (gameMode === "play") {
      if (placementMode) {
        tryPlacement(pos.x, pos.y);
      }
      return;
    }

    paintAt(pos.x, pos.y);
    isPlacingRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2 && pinchStateRef.current) {
      const a = e.touches[0];
      const b = e.touches[1];
      const dx = b.clientX - a.clientX;
      const dy = b.clientY - a.clientY;
      const distance = Math.hypot(dx, dy);
      const center = {
        x: (a.clientX + b.clientX) / 2,
        y: (a.clientY + b.clientY) / 2,
      };
      const ratio = distance / pinchStateRef.current.initialDistance;
      const newZoom = clamp(
        pinchStateRef.current.initialZoom * ratio,
        ZOOM_MIN,
        ZOOM_MAX,
      );
      const dxCenter = center.x - pinchStateRef.current.initialCenter.x;
      const dyCenter = center.y - pinchStateRef.current.initialCenter.y;
      setUserZoom(newZoom);
      setPan({
        x: pinchStateRef.current.initialPan.x + dxCenter,
        y: pinchStateRef.current.initialPan.y + dyCenter,
      });
      return;
    }

    const touch = e.touches[0];
    if (!touch) return;
    const canvas = e.currentTarget;
    const pos = tilePosFromClient(touch.clientX, touch.clientY, canvas);

    const cf = fgRef.current?.getContext("2d");
    if (cf) drawHover(cf, pos.x, pos.y);

    if (gameMode === "editor" && isPlacingRef.current) {
      if (pos.x >= 0 && pos.x < gridSize && pos.y >= 0 && pos.y < gridSize) {
        paintAt(pos.x, pos.y);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length < 2) {
      pinchStateRef.current = null;
    }
    isPlacingRef.current = false;
  };

  const zoomIn = () => setUserZoom((z) => clamp(z * ZOOM_STEP, ZOOM_MIN, ZOOM_MAX));
  const zoomOut = () =>
    setUserZoom((z) => clamp(z / ZOOM_STEP, ZOOM_MIN, ZOOM_MAX));
  const resetView = () => {
    setUserZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const effectiveScale = displayScale * userZoom;

  return (
    <div
      ref={wrapperRef}
      id="iso-canvas-wrapper"
      className="relative flex flex-1 items-center justify-center overflow-hidden bg-muted/30"
      onWheel={handleWheel}
    >
      <div
        className="relative"
        style={{
          width: canvasWidth,
          height: canvasHeight,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${effectiveScale})`,
          transformOrigin: "50% 50%",
          willChange: "transform",
        }}
      >
        <canvas
          ref={bgRef}
          width={canvasWidth}
          height={canvasHeight}
          className="absolute inset-0 touch-none"
        />
        <canvas
          ref={fgRef}
          width={canvasWidth}
          height={canvasHeight}
          className="absolute inset-0 touch-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>

      <div className="pointer-events-none absolute right-2 top-2 z-20 flex flex-col gap-1">
        <button
          type="button"
          onClick={zoomIn}
          aria-label="Powiększ"
          className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-md border bg-background/95 shadow-sm hover:bg-muted disabled:opacity-50"
          disabled={userZoom >= ZOOM_MAX}
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={zoomOut}
          aria-label="Pomniejsz"
          className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-md border bg-background/95 shadow-sm hover:bg-muted disabled:opacity-50"
          disabled={userZoom <= ZOOM_MIN}
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={resetView}
          aria-label="Wyśrodkuj"
          className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-md border bg-background/95 shadow-sm hover:bg-muted"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
