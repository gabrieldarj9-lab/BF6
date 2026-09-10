# BF6 V1 Engine

Projeto TypeScript único que integra o pipeline de recomendação de builds:

```text
Candidate Generator
  → Resolver
  → Derived Metrics
  → Normalization
  → Scoring Engine
  → Progression Engine
  → End-to-End API
```

## API principal

```ts
import { generateWeaponProgression } from "./src";

const result = generateWeaponProgression({
  weapon,
  primaryProfile,
  secondaryProfile,
  normalizationRules,
  metricContext,
});
```

Retorno principal:

```ts
{
  progression: {
    weaponId,
    metaBuild,
    metaMastery,
    relevantMasteries,
    evaluatedMasteries,
    skippedMasteries,
    steps,
    reachedMeta
  },
  generationStatsByMastery,
  materializationDiagnostics
}
```

## Responsabilidades

### Candidate Generator

Gera apenas configurações estruturalmente válidas:

- slots;
- `maxEquipped`;
- orçamento;
- compatibilidade por arma;
- incompatibilidades;
- dependências;
- grupos físicos exclusivos;
- poda opcional por dominância.

### Resolver

Sempre recalcula a build a partir da arma base.

Suporta:

- `ADD`;
- `MULTIPLY`;
- `SET`;
- `TIER_MOD`;
- `TIER_SHIFT`;
- regras `DIRECT`;
- regras `INDEXED`;
- velocidade via tier;
- reload via tier discreto.

Um tier aplicado a uma métrica sem regra compatível produz `null + diagnostic`, nunca um valor inventado.

### Derived Metrics

Calcula métricas como:

- dano por distância;
- BTK/STK;
- TTK;
- time-to-impact;
- follow-up;
- sustained output;
- métricas específicas de shotgun;
- composites transparentes após normalização.

### Scoring

Ordem da decisão:

```text
PrimaryScore
→ pool de equivalência
→ SecondaryScore opcional
→ menor custo
→ menor NegativeImpactScore
→ desempate determinístico
```

Guardrails são comparados contra a arma base do mesmo cenário.

### Progression

Calcula a meta primeiro e depois percorre apenas masteries relevantes.

Cada mastery é recalculada globalmente do zero. A timeline ignora mudanças irrelevantes e termina quando a configuração vencedora se torna exatamente a meta.

## Integração em duas passagens

A API de alto nível usa duas passagens de métricas:

1. resolve dados técnicos e métricas físicas/contextuais;
2. normaliza as dependências;
3. calcula composites em escala interna 0–100;
4. normaliza o conjunto final;
5. envia ao scoring.

Isso impede somar diretamente milissegundos, metros/segundo, recoil e outras unidades incompatíveis.

## Contexto de métricas

Métricas que dependem de uma distância representativa não inventam essa distância.

Exemplo:

```ts
metricContext: {
  referenceDistanceM: 40,
  engagementDistanceM: 20,
  aimMode: "ADS"
}
```

Se uma métrica contextual for necessária pelo perfil e o contexto estiver ausente, o candidato fica indisponível para aquele score.

## Seasonal unlocks

Por padrão, unlocks `SEASONAL` ficam indisponíveis. Para ativar:

```ts
activeSeasonalAttachmentIds: ["attachment-id"]
```

## Poda no Candidate Generator

A API aceita `candidateDominance`, mas ela é deliberadamente opcional. Só deve ser usada quando o vetor de poda contém todas as dimensões necessárias para provar dominância estrutural/semântica naquela etapa.

A poda completa após resolução também continua existindo no scoring engine.

## Executar

O engine e o servidor HTTP não possuem dependências npm de runtime. A interface V1 usa React 18 e Tailwind via CDN no browser para manter o pacote executável sem etapa de instalação de frontend.

Com Node.js e TypeScript disponíveis:

```bash
npm run typecheck
npm test
npm run demo
```

Ou tudo:

```bash
npm run verify
```

## Fixture de integração

`src/fixtures/integration-fixture.ts` usa uma arma sintética propositalmente simples. Ela existe apenas para verificar o pipeline, e não representa números reais de nenhuma arma do Battlefield 6.

A fixture valida:

```text
M1  quick-grip             → RECOMMENDED
M5  quick-grip+rapid       → MAJOR
M8  heavy-ammo-conversion  → META
M10 extended-mag           → não é avaliada na timeline
```

A M10 ainda é usada no cálculo inicial do catálogo completo/meta, mas a timeline para na M8 quando reconhece que aquela configuração já é a vencedora final.

## Servidor HTTP

A V1 agora também expõe o pipeline por HTTP, sem dependências de runtime externas:

```bash
npm start
```

Por padrão, o serviço inicia em `http://127.0.0.1:3000`. Use `HOST` e `PORT` para alterar o bind.

Endpoints:

```text
GET  /                         interface V1
GET  /health
GET  /v1
GET  /v1/demo-request          fixture transport-safe da UI
POST /v1/progression
POST /v1/metrics
```

`POST /v1/progression` executa o pipeline completo. `POST /v1/metrics` resolve uma configuração específica e retorna os atributos técnicos e métricas derivadas solicitadas.

Erros de entrada são JSON estruturado e usam `400/413/415/422`; rotas ausentes usam `404`. O servidor limita o body a 1 MiB por padrão.

Para validar especificamente a camada HTTP:

```bash
npm run test:http
```

`npm run verify` inclui os testes de integração HTTP.

## Interface V1

A primeira tela representativa fica em `frontend/` e aplica o Design System BF6 definido para o produto: interface escura, técnica e orientada a dados, com tokens semânticos, radius contido, superfícies densas, foco visível e sem glassmorphism/glow/gradientes decorativos.

A UI é React + TypeScript. Tailwind é carregado no browser e as primitives são source-owned em `frontend/src/components/ui`, seguindo o modelo de composição do shadcn/ui sem herdar a aparência padrão da biblioteca. Base UI fica reservado para widgets headless mais complexos, que ainda não são necessários nesta tela.

A página consome os endpoints reais de progressão e métricas. O catálogo mostrado é a fixture sintética do engine e está identificado como tal na interface.

Para validar somente essa camada:

```bash
npm run test:ui
```

As regras completas do sistema visual estão em `frontend/DESIGN_SYSTEM.md`.
