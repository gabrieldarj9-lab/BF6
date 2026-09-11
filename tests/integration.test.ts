const assert = {
  equal(actual: unknown, expected: unknown, message?: string) {
    if (actual !== expected) {
      throw new Error(message ?? `${String(actual)} !== ${String(expected)}`);
    }
  },
  ok(value: unknown, message?: string) {
    if (!value) throw new Error(message ?? "assert.ok failed");
  },
  deepEqual(actual: unknown, expected: unknown, message?: string) {
    const a = JSON.stringify(actual);
    const b = JSON.stringify(expected);
    if (a !== b) throw new Error(message ?? `${a} !== ${b}`);
  },
};

import { generateWeaponProgression } from "../src/api/generate-weapon-progression";
import { generateCandidates } from "../src/candidate/generate-candidates";
import { inspectWeaponEngineReadiness } from "../src/data/engine-materialization";
import { svk86WeaponRecord } from "../src/data/weapons/svk-86";
import { integrationFixtureRequest } from "../src/fixtures/integration-fixture";
import { deriveMetric } from "../src/metrics/derive-metrics";
import { resolveBuildState } from "../src/resolver/resolve-build";

// 1. Resolver: efeitos diretos realmente alteram a arma a partir do baseline.
{
  const weapon = integrationFixtureRequest.weapon;
  const attachments = weapon.attachments.map((a) => ({ id: a.id, effects: a.effects }));
  const resolved = resolveBuildState(
    {
      id: weapon.id,
      baseTechnical: weapon.base.technical,
      resolutionRules: weapon.base.resolutionRules,
    },
    attachments,
    ["quick-grip", "rapid-barrel"],
  );

  assert.equal(resolved.technical["handling.adsTime"], 250);
  assert.equal(resolved.technical["fire.rpm"], 720);
  // DIRECT compõe MULTIPLY antes de ADD: 1 * 0.9 + 0.1 = 1.0.
  assert.equal(resolved.technical["recoil.ads.amount"], 1);
}

// 2. Métrica derivada: TTK usa a cadência resolvida.
{
  const ttk = deriveMetric({
    weaponId: "fixture-rifle",
    categoryId: "assault-rifles",
    damageCurve: [{ rangeM: 0, damage: 25 }, { rangeM: 50, damage: 25 }],
    cadence: { kind: "STANDARD", rpm: 720 },
    projectileType: "SINGLE_PROJECTILE",
    projectileCount: 1,
    technical: {},
  }, "ttk.10m");

  assert.equal(ttk.value, 250);
}

// 3. Candidate generator: orçamento + incompatibilidade + poda estrutural.
{
  const weapon = integrationFixtureRequest.weapon;
  const generated = generateCandidates({
    weaponId: weapon.id,
    budget: weapon.budget,
    slots: weapon.slots,
    attachments: weapon.attachments.map((a) => ({
      id: a.id,
      slotId: a.slotId,
      cost: a.cost,
      compatibleWeaponIds: a.compatibleWeaponIds,
      exclusiveGroupIds: a.exclusiveGroupIds,
    })),
    availableAttachmentIds: ["quick-grip", "laser", "cosmetic-charm", "rapid-barrel"],
    restrictions: weapon.restrictions,
    dominance: integrationFixtureRequest.candidateDominance,
  });

  assert.ok(generated.candidates.every((candidate) => candidate.totalCost <= 35));
  assert.ok(!generated.candidates.some((candidate) =>
    candidate.attachmentIds.includes("quick-grip") && candidate.attachmentIds.includes("laser")
  ));
  assert.ok(!generated.candidates.some((candidate) =>
    candidate.attachmentIds.includes("cosmetic-charm")
  ));
  assert.ok(generated.stats.dominatedRemoved > 0);
}

// 4. Pipeline end-to-end: generator -> resolver -> metrics -> scoring -> progression.
{
  const result = generateWeaponProgression(integrationFixtureRequest);
  const progression = result.progression;

  assert.equal(progression.reachedMeta, true);
  assert.equal(progression.metaMastery, 8);
  assert.deepEqual(progression.metaBuild.attachmentIds, ["heavy-ammo-conversion"]);

  assert.deepEqual(
    progression.steps.map((step) => [step.mastery, step.importance]),
    [
      [1, "RECOMMENDED"],
      [5, "MAJOR"],
      [8, "META"],
    ],
  );

  assert.deepEqual(progression.steps[0].attachmentIds, ["quick-grip"]);
  assert.deepEqual(progression.steps[1].attachmentIds, ["quick-grip", "rapid-barrel"]);
  assert.deepEqual(progression.steps[2].attachmentIds, ["heavy-ammo-conversion"]);

  assert.equal(progression.steps[0].nextMastery, 5);
  assert.equal(progression.steps[1].nextMastery, 8);
  assert.equal(progression.steps[2].nextMastery, undefined);

  // A meta substitui a configuração anterior inteira.
  assert.deepEqual(progression.steps[2].removedAttachmentIds, ["quick-grip", "rapid-barrel"]);
  assert.deepEqual(progression.steps[2].addedAttachmentIds, ["heavy-ammo-conversion"]);

  // TTK real melhora 300 -> 250 -> 100 ms.
  assert.equal(progression.steps[0].metricsBefore["ttk.10m"], 300);
  assert.equal(progression.steps[0].metricsAfter["ttk.10m"], 300);
  assert.equal(progression.steps[1].metricsAfter["ttk.10m"], 250);
  assert.equal(progression.steps[2].metricsAfter["ttk.10m"], 100);

  // ADS melhora no grip e volta ao baseline na conversão pesada.
  assert.equal(progression.steps[0].metricsAfter["handling.adsTime"], 250);
  assert.equal(progression.steps[2].metricsAfter["handling.adsTime"], 300);

  // A progressão já para no meta da M8, embora exista unlock na M10.
  assert.ok(!progression.evaluatedMasteries.includes(10));

  // O pipeline expõe stats do generator por mastery realmente processada.
  assert.ok(result.generationStatsByMastery[1].candidateCount > 0);
  assert.ok(result.generationStatsByMastery[5].candidateCount > 0);
  assert.ok(result.generationStatsByMastery[8].candidateCount > 0);
  assert.ok(result.generationStatsByMastery[10].candidateCount > 0); // meta foi calculada primeiro com catálogo completo

  // O charm sem efeito foi removido pela poda estrutural configurada.
  assert.ok(result.generationStatsByMastery[1].dominatedRemoved > 0);
}

// 5. Dados reais são aceitos no catálogo, mas não chegam ao engine antes de
//    custos, unlocks, baseline e efeitos estarem reconciliados.
{
  assert.equal(svk86WeaponRecord.name, "SVK-8.6");
  assert.equal(svk86WeaponRecord.categoryId, "dmr");
  assert.equal(svk86WeaponRecord.budget, 100);
  assert.equal(svk86WeaponRecord.careerUnlockLevel, 33);
  assert.equal(svk86WeaponRecord.mastery.maxRank, 50);

  const lowProfileStubby = svk86WeaponRecord.attachments.find(
    (attachment) => attachment.name === "LOW-PROFILE STUBBY",
  );
  assert.ok(lowProfileStubby);
  assert.equal(lowProfileStubby?.costPoints, 45);
  assert.equal(lowProfileStubby?.unlock.type, "MASTERY");
  if (lowProfileStubby?.unlock.type === "MASTERY") {
    assert.equal(lowProfileStubby.unlock.level, 27);
  }

  const readiness = inspectWeaponEngineReadiness(svk86WeaponRecord);
  assert.equal(readiness.ready, false);
  assert.ok(readiness.diagnostics.some((message) => message.includes("technical baseline")));
  assert.ok(readiness.diagnostics.some((message) => message.includes("conflicting source values for fire.rpm")));
  assert.ok(readiness.diagnostics.some((message) => message.includes("unverified engine effects")));
}

console.log("OK: integration tests passed end-to-end.");
