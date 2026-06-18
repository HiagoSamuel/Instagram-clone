# Redesign Status

Auditoria visual gerada em: 18/06/2026

## Referencias usadas

- `frontend/design-refs/image.png` - feed desktop e coluna central.
- `frontend/design-refs/Captura de tela 2026-06-18 164927.png` - login/cadastro.
- `frontend/design-refs/Captura de tela 2026-06-18 165649.png` e capturas seguintes - navegacao, listas, detalhes e padroes de superficie.
- `frontend/design-refs/WhatsApp Image 2026-06-18 at 17.18.26.jpeg` - perfil/mobile.

## Telas redesenhadas

| Area | Status | Commit | Observacao |
|---|---:|---|---|
| Sistema de design/tokens | Feito | `5bbc03e` | Criado `src/styles/tokens.css`, importado no `main.jsx` e documentado em `DESIGN-SYSTEM.md`. |
| Layout base/navegacao | Feito | `67640e8` | Criado shell visual com sidebar desktop, topbar/bottom nav mobile e icones open-source (`lucide-react`). |
| Feed + PostCard | Feito | `d03e735` | Coluna central estreita, posts com header, midia, acoes, curtidas, legenda e comentarios no estilo Instagram. |
| StoriesBar + StoryViewer | Feito | `69c6bd3` | Barra horizontal com anel gradiente e viewer fullscreen escuro com barras de progresso. |
| Perfil | Feito | `cf6614a` | Header com avatar/stats/bio e grid 3 colunas de posts. |
| Login + Cadastro | Feito | `a283302` | Cards centralizados, inputs compactos, botao azul e wordmark visual. |
| DMs + Notificacoes | Feito | `ad9c8c8` | Lista de conversas, chat e notificacoes redesenhados com linhas limpas, avatares, badges e bolhas de mensagem. |

## Validacao

- `npm run build` passou apos cada etapa principal.
- A camada visual foi alterada sem mexer em controllers, services, rotas de backend ou chamadas de API.
- Handlers existentes de criar post, logout, curtir, comentar, enviar mensagem e marcar notificacao como lida foram preservados.
- O ThemeContext continua alimentando os tokens via `data-theme`, com suporte a claro e escuro.

## Pendencias

- Ainda existem cores hardcoded em CSS legado fora das telas redesenhadas (`SettingsMenu`, `CreatePostModal`, CSS antigo de perfil/avatar e alguns overlays). Elas nao bloquearam o build, mas devem ser limpas numa tarefa dedicada de tokenizacao final.
- Nao foi feita validacao visual com screenshots automatizados do navegador nesta rodada; a validacao executada foi build e revisao de estrutura/CSS.
- Os arquivos de referencia em `frontend/design-refs/` permanecem fora do commit, como material local de apoio.

## Proximo passo recomendado

Fazer uma rodada pequena de limpeza de tokens nos CSS legados que ainda aparecem no `rg "#[0-9a-fA-F]{3,8}|rgba\\(|rgb\\(" frontend/src --glob "*.css"`. Isso fecha a regra de consistencia visual sem alterar regra de negocio e evita que uma tela antiga reapareca com cores fora do padrao Instagram.
