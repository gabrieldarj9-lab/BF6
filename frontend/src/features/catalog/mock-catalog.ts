import type {
  CatalogWeapon,
  WeaponAccessoryPreview,
  WeaponCatalog,
  WeaponMasteryProgression,
} from "@/features/catalog/model"

const COMPLETE_WEAPON_MASTERY: WeaponMasteryProgression = {
  minRank: 1,
  maxRank: 50,
  milestones: [
    { rank: 10, tier: "Bronze" },
    { rank: 20, tier: "Prata" },
    { rank: 30, tier: "Ouro" },
    { rank: 40, tier: "Platina" },
    { rank: 50, tier: "Elite" },
  ],
}

function thumbnail(name: string) {
  return {
    src: null,
    alt: `Thumbnail mockada de ${name}`,
  }
}

function accessories(items: Array<[string, string, string, string]>): WeaponAccessoryPreview[] {
  return items.map(([id, slotId, slotLabel, name]) => ({ id, slotId, slotLabel, name }))
}

const weaponDefinitions: Array<Omit<CatalogWeapon, "mastery">> = [
  {
    id: "m4a1",
    name: "M4A1",
    classId: "assault-rifles",
    usageProfile: "Versátil",
    description: "Fuzil equilibrado para curta e média distância, com foco em controle e resposta rápida.",
    thumbnail: thumbnail("M4A1"),
    accessories: accessories([
      ["m4a1-optic", "optic", "Mira", "Holo compacta"],
      ["m4a1-barrel", "barrel", "Cano", "Compensador leve"],
      ["m4a1-underbarrel", "underbarrel", "Inferior", "Empunhadura vertical"],
    ]),
  },
  {
    id: "ak-205",
    name: "AK-205",
    classId: "assault-rifles",
    usageProfile: "Controle",
    description: "Configuração mockada voltada a estabilidade sustentada e leitura previsível do recuo.",
    thumbnail: thumbnail("AK-205"),
    accessories: accessories([
      ["ak205-optic", "optic", "Mira", "Reflex aberta"],
      ["ak205-muzzle", "muzzle", "Boca", "Freio de boca"],
      ["ak205-stock", "stock", "Coronha", "Coronha estável"],
    ]),
  },
  {
    id: "nvo-228",
    name: "NVO-228",
    classId: "assault-rifles",
    usageProfile: "Curta distância",
    description: "Fuzil mockado orientado a agressividade, aquisição rápida de alvo e movimentação curta.",
    thumbnail: thumbnail("NVO-228"),
    accessories: accessories([
      ["nvo228-optic", "optic", "Mira", "Ponto vermelho"],
      ["nvo228-barrel", "barrel", "Cano", "Cano curto"],
      ["nvo228-laser", "laser", "Laser", "Laser tático"],
    ]),
  },
  {
    id: "m433",
    name: "M433",
    classId: "carbines",
    usageProfile: "Mobilidade",
    description: "Carabina mockada para reposicionamento frequente e combates dinâmicos em média curta distância.",
    thumbnail: thumbnail("M433"),
    accessories: accessories([
      ["m433-optic", "optic", "Mira", "Micro reflex"],
      ["m433-stock", "stock", "Coronha", "Coronha leve"],
      ["m433-underbarrel", "underbarrel", "Inferior", "Empunhadura angular"],
    ]),
  },
  {
    id: "qbz-192",
    name: "QBZ-192",
    classId: "carbines",
    usageProfile: "Versátil",
    description: "Carabina mockada equilibrada para alternar entre mobilidade, controle e alcance intermediário.",
    thumbnail: thumbnail("QBZ-192"),
    accessories: accessories([
      ["qbz192-optic", "optic", "Mira", "Holo limpa"],
      ["qbz192-muzzle", "muzzle", "Boca", "Compensador"],
      ["qbz192-mag", "magazine", "Carregador", "Carregador rápido"],
    ]),
  },
  {
    id: "tr-7",
    name: "TR-7",
    classId: "carbines",
    usageProfile: "Controle",
    description: "Carabina mockada com prioridade para estabilidade e consistência em rajadas controladas.",
    thumbnail: thumbnail("TR-7"),
    accessories: accessories([
      ["tr7-optic", "optic", "Mira", "Reflex média"],
      ["tr7-barrel", "barrel", "Cano", "Cano estabilizado"],
      ["tr7-grip", "underbarrel", "Inferior", "Empunhadura de controle"],
    ]),
  },
  {
    id: "pw5a3",
    name: "PW5A3",
    classId: "smgs",
    usageProfile: "Curta distância",
    description: "SMG mockada para entradas rápidas, combates fechados e alta responsividade.",
    thumbnail: thumbnail("PW5A3"),
    accessories: accessories([
      ["pw5a3-optic", "optic", "Mira", "Ponto vermelho"],
      ["pw5a3-laser", "laser", "Laser", "Laser compacto"],
      ["pw5a3-stock", "stock", "Coronha", "Coronha curta"],
    ]),
  },
  {
    id: "scw-10",
    name: "SCW-10",
    classId: "smgs",
    usageProfile: "Mobilidade",
    description: "SMG mockada com foco em movimentação, transições rápidas e uso agressivo.",
    thumbnail: thumbnail("SCW-10"),
    accessories: accessories([
      ["scw10-optic", "optic", "Mira", "Micro reflex"],
      ["scw10-barrel", "barrel", "Cano", "Cano leve"],
      ["scw10-mag", "magazine", "Carregador", "Carregador leve"],
    ]),
  },
  {
    id: "sgx",
    name: "SGX",
    classId: "smgs",
    usageProfile: "Controle",
    description: "SMG mockada pensada para manter cadência útil sem sacrificar previsibilidade do recuo.",
    thumbnail: thumbnail("SGX"),
    accessories: accessories([
      ["sgx-optic", "optic", "Mira", "Holo compacta"],
      ["sgx-muzzle", "muzzle", "Boca", "Freio leve"],
      ["sgx-grip", "underbarrel", "Inferior", "Empunhadura curta"],
    ]),
  },
  {
    id: "l110",
    name: "L110",
    classId: "lmgs",
    usageProfile: "Sustentação",
    description: "LMG mockada para manter pressão contínua e controlar setores por períodos maiores.",
    thumbnail: thumbnail("L110"),
    accessories: accessories([
      ["l110-optic", "optic", "Mira", "Mira 2x"],
      ["l110-barrel", "barrel", "Cano", "Cano pesado"],
      ["l110-bipod", "underbarrel", "Inferior", "Bipé"],
    ]),
  },
  {
    id: "m240l",
    name: "M240L",
    classId: "lmgs",
    usageProfile: "Alto impacto",
    description: "LMG mockada para dano e presença em linha, priorizando potência sobre agilidade.",
    thumbnail: thumbnail("M240L"),
    accessories: accessories([
      ["m240l-optic", "optic", "Mira", "Mira 2.5x"],
      ["m240l-muzzle", "muzzle", "Boca", "Compensador pesado"],
      ["m240l-bipod", "underbarrel", "Inferior", "Bipé reforçado"],
    ]),
  },
  {
    id: "rpkm",
    name: "RPKM",
    classId: "lmgs",
    usageProfile: "Controle",
    description: "LMG mockada equilibrando fogo sustentado com leitura mais simples de recuo.",
    thumbnail: thumbnail("RPKM"),
    accessories: accessories([
      ["rpkm-optic", "optic", "Mira", "Holo média"],
      ["rpkm-stock", "stock", "Coronha", "Coronha estável"],
      ["rpkm-grip", "underbarrel", "Inferior", "Empunhadura de controle"],
    ]),
  },
  {
    id: "svdm",
    name: "SVDM",
    classId: "dmrs",
    usageProfile: "Precisão",
    description: "DMR mockada para tiros cadenciados, leitura de distância e precisão sustentada.",
    thumbnail: thumbnail("SVDM"),
    accessories: accessories([
      ["svdm-optic", "optic", "Mira", "Mira 4x"],
      ["svdm-barrel", "barrel", "Cano", "Cano de precisão"],
      ["svdm-stock", "stock", "Coronha", "Coronha estável"],
    ]),
  },
  {
    id: "svk",
    name: "SVK",
    classId: "dmrs",
    usageProfile: "Versátil",
    description: "DMR mockada para alternar entre pressão em média distância e precisão em alvos expostos.",
    thumbnail: thumbnail("SVK"),
    accessories: accessories([
      ["svk-optic", "optic", "Mira", "Mira 3x"],
      ["svk-muzzle", "muzzle", "Boca", "Compensador"],
      ["svk-grip", "underbarrel", "Inferior", "Empunhadura angular"],
    ]),
  },
  {
    id: "m39-emr",
    name: "M39 EMR",
    classId: "dmrs",
    usageProfile: "Controle",
    description: "DMR mockada com foco em estabilidade entre disparos e consistência em média distância.",
    thumbnail: thumbnail("M39 EMR"),
    accessories: accessories([
      ["m39-optic", "optic", "Mira", "Mira 3.5x"],
      ["m39-barrel", "barrel", "Cano", "Cano pesado"],
      ["m39-stock", "stock", "Coronha", "Coronha de precisão"],
    ]),
  },
  {
    id: "m2010-esr",
    name: "M2010 ESR",
    classId: "snipers",
    usageProfile: "Longo alcance",
    description: "Sniper mockada para leitura de linha longa e engajamentos deliberados.",
    thumbnail: thumbnail("M2010 ESR"),
    accessories: accessories([
      ["m2010-optic", "optic", "Mira", "Mira 8x"],
      ["m2010-barrel", "barrel", "Cano", "Cano longo"],
      ["m2010-bipod", "underbarrel", "Inferior", "Bipé"],
    ]),
  },
  {
    id: "sv-98",
    name: "SV-98",
    classId: "snipers",
    usageProfile: "Precisão",
    description: "Sniper mockada orientada a consistência de primeiro tiro e estabilidade em posição.",
    thumbnail: thumbnail("SV-98"),
    accessories: accessories([
      ["sv98-optic", "optic", "Mira", "Mira 6x"],
      ["sv98-stock", "stock", "Coronha", "Coronha ajustável"],
      ["sv98-bipod", "underbarrel", "Inferior", "Bipé leve"],
    ]),
  },
  {
    id: "m98b",
    name: "M98B",
    classId: "snipers",
    usageProfile: "Alto impacto",
    description: "Sniper mockada para potência e alcance, com menor prioridade para mobilidade.",
    thumbnail: thumbnail("M98B"),
    accessories: accessories([
      ["m98b-optic", "optic", "Mira", "Mira 10x"],
      ["m98b-barrel", "barrel", "Cano", "Cano pesado"],
      ["m98b-stock", "stock", "Coronha", "Coronha estável"],
    ]),
  },
  {
    id: "m87a1",
    name: "M87A1",
    classId: "shotguns",
    usageProfile: "Curta distância",
    description: "Escopeta mockada para dano imediato em espaços fechados e entradas agressivas.",
    thumbnail: thumbnail("M87A1"),
    accessories: accessories([
      ["m87a1-sight", "optic", "Mira", "Mira aberta"],
      ["m87a1-barrel", "barrel", "Cano", "Cano curto"],
      ["m87a1-stock", "stock", "Coronha", "Coronha leve"],
    ]),
  },
  {
    id: "12m-auto",
    name: "12M Auto",
    classId: "shotguns",
    usageProfile: "Pressão",
    description: "Escopeta mockada para manter pressão em curta distância com sequência rápida de disparos.",
    thumbnail: thumbnail("12M Auto"),
    accessories: accessories([
      ["12m-optic", "optic", "Mira", "Reflex aberta"],
      ["12m-mag", "magazine", "Carregador", "Carregador estendido"],
      ["12m-grip", "underbarrel", "Inferior", "Empunhadura curta"],
    ]),
  },
  {
    id: "m1014",
    name: "M1014",
    classId: "shotguns",
    usageProfile: "Versátil",
    description: "Escopeta mockada equilibrando agressividade, controle e recuperação entre disparos.",
    thumbnail: thumbnail("M1014"),
    accessories: accessories([
      ["m1014-optic", "optic", "Mira", "Ponto vermelho"],
      ["m1014-barrel", "barrel", "Cano", "Cano padrão"],
      ["m1014-stock", "stock", "Coronha", "Coronha estável"],
    ]),
  },
  {
    id: "p18",
    name: "P18",
    classId: "secondaries",
    usageProfile: "Mobilidade",
    description: "Secundária mockada para troca rápida, acabamento de alvo e deslocamento.",
    thumbnail: thumbnail("P18"),
    accessories: accessories([
      ["p18-sight", "optic", "Mira", "Mira baixa"],
      ["p18-barrel", "barrel", "Cano", "Cano leve"],
      ["p18-mag", "magazine", "Carregador", "Carregador rápido"],
    ]),
  },
  {
    id: "m45a1",
    name: "M45A1",
    classId: "secondaries",
    usageProfile: "Alto impacto",
    description: "Secundária mockada orientada a disparos deliberados e maior impacto por acerto.",
    thumbnail: thumbnail("M45A1"),
    accessories: accessories([
      ["m45-sight", "optic", "Mira", "Mira aberta"],
      ["m45-barrel", "barrel", "Cano", "Cano reforçado"],
      ["m45-grip", "grip", "Empunhadura", "Empunhadura aderente"],
    ]),
  },
  {
    id: "g57",
    name: "G57",
    classId: "secondaries",
    usageProfile: "Versátil",
    description: "Secundária mockada equilibrada para recuperação rápida e uso geral como arma de apoio.",
    thumbnail: thumbnail("G57"),
    accessories: accessories([
      ["g57-sight", "optic", "Mira", "Micro reflex"],
      ["g57-barrel", "barrel", "Cano", "Cano padrão"],
      ["g57-mag", "magazine", "Carregador", "Carregador leve"],
    ]),
  },
]

const weapons: CatalogWeapon[] = weaponDefinitions.map((weapon) => ({
  ...weapon,
  mastery: {
    ...COMPLETE_WEAPON_MASTERY,
    milestones: COMPLETE_WEAPON_MASTERY.milestones.map((milestone) => ({ ...milestone })),
  },
}))

export const MOCK_WEAPON_CATALOG: WeaponCatalog = {
  classes: [
    { id: "assault-rifles", label: "Fuzis de assalto", shortLabel: "Fuzis" },
    { id: "carbines", label: "Carabinas", shortLabel: "Carabinas" },
    { id: "smgs", label: "SMGs", shortLabel: "SMGs" },
    { id: "lmgs", label: "LMGs", shortLabel: "LMGs" },
    { id: "dmrs", label: "DMRs", shortLabel: "DMRs" },
    { id: "snipers", label: "Snipers", shortLabel: "Snipers" },
    { id: "shotguns", label: "Escopetas", shortLabel: "Escopetas" },
    { id: "secondaries", label: "Secundárias", shortLabel: "Secundárias" },
  ],
  weapons,
}
