export interface CandidateAttachment {
  id: string;
  slotId: string;
  cost: number;

  /**
   * Se preenchido, limita a peça às armas indicadas.
   * Ausente => compatibilidade já resolvida pela camada de dados.
   */
  compatibleWeaponIds?: readonly string[];

  /**
   * Duas peças do mesmo exclusiveGroup não podem coexistir.
   * Útil para trilhos/áreas físicas compartilhadas.
   */
  exclusiveGroupIds?: readonly string[];

  restrictionIds?: readonly string[];
}

export interface CandidateSlot {
  id: string;

  /**
   * Quantidade máxima de acessórios equipáveis neste slot.
   * Na maioria dos slots será 1.
   */
  maxEquipped: number;

  /**
   * false por padrão: deixar o slot vazio é permitido.
   */
  required?: boolean;
}

export type CandidateRestriction =
  | {
      id: string;
      type: "INCOMPATIBLE_WITH_ATTACHMENT";
      attachmentId: string;
      incompatibleAttachmentId: string;
    }
  | {
      id: string;
      type: "REQUIRES_ATTACHMENT";
      attachmentId: string;
      requiredAttachmentId: string;
    }
  | {
      id: string;
      type: "REQUIRES_ONE_OF";
      attachmentId: string;
      requiredAttachmentIds: readonly string[];
    }
  | {
      id: string;
      type: "INCOMPATIBLE_WITH_SLOT";
      attachmentId: string;
      incompatibleSlotId: string;
    }
  | {
      id: string;
      type: "REQUIRES_SLOT_OCCUPIED";
      attachmentId: string;
      requiredSlotId: string;
    };

export interface CandidateGeneratorInput {
  weaponId: string;
  budget: number;

  slots: readonly CandidateSlot[];
  attachments: readonly CandidateAttachment[];

  /**
   * IDs já disponíveis naquela maestria.
   * O generator não decide regras de unlock.
   */
  availableAttachmentIds: readonly string[];

  restrictions?: readonly CandidateRestriction[];

  /**
   * Fail-loud guard. Nunca retorna silenciosamente um conjunto truncado.
   */
  maxSearchNodes?: number;

  /**
   * Se fornecido, permite poda semântica conservadora APÓS a geração das
   * combinações válidas.
   */
  dominance?: DominancePruningConfig;
}

export interface CandidateConfiguration {
  id: string;
  weaponId: string;
  attachmentIds: readonly string[];
  totalCost: number;
  occupiedSlots: Readonly<Record<string, readonly string[]>>;
}

export interface CandidateGenerationStats {
  searchNodes: number;
  completedConfigurations: number;
  rejectedByBudget: number;
  rejectedByImmediateConflict: number;
  rejectedByFinalRestriction: number;
  structuralDuplicatesRemoved: number;
  dominatedRemoved: number;
}

export interface CandidateGenerationResult {
  candidates: readonly CandidateConfiguration[];
  stats: CandidateGenerationStats;
}

export interface DominanceVector {
  /**
   * Todas as dimensões DEVEM estar orientadas como:
   * maior = melhor.
   */
  values: Readonly<Record<string, number | undefined>>;
}

export interface DominancePruningConfig {
  metricIds: readonly string[];

  /**
   * Só use métricas seguras para dominância. Não passe scores já misturados
   * com prioridade secundária ou preferências transitórias.
   */
  evaluate: (
    candidate: CandidateConfiguration,
  ) => DominanceVector | null;

  /**
   * Opcionalmente restringe comparação a candidatos semanticamente comparáveis.
   * Ex.: mesmo tipo de munição / mesmo fire mode, se necessário.
   */
  comparisonKey?: (
    candidate: CandidateConfiguration,
  ) => string;
}

export interface CandidateRejection {
  valid: boolean;
  reason?:
    | "BUDGET"
    | "WEAPON_COMPATIBILITY"
    | "SLOT_CAPACITY"
    | "EXCLUSIVE_GROUP"
    | "ATTACHMENT_INCOMPATIBILITY"
    | "SLOT_INCOMPATIBILITY"
    | "MISSING_REQUIRED_ATTACHMENT"
    | "MISSING_REQUIRED_ONE_OF"
    | "MISSING_REQUIRED_SLOT";
}

export class CandidateGenerationLimitError extends Error {
  constructor(public readonly maxSearchNodes: number) {
    super(
      `Candidate generation exceeded maxSearchNodes=${maxSearchNodes}. ` +
      "Generation was aborted rather than returning a truncated candidate set.",
    );
    this.name = "CandidateGenerationLimitError";
  }
}
