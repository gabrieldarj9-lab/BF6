# Migração do catálogo de armas

Este documento define o fluxo padrão para substituir mocks por registros source-backed sem acoplar a migração do catálogo à prontidão do engine.

## Regra principal

Uma arma pode estar pronta para o catálogo sem estar pronta para o engine.

- `source-backed`: identidade, classe, maestria, slots, acessórios, custos/desbloqueios conhecidos e fontes estão registrados.
- `catalogValid`: o registro passou pelas validações estruturais automáticas.
- `engineReady`: baseline e efeitos técnicos estão reconciliados e podem alimentar resolver/scoring/progression.

Nunca preencher um valor desconhecido apenas para tornar uma arma `engineReady`.

## Fonte de verdade

- `src/data/migration/weapon-manifest.ts`: lista canônica das 24 armas, IDs, classes, arquétipos e lotes.
- `src/data/source-backed-weapons.ts`: registry dos registros source-backed já migrados.
- `src/data/weapons/*`: evidências e dados source-backed atualmente reconciliados por arma.
- `src/data/migration/batch-builder.ts`: compila lotes declarativos e aplica defaults seguros de budget, mastery, IDs, sources e effects.
- `src/data/migration/validate-catalog.ts`: validações estruturais obrigatórias.
- `src/data/migration/catalog-report.ts`: cobertura, pendências e próximo lote.

## Processo por lote

1. Selecionar todas as armas do lote no manifesto.
2. Confirmar identidade/nome/ID antes de reutilizar qualquer dado do mock.
3. Coletar as fontes em paralelo para todas as armas do lote.
4. Montar drafts declarativos do lote com `buildSourceBackedWeaponBatch`, em vez de repetir factories e boilerplate por arma.
5. Registrar primeiro os dados de catálogo: classe, budget, mastery, slots, acessórios, custos e unlocks.
6. Manter `costPoints: null`, `UNKNOWN` ou `effects: null` quando a evidência não for suficiente.
7. Adicionar o lote compilado ao registry source-backed.
8. Rodar `npm run catalog:report`.
9. Corrigir qualquer `Structural errors > 0` antes de continuar.
10. Rodar `npm run verify` e exigir CI verde.
11. Validar no navegador que sidebar e WeaponHeader consomem o registro source-backed e que a fixture do engine não aparece para uma arma com `engineReady: false`.

O batch builder assume por padrão:

- `budget = 100`;
- `mastery = M0 interno até M50`, normalizado para M1-M50 na API pública;
- `attachment.id = {weaponId}-{slug(name)}` quando não informado;
- `effects = null` quando ainda não verificado;
- `sourceIds` herdados do lote quando configurados em `defaultAttachmentSourceIds`.

Esses defaults reduzem repetição, mas nunca substituem evidência: custos, unlocks e efeitos continuam explícitos quando conhecidos.

## O que o CI bloqueia

Erros estruturais, por exemplo:

- weaponId duplicado;
- registro não presente no manifesto;
- nome/categoria divergente do manifesto;
- budget diferente de 100;
- mastery fora da faixa prevista;
- slot duplicado ou inexistente;
- attachmentId duplicado;
- custo negativo/acima do budget;
- mastery de desbloqueio fora de M1-M50;
- attachment/source evidence apontando para sourceId inexistente.

Pendências de dados não quebram a migração de catálogo. Elas aparecem no relatório:

- custos ausentes;
- unlocks desconhecidos;
- efeitos não verificados;
- stats conflitantes;
- engine ainda não pronto.

## Comandos

```bash
npm run catalog:report
npm run verify
```

Também existe uma superfície JSON para inspeção:

```text
GET /v1/catalog
GET /v1/catalog/report
```

## Ordem atual dos lotes

1. DMR semiautomática: SVK-8.6, SVDM, M39 EMR.
2. Rifles automáticos: fuzis de assalto + carabinas.
3. SMGs.
4. Secundárias.
5. LMGs.
6. Bolt-action/snipers.
7. Escopetas.

O engine deve ser validado por arquétipo depois da migração de catálogo; não é necessário esperar uma arma ficar `engineReady` para migrar as demais do lote.
