export type EffectOperation =
  | "ADD"
  | "MULTIPLY"
  | "SET"
  | "TIER_MOD"
  | "TIER_SHIFT";

export interface AttachmentEffect {
  metricId: string;
  operation: EffectOperation;
  value: number;
  sourceId?: string;
  evidence?: "DIRECT" | "DERIVED" | "ASSUMED";
}

export interface ResolverAttachment {
  id: string;
  effects: readonly AttachmentEffect[];
}

export type MetricResolutionRule =
  | {
      kind: "DIRECT";
    }
  | {
      kind: "INDEXED";
      baseIndex: number;
      table: readonly number[];
      tierModCoefficient: number;
      tierShiftCoefficient: number;
    }
  | {
      kind: "VELOCITY_TIER";
      factorBase?: number;
    }
  | {
      kind: "RELOAD_TIER";
      tierMultipliers?: Readonly<Record<number, number>>;
    };

export interface ResolverWeapon {
  id: string;
  baseTechnical: Readonly<Record<string, number | null | undefined>>;
  resolutionRules?: Readonly<Record<string, MetricResolutionRule>>;
}

export interface ResolverDiagnostic {
  metricId: string;
  code:
    | "MISSING_BASE_VALUE"
    | "UNSUPPORTED_TIER_EFFECT"
    | "MULTIPLE_SET_VALUES"
    | "INVALID_INDEXED_RULE"
    | "UNKNOWN_ATTACHMENT";
  message: string;
}

export interface ResolvedBuildState {
  weaponId: string;
  attachmentIds: readonly string[];
  technical: Readonly<Record<string, number | null>>;
  diagnostics: readonly ResolverDiagnostic[];
}
