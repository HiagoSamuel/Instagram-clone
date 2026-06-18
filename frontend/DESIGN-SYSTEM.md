# Instagram Clone Design System

## Objetivo

O redesign visual usa tokens CSS para aproximar o layout do Instagram sem copiar assets proprietarios. A logica de React, rotas, services e handlers permanece intacta; as mudancas devem ficar restritas a JSX de apresentacao e CSS.

## Tokens principais

- `--ig-bg`: fundo principal da aplicacao.
- `--ig-bg-elev`: fundo levemente elevado, usado em paineis e inputs.
- `--ig-surface`: superficie de cards e areas principais.
- `--ig-border` / `--ig-divider`: bordas e divisorias finas.
- `--ig-text` / `--ig-text-muted`: texto principal e secundario.
- `--ig-primary`: azul de acao primaria.
- `--ig-danger`: acao destrutiva ou curtida ativa.
- `--ig-feed-width`: largura da coluna central do feed.
- `--ig-sidebar-width`: largura da navegacao lateral no desktop.
- `--ig-story-ring`: gradiente do anel de stories.
- `--ig-font`: stack tipografica do Instagram.

## Referencias em `frontend/design-refs/`

- `image.png`: feed desktop com sidebar esquerda, stories no topo, coluna central e sugestoes laterais.
- `WhatsApp Image 2026-06-18 at 17.18.26.jpeg`: perfil mobile em modo escuro.
- `Captura de tela 2026-06-18 164927.png`: login desktop escuro.
- Demais capturas: apoio para estados de busca, perfil, navegacao e paginas internas.

## Modo claro e escuro

Os tokens vivem em `frontend/src/styles/tokens.css` e respeitam `[data-theme="dark"]`, que ja e controlado pelo `ThemeContext`.
