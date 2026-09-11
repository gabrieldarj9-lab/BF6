export type MockWeaponNavItem = {
  id: string
  name: string
  profile: string
}

export type MockWeaponClassNavItem = {
  id: string
  label: string
  shortLabel: string
  weapons: MockWeaponNavItem[]
}

export const MOCK_WEAPON_CLASSES: MockWeaponClassNavItem[] = [
  {
    id: "assault-rifles",
    label: "Fuzis de assalto",
    shortLabel: "Fuzis",
    weapons: [
      { id: "m4a1", name: "M4A1", profile: "Versátil" },
      { id: "ak-205", name: "AK-205", profile: "Controle" },
      { id: "nvo-228", name: "NVO-228", profile: "Curta distância" },
    ],
  },
  {
    id: "carbines",
    label: "Carabinas",
    shortLabel: "Carabinas",
    weapons: [
      { id: "m433", name: "M433", profile: "Mobilidade" },
      { id: "qbz-192", name: "QBZ-192", profile: "Versátil" },
      { id: "tr-7", name: "TR-7", profile: "Controle" },
    ],
  },
  {
    id: "smgs",
    label: "SMGs",
    shortLabel: "SMGs",
    weapons: [
      { id: "pw5a3", name: "PW5A3", profile: "Curta distância" },
      { id: "scw-10", name: "SCW-10", profile: "Mobilidade" },
      { id: "sgx", name: "SGX", profile: "Controle" },
    ],
  },
  {
    id: "lmgs",
    label: "LMGs",
    shortLabel: "LMGs",
    weapons: [
      { id: "l110", name: "L110", profile: "Sustentação" },
      { id: "m240l", name: "M240L", profile: "Alto impacto" },
      { id: "rpkm", name: "RPKM", profile: "Controle" },
    ],
  },
  {
    id: "dmrs",
    label: "DMRs",
    shortLabel: "DMRs",
    weapons: [
      { id: "svdm", name: "SVDM", profile: "Precisão" },
      { id: "svk", name: "SVK", profile: "Versátil" },
      { id: "m39-emr", name: "M39 EMR", profile: "Controle" },
    ],
  },
  {
    id: "snipers",
    label: "Snipers",
    shortLabel: "Snipers",
    weapons: [
      { id: "m2010-esr", name: "M2010 ESR", profile: "Longo alcance" },
      { id: "sv-98", name: "SV-98", profile: "Precisão" },
      { id: "m98b", name: "M98B", profile: "Alto impacto" },
    ],
  },
  {
    id: "shotguns",
    label: "Escopetas",
    shortLabel: "Escopetas",
    weapons: [
      { id: "m87a1", name: "M87A1", profile: "Curta distância" },
      { id: "12m-auto", name: "12M Auto", profile: "Pressão" },
      { id: "m1014", name: "M1014", profile: "Versátil" },
    ],
  },
  {
    id: "secondaries",
    label: "Secundárias",
    shortLabel: "Secundárias",
    weapons: [
      { id: "p18", name: "P18", profile: "Mobilidade" },
      { id: "m45a1", name: "M45A1", profile: "Alto impacto" },
      { id: "g57", name: "G57", profile: "Versátil" },
    ],
  },
]
