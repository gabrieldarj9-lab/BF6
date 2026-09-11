# BF6 Builds — Design System V1

## Fundação técnica

O frontend usa **shadcn/ui real**, com componentes source-owned gerados pelo CLI oficial e versionados dentro do próprio projeto.

Stack atual:

- React 19 + TypeScript;
- Vite;
- Tailwind CSS v4;
- shadcn/ui, estilo `new-york`;
- Radix UI para primitives interativos;
- Lucide React como única família de ícones.

A configuração do shadcn fica em `frontend/components.json`. Os componentes gerados ficam em `frontend/src/components/ui/`. Eles podem ser adaptados pelo projeto quando necessário, mas não devem ser substituídos por uma segunda biblioteca caseira com a mesma função.

Os tokens e o tema BF6 ficam centralizados em `frontend/src/index.css`. A personalização visual deve acontecer primeiro nesses tokens e, quando necessário, nos próprios componentes source-owned do shadcn.

## Direção

A interface é escura, técnica, tática, contemporânea e orientada a dados. A referência é a linguagem de menus de jogos modernos, equipamento e informação tática, sem reproduzir uma HUD literal.

Regras visuais:

- sem glassmorphism ou blur decorativo aplicado às composições do produto;
- sem glow/neon;
- sem gradientes decorativos;
- sombras apenas quando fazem parte do comportamento de componentes elevados, como popovers e dialogs;
- hierarquia por tipografia, espaçamento, borda, alinhamento e contraste;
- densidade suficiente para leitura rápida durante o jogo;
- não transformar toda informação em cards ou pills.

## Tema e tokens

O tema segue o contrato semântico do shadcn (`background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`) e acrescenta somente aliases necessários ao produto, como `--bf-positive`, `--bf-warning` e `--bf-disabled`.

Cor de destaque atual: `#ff6a2a`.

A escala de espaçamento usada nas composições segue principalmente 4, 8, 12, 16, 20, 24, 32, 40 e 48 px. O radius base é controlado por `--radius` e alimenta as variantes do Tailwind/shadcn.

## Componentes instalados

A V1 possui componentes shadcn source-owned para:

- Button;
- Input e Label;
- Select;
- Tabs;
- Badge;
- Card;
- Table;
- Tooltip;
- Progress;
- Skeleton;
- Alert;
- Separator;
- Dialog;
- Sheet;
- Dropdown Menu;
- Popover;
- Slider.

Novos componentes genéricos devem ser adicionados pelo registry do shadcn quando houver equivalente adequado, em vez de recriados do zero.

## Showcase vivo

A rota `/design-system` é a referência visual central. Ela importa os mesmos arquivos de `frontend/src/components/ui/` usados pelo produto e demonstra tokens, variantes, estados e pequenas composições.

O showcase não possui regras de negócio, lógica de builds ou chamadas próprias à API.

## Integração do produto

A interface principal continua consumindo:

- `GET /v1/demo-request` para a fixture visual da V1;
- `POST /v1/progression` para progressão;
- `POST /v1/metrics` para métricas da build selecionada.

O engine permanece separado do frontend. A troca do catálogo fictício por dados reais não deve exigir mudanças na fundação do Design System.

## Qualidade

`npm run verify` cobre typecheck, build do Vite, integração do engine, HTTP, UI e demo. O build de produção não depende de React ou Tailwind via CDN.
