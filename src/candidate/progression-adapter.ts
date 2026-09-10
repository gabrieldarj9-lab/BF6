import type {
  CandidateConfiguration,
  CandidateGeneratorInput,
} from "./types";
import { generateCandidates } from "./generate-candidates";

export interface CandidateProviderOptions<T> {
  baseInput: Omit<
    CandidateGeneratorInput,
    "availableAttachmentIds" | "dominance"
  >;

  /**
   * Converte a configuração estrutural em um candidato já resolvido
   * para a próxima camada:
   *
   * resolver → derived metrics → normalização → scoring/progression.
   */
  materialize: (
    candidate: CandidateConfiguration,
    mastery: number,
  ) => T;

  /**
   * Dominância semântica pode ser aplicada depois da materialização/scoring.
   * Por isso o adapter estrutural não força dominance por padrão.
   */
}

export function createCandidateProvider<T>(
  options: CandidateProviderOptions<T>,
) {
  return (
    mastery: number,
    availableAttachmentIds: readonly string[],
  ): readonly T[] => {
    const generated = generateCandidates({
      ...options.baseInput,
      availableAttachmentIds,
    });

    return generated.candidates.map((candidate) =>
      options.materialize(candidate, mastery),
    );
  };
}
