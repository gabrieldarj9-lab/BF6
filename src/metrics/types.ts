export type WeaponCategoryId =
  | "assault-rifles"
  | "carbines"
  | "smt"
  | "ml"
  | "dmr"
  | "sniper-rifles"
  | "shotguns"
  | "secondary";

export type MetricDirection = "HIGHER_IS_BETTER" | "LOWER_IS_BETTER";

export type MetricEvidence =
  | "DIRECT_RESOLVED"
  | "DERIVED_EXACT"
  | "MODELED_TRANSPARENT"
  | "CONTEXT_REQUIRED"
  | "UNAVAILABLE";

export interface MetricResult {
  metricId: string;
  value: number | null;
  unit?: string;
  direction: MetricDirection;
  evidence: MetricEvidence;
  dependencies: string[];
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface DamagePoint {
  rangeM: number;
  damage: number;
}

export type FireCadence =
  | {
      kind: "STANDARD";
      rpm: number;
    }
  | {
      kind: "BURST";
      burstRounds: number;
      burstRpm: number;
      burstsPerMinute: number;
    }
  | {
      kind: "CYCLE";
      intervalMs: number;
    }
  | {
      kind: "PUMP";
      /**
       * Só preencher quando o ciclo real/aceito estiver disponível.
       * Ausente => TTK multi-shot indisponível.
       */
      cycleMs?: number;
    };

export type ProjectileType =
  | "SINGLE_PROJECTILE"
  | "MULTI_PROJECTILE";

export interface ReloadModel {
  kind:
    | "FULL_MAGAZINE"
    | "PER_SHELL"
    | "TUBE"
    | "DUAL_TUBE"
    | "OTHER";
  /**
   * Tempo efetivo para voltar a disparar após esvaziar o carregador.
   * Não inferir a partir de uma animação incompatível.
   */
  effectiveEmptyReloadMs?: number;
}

export interface RecoveryReadiness {
  /**
   * Tempo até a condição de recuo adotada pelo nosso modelo de follow-up.
   */
  recoilReadyMs?: number;
  /**
   * Tempo até a condição de dispersão adotada pelo nosso modelo de follow-up.
   */
  spreadReadyMs?: number;
}

export interface ResolvedBuildMetricInput {
  weaponId: string;
  categoryId: WeaponCategoryId;

  healthBaseline?: number;
  bodyMultiplier?: number;

  damageCurve?: readonly DamagePoint[];

  projectileType?: ProjectileType;
  projectileCount?: number;

  cadence?: FireCadence;

  magazineCapacity?: number;
  reload?: ReloadModel;

  projectileVelocityMps?: number;
  dragPerMeter?: number;

  /**
   * Métricas físicas já resolvidas pela camada anterior.
   * Exemplos:
   * recoil.ads.amount, handling.adsTime, spread.hip.move etc.
   */
  technical: Readonly<Record<string, number | null | undefined>>;

  /**
   * Utilidades já normalizadas para 0–100 e orientadas como:
   * 100 = melhor.
   *
   * Usado apenas pelos composites transparentes.
   */
  normalized?: Readonly<Record<string, number | null | undefined>>;

  recovery?: RecoveryReadiness;
}

export interface DerivedMetricContext {
  /**
   * Distâncias que o perfil está avaliando.
   */
  distanceSamplesM?: readonly number[];

  /**
   * Distância representativa exigida por métricas como damagePerMagazine.
   */
  referenceDistanceM?: number;

  /**
   * Usado por timeToFirstDamage / emergencyEngagementTime.
   */
  engagementDistanceM?: number;

  aimMode?: "ADS" | "HIP";

  /**
   * Limite de busca para janelas/breakpoints.
   */
  maxDistanceM?: number;
}

export interface SustainedOutputResult {
  damage: number;
  shotsFired: number;
  reloads: number;
  elapsedLastShotMs: number;
}

export interface ShotgunLethalitySample {
  distanceM: number;
  damagePerProjectile: number;
  projectileCount: number;
  theoreticalDamagePerShot: number;
  minimumProjectileHitsToKill: number | null;
  theoreticalShotsToKill: number | null;
  oneShotPossible: boolean;
  oneShotMargin: number | null;
}
