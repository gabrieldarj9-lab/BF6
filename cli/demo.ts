import { generateWeaponProgression } from "../src/api/generate-weapon-progression";
import { integrationFixtureRequest } from "../src/fixtures/integration-fixture";

const result = generateWeaponProgression(integrationFixtureRequest);

console.log(JSON.stringify({
  weaponId: result.progression.weaponId,
  metaMastery: result.progression.metaMastery,
  metaAttachments: result.progression.metaBuild.attachmentIds,
  timeline: result.progression.steps.map((step) => ({
    mastery: step.mastery,
    importance: step.importance,
    removed: step.removedAttachmentIds,
    added: step.addedAttachmentIds,
    cost: step.totalCost,
    primaryScore: step.primaryScoreAfter,
    nextMastery: step.nextMastery ?? null,
  })),
}, null, 2));
