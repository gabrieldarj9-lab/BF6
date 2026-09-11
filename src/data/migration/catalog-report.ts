import { inspectWeaponEngineReadiness } from "../engine-materialization";
import { SOURCE_BACKED_WEAPONS } from "../source-backed-weapons";
import type { WeaponDataRecord } from "../types";
import { validateSourceBackedCatalog } from "./validate-catalog";
import { WEAPON_MANIFEST } from "./weapon-manifest";

export interface WeaponMigrationCoverage {
  id: string;
  name: string;
  classId: string;
  migrationBatch: number;
  sourceBacked: boolean;
  catalogValid: boolean;
  engineReady: boolean;
  missingCosts: number;
  unknownUnlocks: number;
  unverifiedEffects: number;
  conflictingStats: number;
}

export interface CatalogMigrationReport {
  totals: {
    manifestWeapons: number;
    sourceBackedWeapons: number;
    mockWeaponsRemaining: number;
    catalogValidWeapons: number;
    engineReadyWeapons: number;
    structuralErrors: number;
    structuralWarnings: number;
    missingCosts: number;
    unknownUnlocks: number;
    unverifiedEffects: number;
    conflictingStats: number;
  };
  nextBatch: number | null;
  nextBatchWeaponIds: string[];
  weapons: WeaponMigrationCoverage[];
  structuralIssues: ReturnType<typeof validateSourceBackedCatalog>;
}

function distinctNumericValues(values: readonly number[]) {
  return [...new Set(values.map((value) => Number(value.toPrecision(10))))];
}

function countConflictingStats(weapon: WeaponDataRecord) {
  return weapon.baseStatEvidence.filter((stat) =>
    distinctNumericValues(stat.observations.map((observation) => observation.value)).length > 1
  ).length;
}

export function getCatalogMigrationReport(): CatalogMigrationReport {
  const structuralIssues = validateSourceBackedCatalog(SOURCE_BACKED_WEAPONS);
  const sourceById = new Map(SOURCE_BACKED_WEAPONS.map((weapon) => [weapon.id, weapon]));

  const weapons: WeaponMigrationCoverage[] = WEAPON_MANIFEST.map((manifest) => {
    const source = sourceById.get(manifest.id);
    if (!source) {
      return {
        id: manifest.id,
        name: manifest.name,
        classId: manifest.classId,
        migrationBatch: manifest.migrationBatch,
        sourceBacked: false,
        catalogValid: false,
        engineReady: false,
        missingCosts: 0,
        unknownUnlocks: 0,
        unverifiedEffects: 0,
        conflictingStats: 0,
      };
    }

    const weaponErrors = structuralIssues.filter((issue) =>
      issue.severity === "ERROR" && issue.weaponId === source.id
    );
    const readiness = inspectWeaponEngineReadiness(source);

    return {
      id: manifest.id,
      name: manifest.name,
      classId: manifest.classId,
      migrationBatch: manifest.migrationBatch,
      sourceBacked: true,
      catalogValid: weaponErrors.length === 0,
      engineReady: readiness.ready,
      missingCosts: source.attachments.filter((attachment) => attachment.costPoints === null).length,
      unknownUnlocks: source.attachments.filter((attachment) => attachment.unlock.type === "UNKNOWN").length,
      unverifiedEffects: source.attachments.filter((attachment) => attachment.effects === null).length,
      conflictingStats: countConflictingStats(source),
    };
  });

  const remaining = weapons.filter((weapon) => !weapon.sourceBacked);
  const nextBatch = remaining.length
    ? Math.min(...remaining.map((weapon) => weapon.migrationBatch))
    : null;

  return {
    totals: {
      manifestWeapons: weapons.length,
      sourceBackedWeapons: weapons.filter((weapon) => weapon.sourceBacked).length,
      mockWeaponsRemaining: remaining.length,
      catalogValidWeapons: weapons.filter((weapon) => weapon.catalogValid).length,
      engineReadyWeapons: weapons.filter((weapon) => weapon.engineReady).length,
      structuralErrors: structuralIssues.filter((issue) => issue.severity === "ERROR").length,
      structuralWarnings: structuralIssues.filter((issue) => issue.severity === "WARNING").length,
      missingCosts: weapons.reduce((total, weapon) => total + weapon.missingCosts, 0),
      unknownUnlocks: weapons.reduce((total, weapon) => total + weapon.unknownUnlocks, 0),
      unverifiedEffects: weapons.reduce((total, weapon) => total + weapon.unverifiedEffects, 0),
      conflictingStats: weapons.reduce((total, weapon) => total + weapon.conflictingStats, 0),
    },
    nextBatch,
    nextBatchWeaponIds: nextBatch === null
      ? []
      : remaining.filter((weapon) => weapon.migrationBatch === nextBatch).map((weapon) => weapon.id),
    weapons,
    structuralIssues,
  };
}

export function formatCatalogMigrationReport(report: CatalogMigrationReport): string {
  const lines = [
    "BF6 CATALOG MIGRATION REPORT",
    "",
    `Weapons in manifest: ${report.totals.manifestWeapons}`,
    `Source-backed:      ${report.totals.sourceBackedWeapons}`,
    `Mocks remaining:    ${report.totals.mockWeaponsRemaining}`,
    `Catalog valid:      ${report.totals.catalogValidWeapons}`,
    `Engine ready:       ${report.totals.engineReadyWeapons}`,
    "",
    `Structural errors:  ${report.totals.structuralErrors}`,
    `Warnings:           ${report.totals.structuralWarnings}`,
    `Missing costs:      ${report.totals.missingCosts}`,
    `Unknown unlocks:    ${report.totals.unknownUnlocks}`,
    `Unverified effects: ${report.totals.unverifiedEffects}`,
    `Conflicting stats:  ${report.totals.conflictingStats}`,
    "",
  ];

  if (report.nextBatch === null) {
    lines.push("Next migration batch: none — catalog migration complete.");
  } else {
    lines.push(`Next migration batch: ${report.nextBatch}`);
    lines.push(`Weapons: ${report.nextBatchWeaponIds.join(", ")}`);
  }

  lines.push("", "Coverage:");
  for (const weapon of report.weapons) {
    const state = weapon.sourceBacked
      ? weapon.engineReady
        ? "ENGINE_READY"
        : weapon.catalogValid
          ? "SOURCE_BACKED"
          : "INVALID"
      : "MOCK";
    lines.push(`- ${weapon.id.padEnd(12)} ${state}`);
  }

  if (report.structuralIssues.length) {
    lines.push("", "Structural issues:");
    for (const issue of report.structuralIssues) {
      lines.push(`- [${issue.severity}] ${issue.code}: ${issue.message}`);
    }
  }

  return lines.join("\n");
}
