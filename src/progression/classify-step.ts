import type {
  ProgressionBuild,
  ProgressionChange,
  ProgressionThresholds,
  StructuralMajorResult,
  UpgradeImportance,
} from "./types";
import { sameConfiguration } from "./compare-builds";

export interface StepClassificationInput {
  nextBuild: ProgressionBuild;
  metaBuild: ProgressionBuild;
  primaryScoreGain: number;
  thresholds: ProgressionThresholds;
  structuralMajor?: StructuralMajorResult;
}

export function classifyStep(
  input: StepClassificationInput,
): {
  importance: UpgradeImportance;
  reasonCodes: string[];
} {
  const reasonCodes: string[] = [];

  if (sameConfiguration(input.nextBuild, input.metaBuild)) {
    reasonCodes.push("META_CONFIGURATION_REACHED");
    return {
      importance: "META",
      reasonCodes,
    };
  }

  if (
    input.structuralMajor?.isMajor
  ) {
    reasonCodes.push(
      "STRUCTURAL_MAJOR",
      ...input.structuralMajor.reasons,
    );

    return {
      importance: "MAJOR",
      reasonCodes,
    };
  }

  if (
    input.primaryScoreGain >=
    input.thresholds.majorUpgradeThreshold
  ) {
    reasonCodes.push("PRIMARY_SCORE_MAJOR_GAIN");

    return {
      importance: "MAJOR",
      reasonCodes,
    };
  }

  reasonCodes.push("PRIMARY_SCORE_RELEVANT_GAIN");

  return {
    importance: "RECOMMENDED",
    reasonCodes,
  };
}
