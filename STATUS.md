# Validation status

`npm run verify` executado com sucesso em 2026-09-10.

- TypeScript typecheck: PASS
- Build: PASS
- Integration tests: PASS
- Executable demo: PASS
- HTTP integration tests: PASS
- UI TypeScript build: PASS
- UI integration tests: PASS

## Integração validada

O teste ponta a ponta atravessa:

1. Candidate Generator
2. Resolver
3. Derived Metrics
4. Normalization
5. Scoring Engine
6. Progression Engine
7. End-to-End API

## Cenário da fixture

```text
M1  quick-grip                    RECOMMENDED
M5  quick-grip + rapid-barrel     MAJOR
M8  heavy-ammo-conversion         META
M10 extended-mag                  não entra na timeline
```

A M10 é considerada no cálculo inicial da meta com o catálogo completo, mas a timeline encerra na M8 quando a configuração vencedora já coincide com a meta.

Também foram validados no fluxo integrado:

- orçamento;
- incompatibilidade entre acessórios;
- poda de candidatos estruturalmente dominados;
- efeitos do resolver;
- TTK derivado da cadência resolvida;
- normalização;
- PrimaryScore;
- classificação RECOMMENDED / MAJOR / META;
- Sai → Entra;
- nextMastery;
- parada antecipada ao atingir a meta.

A fixture é sintética e não representa números reais de uma arma BF6.

## Servidor HTTP

Adicionado em 2026-09-10:

- `GET /health`: PASS
- `GET /v1`: implementado
- `POST /v1/progression`: PASS ponta a ponta via HTTP
- `POST /v1/metrics`: PASS com resolução + derived metrics
- validação estruturada `422`: PASS
- attachment desconhecido: PASS
- JSON inválido `400`: PASS
- media type inválido `415`: PASS
- rota ausente `404`: PASS
- limite de body: implementado (1 MiB padrão)


## Interface V1

Adicionada em 2026-09-10:

- `GET /`: shell da interface: PASS
- React + TypeScript compilado: PASS
- Tailwind/shadcn-style source-owned primitives: implementado
- tokens semânticos e responsividade: implementado
- focus-visible e reduced-motion: implementado
- ausência de glass/blur/gradientes decorativos: validada por teste
- `GET /v1/demo-request`: PASS e sem callbacks parcialmente serializados
- consumo real de `POST /v1/progression`: PASS
- consumo real de `POST /v1/metrics`: coberto pelo frontend e pela suíte HTTP

A tela ainda usa a fixture sintética; não representa dados reais de Battlefield 6.
