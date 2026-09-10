# End-to-End API

## `generateWeaponProgression(request)`

Entrada principal:

```ts
interface EndToEndProgressionRequest {
  weapon: EngineWeaponDefinition;
  primaryProfile: PriorityProfile;
  secondaryProfile?: PriorityProfile;
  normalizationRules: Record<string, MetricNormalizationRule>;
  metricContext?: DerivedMetricContext;
  activeSeasonalAttachmentIds?: string[];
  maxSearchNodes?: number;
  candidateDominance?: DominancePruningConfig;
  evaluateStructuralMajor?: (context) => StructuralMajorResult;
}
```

### `weapon`

Agrupa tudo que pertence ao espaço estrutural e técnico daquela arma:

```ts
{
  id,
  categoryId,
  budget,
  slots,
  attachments,
  restrictions,
  base: {
    technical,
    resolutionRules,
    damageCurve,
    cadence,
    magazineCapacity,
    reload,
    projectileVelocityMps,
    dragPerMeter
  }
}
```

Cada acessório pode conter simultaneamente:

```ts
{
  id,
  slotId,
  cost,
  unlock,
  compatibleWeaponIds,
  exclusiveGroupIds,
  effects,
  runtimeOverride
}
```

`effects` passam pelo resolver técnico. `runtimeOverride` serve para mudanças estruturais como uma munição/conversão que substitua curva de dano, tipo/quantidade de projéteis, cadência ou drag.

Se dois acessórios selecionados tentarem aplicar overrides estruturais incompatíveis ao mesmo campo, a execução falha explicitamente.

## Retorno

```ts
interface EndToEndProgressionResult {
  progression: BuildProgression;
  generationStatsByMastery: Record<number, CandidateGenerationStats & {
    candidateCount: number;
  }>;
  materializationDiagnostics: MaterializationDiagnostic[];
}
```

### `progression.metaBuild`

A build vencedora usando todo o catálogo atualmente elegível.

### `progression.steps`

Etapas realmente relevantes da timeline, já com:

- mastery;
- RECOMMENDED / MAJOR / META;
- configuração anterior e atual;
- `removedAttachmentIds`;
- `addedAttachmentIds`;
- custo;
- PrimaryScore antes/depois;
- SecondaryScore quando aplicado;
- NegativeImpactScore;
- métricas reais antes/depois;
- deltas;
- `nextMastery`.

### `generationStatsByMastery`

Permite monitorar crescimento combinatório e podas por maestria.

### `materializationDiagnostics`

Expõe dados insuficientes ou regras de resolução faltantes em vez de transformar ausência em zero.

---

# HTTP API

O mesmo pipeline também pode ser executado como serviço HTTP usando apenas o módulo `node:http` do Node.js.

## Executar

```bash
npm start
```

Variáveis opcionais:

```bash
HOST=127.0.0.1 PORT=3000 npm start
```

## `GET /health`

Resposta `200`:

```json
{
  "data": {
    "status": "ok",
    "service": "bf6-v1-engine"
  }
}
```


## `GET /v1/demo-request`

Retorna a fixture sintética em uma forma segura para transporte HTTP. É um endpoint de apoio da interface V1 e remove completamente configurações baseadas em callbacks (`candidateDominance` e `evaluateStructuralMajor`) em vez de expor objetos parcialmente serializados.

A interface usa esse payload para exercitar `POST /v1/progression` e `POST /v1/metrics` sem duplicar a fixture no frontend.

## `POST /v1/progression`

Executa o pipeline completo Candidate Generator → Resolver → Derived Metrics → Normalization → Scoring → Progression.

O body é a forma JSON de `EndToEndProgressionRequest`, exceto os campos de callback `candidateDominance` e `evaluateStructuralMajor`, que são deliberadamente recusados pela fronteira HTTP.

```json
{
  "weapon": {},
  "primaryProfile": {},
  "normalizationRules": {},
  "metricContext": {}
}
```

Sucesso: `200 { "data": EndToEndProgressionResult }`.

## `POST /v1/metrics`

Resolve uma configuração específica e calcula apenas as métricas solicitadas, sem executar seleção/scoring.

```json
{
  "weapon": {},
  "attachmentIds": ["quick-grip", "rapid-barrel"],
  "metricIds": ["ttk.10m", "handling.adsTime", "fire.rpm"],
  "metricContext": {}
}
```

Resposta:

```json
{
  "data": {
    "weaponId": "fixture-rifle",
    "attachmentIds": ["quick-grip", "rapid-barrel"],
    "totalCost": 30,
    "resolvedTechnical": {},
    "resolverDiagnostics": [],
    "metrics": {}
  }
}
```

A configuração é validada contra orçamento, capacidade de slots, compatibilidade, grupos exclusivos e restrições antes do cálculo.

## Erros

Formato único:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "issues": [
      {
        "path": "$.weapon.id",
        "code": "REQUIRED",
        "message": "must be a non-empty string"
      }
    ]
  }
}
```

Status usados:

- `400 INVALID_JSON`
- `413 PAYLOAD_TOO_LARGE`
- `415 UNSUPPORTED_MEDIA_TYPE`
- `422 VALIDATION_ERROR`
- `422 ENGINE_VALIDATION_ERROR`
- `404 NOT_FOUND`
- `500 INTERNAL_ERROR`

O limite padrão do body é 1 MiB.
