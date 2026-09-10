# BF6 Builds — Design System V1

## Direção

A interface é escura, técnica, tática, contemporânea e orientada a dados. A referência é a linguagem de menus de jogos modernos, equipamento e informação tática, sem reproduzir uma HUD literal.

A fundação técnica desta primeira interface é React + TypeScript, com Tailwind CSS no browser para utilidades e primitives source-owned inspiradas no modelo do shadcn/ui. Base UI fica reservado para componentes interativos que realmente precisem de comportamento headless mais complexo; não foi necessário para a primeira tela.

## Regras visuais

- sem glassmorphism, backdrop blur ou superfícies translúcidas decorativas;
- sem glow/neon;
- sem gradientes gratuitos;
- sem sombras grandes;
- radius contido: 2, 4 e 6 px;
- não transformar toda informação em cards ou pills;
- hierarquia por tipografia, espaçamento, borda, alinhamento e contraste;
- componentes densos, legíveis e com leitura rápida durante o jogo.

## Tokens

Tokens globais ficam em `frontend/styles.css` e devem ser reutilizados antes de qualquer valor arbitrário.

### Cor

- `--background`: fundo principal;
- `--surface`: superfície padrão;
- `--surface-elevated`: superfície elevada;
- `--border` / `--border-strong`;
- `--text-primary` / `--text-secondary` / `--text-muted`;
- `--accent`: destaque e interação principal;
- `--positive`, `--warning`, `--negative`, `--disabled`.

### Estrutura

- spacing: 4, 8, 12, 16, 20, 24, 32, 40 e 48 px;
- radius: 2, 4 e 6 px;
- motion: 120 e 180 ms;
- conteúdo máximo: 1512 px.

## Estados

A base já contempla default, hover, focus-visible, active/selected, disabled/indisponível, loading e error. `prefers-reduced-motion` é respeitado.

## Primeira página representativa

A tela de arma valida o sistema antes de expandi-lo:

- navegação por categoria de arma;
- cabeçalho da arma e prioridade;
- controle de maestria;
- build recomendada e orçamento;
- acessórios por slot;
- métricas resolvidas;
- timeline de progressão;
- mudança Sai/Entra;
- estados de API, loading e erro;
- layout responsivo desktop/tablet/mobile.

## Integração

A UI não implementa regras de negócio. Ela consome:

- `GET /v1/demo-request` apenas para a fixture da V1 visual;
- `POST /v1/progression` para a progressão;
- `POST /v1/metrics` para métricas da build selecionada.

Quando o catálogo real substituir a fixture, o Design System e os componentes não devem precisar conhecer as regras do engine.
