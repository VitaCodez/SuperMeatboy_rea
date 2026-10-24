// 60Hz Physics & Collision Engine for Super Meat Boy
import { LevelData, TileType, Entity } from './types';

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CollisionNormal {
  x: number;
  y: number;
}

export type HazardType = 'saw' | 'spike' | 'lava' | 'generic' | 'boss';

export interface TileCollisionResult {
  solid: boolean;
  hazard: boolean;
  hazardType?: HazardType;
  hazardNormal?: CollisionNormal;
  isSlope: boolean;
  slopeFloorY?: number;
  isOneWay: boolean;
  tiles: { x: number; y: number; col: number; row: number; type: TileType }[];
}

export interface EntityCollisionResult {
  hazardHit: boolean;
  hazardType?: HazardType;
  hazardNormal?: CollisionNormal;
  hitEntity?: Entity;
  goalHit: boolean;
  collectedBandage: Entity | null;
  crumbleHit: Entity | null;
}

export interface StepMoveResult {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isGrounded: boolean;
  isCeilingHit: boolean;
  wallDir: -1 | 0 | 1;
  hazardHit: boolean;
  hazardType?: HazardType;
  hazardNormal?: CollisionNormal;
  goalHit: boolean;
  collectedBandage: Entity | null;
  crumbleHit: Entity | null;
}

export class PhysicsEngine {
  // Fixed 60Hz physics timestep
  public static readonly DT = 1 / 60; // 0.0166667s
  // 4 sub-steps per frame to prevent tunneling through thin walls or fast hazards
  public static readonly SUB_STEPS = 4;
  public static readonly SUB_DT = (1 / 60) / 4; // ~0.0041667s

  // Tile classification helpers
  public static isSolidTile(tile: number): boolean {
    return (
      tile === TileType.SOLID ||
      tile === TileType.CRUMBLED ||
      tile === TileType.SLOPE_UP_RIGHT ||
      tile === TileType.SLOPE_UP_LEFT
    );
  }

  public static isOneWayTile(tile: number): boolean {
    return tile === TileType.ONE_WAY;
  }

  public static isSlopeTile(tile: number): boolean {
    return tile === TileType.SLOPE_UP_RIGHT || tile === TileType.SLOPE_UP_LEFT;
  }

  public static isHazardTile(tile: number): boolean {
    return (
      tile === TileType.HAZARD ||
      tile === TileType.LAVA ||
      tile === TileType.SPIKE_UP ||
      tile === TileType.SPIKE_DOWN ||
      tile === TileType.SPIKE_LEFT ||
      tile === TileType.SPIKE_RIGHT
    );
  }

  /**
   * Circle vs Point Collision test
   */
  public static pointCircle(px: number, py: number, cx: number, cy: number, radius: number): boolean {
    const dx = px - cx;
    const dy = py - cy;
    return dx * dx + dy * dy <= radius * radius;
  }

  /**
   * AABB Box vs Circle Collision test
   * Finds closest point on box to circle center and tests squared distance.
   */
  public static boxCircle(box: Box, cx: number, cy: number, radius: number): boolean {
    const closestX = Math.max(box.x, Math.min(cx, box.x + box.width));
    const closestY = Math.max(box.y, Math.min(cy, box.y + box.height));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return dx * dx + dy * dy <= radius * radius;
  }

  /**
   * Saw blade collision test with Super Meat Boy forgiving tolerance (default 88% radius)
   */
  public static checkSawCollision(
    box: Box,
    sawCenterX: number,
    sawCenterY: number,
    sawRadius: number,
    forgiveness: number = 0.88
  ): { hit: boolean; normal: CollisionNormal } {
    const effectiveRadius = sawRadius * forgiveness;
    const closestX = Math.max(box.x, Math.min(sawCenterX, box.x + box.width));
    const closestY = Math.max(box.y, Math.min(sawCenterY, box.y + box.height));
    const dx = sawCenterX - closestX;
    const dy = sawCenterY - closestY;
    const distSq = dx * dx + dy * dy;

    if (distSq <= effectiveRadius * effectiveRadius) {
      const dist = Math.sqrt(distSq) || 1;
      return {
        hit: true,
        normal: { x: -dx / dist, y: -dy / dist }
      };
    }

    return { hit: false, normal: { x: 0, y: 0 } };
  }

  /**
   * Needle / Spike hazard directional bounding box check.
   * Unlike full tile hazards, spikes have precise directional silhouettes so
   * Meat Boy can skim past the sides or jump close without unfair deaths.
   */
  public static checkSpikeCollision(
    box: Box,
    tileX: number,
    tileY: number,
    tileSize: number,
    type: TileType
  ): { hit: boolean; normal: CollisionNormal } {
    const ts = tileSize;

    switch (type) {
      case TileType.SPIKE_UP: {
        // Spike points upwards from floor
        // Base: bottom 65% of tile, width 80%
        // Tip: upper 35% of tile, width 50%
        const baseBox: Box = {
          x: tileX + ts * 0.1,
          y: tileY + ts * 0.35,
          width: ts * 0.8,
          height: ts * 0.65
        };
        const tipBox: Box = {
          x: tileX + ts * 0.25,
          y: tileY + ts * 0.1,
          width: ts * 0.5,
          height: ts * 0.35
        };
        if (this.boxesOverlap(box, baseBox) || this.boxesOverlap(box, tipBox)) {
          return { hit: true, normal: { x: 0, y: -1 } };
        }
        break;
      }

      case TileType.SPIKE_DOWN: {
        // Spike hangs downwards from ceiling
        const baseBox: Box = {
          x: tileX + ts * 0.1,
          y: tileY,
          width: ts * 0.8,
          height: ts * 0.65
        };
        const tipBox: Box = {
          x: tileX + ts * 0.25,
          y: tileY + ts * 0.55,
          width: ts * 0.5,
          height: ts * 0.35
        };
        if (this.boxesOverlap(box, baseBox) || this.boxesOverlap(box, tipBox)) {
          return { hit: true, normal: { x: 0, y: 1 } };
        }
        break;
      }

      case TileType.SPIKE_LEFT: {
        // Spike points left from right wall
        const baseBox: Box = {
          x: tileX + ts * 0.35,
          y: tileY + ts * 0.1,
          width: ts * 0.65,
          height: ts * 0.8
        };
        const tipBox: Box = {
          x: tileX + ts * 0.1,
          y: tileY + ts * 0.25,
          width: ts * 0.35,
          height: ts * 0.5
        };
        if (this.boxesOverlap(box, baseBox) || this.boxesOverlap(box, tipBox)) {
          return { hit: true, normal: { x: -1, y: 0 } };
        }
        break;
      }

      case TileType.SPIKE_RIGHT: {
        // Spike points right from left wall
        const baseBox: Box = {
          x: tileX,
          y: tileY + ts * 0.1,
          width: ts * 0.65,
          height: ts * 0.8
        };
        const tipBox: Box = {
          x: tileX + ts * 0.55,
          y: tileY + ts * 0.25,
          width: ts * 0.35,
          height: ts * 0.5
        };
        if (this.boxesOverlap(box, baseBox) || this.boxesOverlap(box, tipBox)) {
          return { hit: true, normal: { x: 1, y: 0 } };
        }
        break;
      }

      default:
        break;
    }

    return { hit: false, normal: { x: 0, y: 0 } };
  }

  /**
   * Helper for box-box intersection
   */
  public static boxesOverlap(a: Box, b: Box): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  /**
   * Check tile collisions with comprehensive support for:
   * - Solid full tiles
   * - Slopes (SLOPE_UP_RIGHT, SLOPE_UP_LEFT)
   * - One-way platforms (only collide when falling through top)
   * - Needle/spike directional hazards
   * - Lava & generic hazards
   */
  public static checkTileCollision(
    box: Box,
    level: LevelData,
    prevY?: number,
    vy: number = 0
  ): TileCollisionResult {
    const ts = level.tileSize;
    const startCol = Math.floor(box.x / ts);
    const endCol = Math.floor((box.x + box.width - 0.001) / ts);
    const startRow = Math.floor(box.y / ts);
    const endRow = Math.floor((box.y + box.height - 0.001) / ts);

    let solid = false;
    let hazard = false;
    let hazardType: HazardType | undefined = undefined;
    let hazardNormal: CollisionNormal | undefined = undefined;
    let isSlope = false;
    let slopeFloorY: number | undefined = undefined;
    let isOneWay = false;
    const collidedTiles: { x: number; y: number; col: number; row: number; type: TileType }[] = [];

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        // Level outer boundaries are solid walls & floor
        if (r < 0 || r >= level.height || c < 0 || c >= level.width) {
          solid = true;
          collidedTiles.push({ x: c * ts, y: r * ts, col: c, row: r, type: TileType.SOLID });
          continue;
        }

        const tile = level.tileGrid[r]?.[c] ?? TileType.EMPTY;
        if (tile === TileType.EMPTY) continue;

        const tileX = c * ts;
        const tileY = r * ts;

        // 1. Full Solid Tile
        if (tile === TileType.SOLID || tile === TileType.CRUMBLED) {
          solid = true;
          collidedTiles.push({ x: tileX, y: tileY, col: c, row: r, type: tile });
        }
        // 2. Slopes (45-degree angled terrain)
        else if (this.isSlopeTile(tile)) {
          const playerBottom = box.y + box.height;
          // Calculate surface height at player's horizontal position
          const playerCenterX = box.x + box.width / 2;
          const relX = Math.max(0, Math.min(ts, playerCenterX - tileX));

          let surfaceY = tileY + ts;
          if (tile === TileType.SLOPE_UP_RIGHT) {
            // Rises towards right: bottom-left (ts) to top-right (0)
            surfaceY = tileY + ts - relX;
          } else if (tile === TileType.SLOPE_UP_LEFT) {
            // Rises towards left: top-left (0) to bottom-right (ts)
            surfaceY = tileY + relX;
          }

          if (playerBottom >= surfaceY - 1) {
            solid = true;
            isSlope = true;
            slopeFloorY = surfaceY;
            collidedTiles.push({ x: tileX, y: tileY, col: c, row: r, type: tile });
          }
        }
        // 3. One-Way Platforms
        else if (this.isOneWayTile(tile)) {
          // Only collide if player is falling downwards and was previously at or above top edge
          const prevBottom = prevY !== undefined ? prevY + box.height : box.y + box.height;
          const currentBottom = box.y + box.height;
          const platformTop = tileY;

          if (vy >= 0 && prevBottom <= platformTop + 4 && currentBottom >= platformTop) {
            solid = true;
            isOneWay = true;
            collidedTiles.push({ x: tileX, y: tileY, col: c, row: r, type: tile });
          }
        }
        // 4. Needle / Spike Hazards (Directional)
        else if (
          tile === TileType.SPIKE_UP ||
          tile === TileType.SPIKE_DOWN ||
          tile === TileType.SPIKE_LEFT ||
          tile === TileType.SPIKE_RIGHT
        ) {
          const spikeCheck = this.checkSpikeCollision(box, tileX, tileY, ts, tile);
          if (spikeCheck.hit) {
            hazard = true;
            hazardType = 'spike';
            hazardNormal = spikeCheck.normal;
          }
        }
        // 5. Lava & Generic Hazards
        else if (tile === TileType.LAVA) {
          hazard = true;
          hazardType = 'lava';
          hazardNormal = { x: 0, y: -1 };
        } else if (tile === TileType.HAZARD) {
          hazard = true;
          hazardType = 'generic';
          hazardNormal = { x: 0, y: -1 };
        }
      }
    }

    return {
      solid,
      hazard,
      hazardType,
      hazardNormal,
      isSlope,
      slopeFloorY,
      isOneWay,
      tiles: collidedTiles
    };
  }

  /**
   * Check entity collisions (Saw blades, Bandage Girl, Bandages, Crumble blocks)
   */
  public static checkEntityCollisions(
    box: Box,
    entities: Entity[]
  ): EntityCollisionResult {
    let hazardHit = false;
    let hazardType: HazardType | undefined = undefined;
    let hazardNormal: CollisionNormal | undefined = undefined;
    let hitEntity: Entity | undefined = undefined;
    let goalHit = false;
    let collectedBandage: Entity | null = null;
    let hitCrumbleBlock: Entity | null = null;

    for (const ent of entities) {
      if (ent.active === false && ent.type !== 'saw' && ent.type !== 'bandage_girl') continue;

      // 1. Spinning Buzzsaws (Circular hazard collision)
      if (ent.type === 'saw') {
        const radius = ent.radius || ent.width / 2;
        const sawCenterX = ent.x;
        const sawCenterY = ent.y;

        const sawCheck = this.checkSawCollision(box, sawCenterX, sawCenterY, radius, 0.88);
        if (sawCheck.hit) {
          hazardHit = true;
          hazardType = 'saw';
          hazardNormal = sawCheck.normal;
          hitEntity = ent;
          break;
        }
      }
      // 2. Bandage Girl (Level Goal)
      else if (ent.type === 'bandage_girl') {
        if (this.boxesOverlap(box, ent)) {
          goalHit = true;
        }
      }
      // 3. Bandages (Collectibles)
      else if (ent.type === 'bandage' && !ent.collected) {
        if (this.boxesOverlap(box, ent)) {
          collectedBandage = ent;
        }
      }
      // 4. Crumble Block entity
      else if (ent.type === 'crumble_block') {
        if (this.boxesOverlap(box, ent)) {
          hitCrumbleBlock = ent;
        }
      }
    }

    return {
      hazardHit,
      hazardType,
      hazardNormal,
      hitEntity,
      goalHit,
      collectedBandage,
      crumbleHit: hitCrumbleBlock
    };
  }

  /**
   * Sub-stepped Separate Axis Movement & Collision Resolution.
   * Performs separate X and Y steps per sub-step to eliminate tunneling.
   */
  public static stepMovement(
    box: Box,
    vx: number,
    vy: number,
    subDt: number,
    level: LevelData,
    entities: Entity[]
  ): StepMoveResult {
    let posX = box.x;
    let posY = box.y;
    const width = box.width;
    const height = box.height;
    const ts = level.tileSize;

    let outVx = vx;
    let outVy = vy;
    let isGrounded = false;
    let isCeilingHit = false;
    let wallDir: -1 | 0 | 1 = 0;
    let hazardHit = false;
    let hazardType: HazardType | undefined = undefined;
    let hazardNormal: CollisionNormal | undefined = undefined;
    let goalHit = false;
    let collectedBandage: Entity | null = null;
    let hitCrumble: Entity | null = null;

    // --- 1. SEPARATE X-AXIS MOVEMENT ---
    posX += outVx * subDt;
    let currentBox: Box = { x: posX, y: posY, width, height };

    // Tile collision check on X
    const xTileCheck = this.checkTileCollision(currentBox, level, posY, outVy);
    if (xTileCheck.hazard) {
      hazardHit = true;
      hazardType = xTileCheck.hazardType;
      hazardNormal = xTileCheck.hazardNormal;
    }

    if (xTileCheck.solid && !xTileCheck.isOneWay && !xTileCheck.isSlope) {
      if (outVx > 0) {
        // Collided with right wall
        const minWallCol = Math.min(...xTileCheck.tiles.map(t => t.col));
        posX = minWallCol * ts - width;
        wallDir = 1;
      } else if (outVx < 0) {
        // Collided with left wall
        const maxWallCol = Math.max(...xTileCheck.tiles.map(t => t.col));
        posX = (maxWallCol + 1) * ts;
        wallDir = -1;
      }
      outVx = 0;
    }

    // --- 2. SEPARATE Y-AXIS MOVEMENT ---
    const prevY = posY;
    posY += outVy * subDt;
    currentBox = { x: posX, y: posY, width, height };

    // Tile collision check on Y
    const yTileCheck = this.checkTileCollision(currentBox, level, prevY, outVy);
    if (yTileCheck.hazard) {
      hazardHit = true;
      hazardType = yTileCheck.hazardType;
      hazardNormal = yTileCheck.hazardNormal;
    }

    if (yTileCheck.solid) {
      if (yTileCheck.isSlope && yTileCheck.slopeFloorY !== undefined) {
        // Snap to slope surface
        posY = yTileCheck.slopeFloorY - height;
        isGrounded = true;
        outVy = 0;
      } else if (outVy >= 0) {
        // Landed on ground or one-way platform
        const minFloorRow = Math.min(...yTileCheck.tiles.map(t => t.row));
        posY = minFloorRow * ts - height;
        isGrounded = true;
        outVy = 0;
      } else if (outVy < 0 && !yTileCheck.isOneWay) {
        // Hit ceiling
        const maxCeilRow = Math.max(...yTileCheck.tiles.map(t => t.row));
        posY = (maxCeilRow + 1) * ts;
        isCeilingHit = true;
        outVy = 0;
      }
    }

    // Ground detection check: either landed this sub-step, or standing directly on solid/slope floor
    if (!isGrounded && outVy >= 0) {
      const groundProbe = this.checkTileCollision(
        { x: posX, y: posY + 1, width, height },
        level,
        posY,
        0
      );
      if (groundProbe.solid) {
        isGrounded = true;
        outVy = 0;
      }
    }

    // Wall detection probe when airborne and not yet touching wall
    if (!isGrounded && wallDir === 0) {
      const leftProbe = this.checkTileCollision(
        { x: posX - 1, y: posY, width, height },
        level,
        posY,
        0
      );
      if (leftProbe.solid && !leftProbe.isOneWay && !leftProbe.isSlope) {
        wallDir = -1;
      } else {
        const rightProbe = this.checkTileCollision(
          { x: posX + 1, y: posY, width, height },
          level,
          posY,
          0
        );
        if (rightProbe.solid && !rightProbe.isOneWay && !rightProbe.isSlope) {
          wallDir = 1;
        }
      }
    }

    // --- 3. ENTITY COLLISIONS (Saws, Bandage Girl, Bandages) ---
    currentBox = { x: posX, y: posY, width, height };
    const entCheck = this.checkEntityCollisions(currentBox, entities);
    if (entCheck.hazardHit) {
      hazardHit = true;
      hazardType = entCheck.hazardType;
      hazardNormal = entCheck.hazardNormal;
    }
    if (entCheck.goalHit) {
      goalHit = true;
    }
    if (entCheck.collectedBandage) {
      collectedBandage = entCheck.collectedBandage;
    }
    if (entCheck.crumbleHit) {
      hitCrumble = entCheck.crumbleHit;
    }

    // Fall out of level bottom
    if (posY > level.bounds.maxY + 80) {
      hazardHit = true;
      hazardType = 'generic';
      hazardNormal = { x: 0, y: -1 };
    }

    return {
      x: posX,
      y: posY,
      vx: outVx,
      vy: outVy,
      isGrounded,
      isCeilingHit,
      wallDir,
      hazardHit,
      hazardType,
      hazardNormal,
      goalHit,
      collectedBandage,
      crumbleHit: hitCrumble
    };
  }
}
