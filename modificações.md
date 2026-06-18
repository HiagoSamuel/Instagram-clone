# 🛠️ Prompt-Mestre — Resolver TODAS as pendências do projeto

> **Cole no agente** (Claude Code / Codex) **na raiz do projeto.**
> **Objetivo:** resolver, em ordem, todas as pendências apontadas no `STATUS-PROJETO.md` (⚠️ e ❌) e, no final, **regenerar o checklist com tudo ✅**.
> **Tom:** instrutivo. Quem lê está aprendendo — explique *por que* de cada decisão.

---

## 📏 Regras de ouro (valem para TODOS os blocos)

1. **Analise antes de mudar.** No começo de cada bloco, abra os arquivos citados, entenda o que já existe e escreva 2–3 linhas dizendo o que vai mexer. Só então edite.
2. **Não quebre as Fases 1 e 2.** Auth, feed, perfil, DMs, amizades e chat já funcionam. Se uma mudança encostar nelas, rode o app/testes antes de seguir.
3. **Um bloco por vez, com commit no fim.** Conclua, valide, faça `git commit` com mensagem clara (ex.: `feat(notifications): tabela + helper + disparos`) e só então vá pro próximo bloco.
4. **Falhou? Pare e reporte.** Se um bloco não passar na validação, não force o próximo. Explique o erro e o que tentou.
5. **Migrations idempotentes.** Sempre `CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`. Nunca `DROP` em tabela com dados.

Execute os blocos **na ordem P0 → P6**.

---

## 🔴 P0 — Segurança: tirar a chave do código `(prioridade máxima)`

**Problema:** a chave do Supabase está hardcoded em `backend/src/services/supabase.js:4` e `:7`. Se o repo está no GitHub, isso é uma credencial exposta.

1. Mova a URL e a chave para variáveis de ambiente (`process.env.SUPABASE_URL`, `process.env.SUPABASE_KEY`). Crie/atualize `.env.example` (sem valores reais) e garanta que `.env` está no `.gitignore`.
2. Falhe rápido: se as variáveis não existirem ao subir, lance um erro claro explicando o que falta.
3. **Avise no relatório final** que a chave precisa ser **rotacionada** no painel do Supabase (a antiga já vazou no histórico do git).
4. **Validar:** suba o backend com as variáveis no `.env` e confirme que conecta normalmente.

---

## 🟠 P1 — Schema versionado de `likes` + `comments`

**Problema:** o código usa `comments` e `likes`, mas não há migration completa que crie `comments` (só alterações em `backend/supabase-comment-files.sql:1`).

1. Inspecione as queries em `commentController.js` e `postController.js` e liste as colunas que o código realmente usa.
2. Crie uma migration completa e idempotente (seguindo o padrão dos `.sql` já existentes em `backend/`) que garanta:
   - `comments`: `id` (PK), `post_id` FK→`posts(id)` ON DELETE CASCADE, `user_id` FK→`users(id)` ON DELETE CASCADE, `content`/`text` (conforme o código), `created_at` default agora.
   - `likes`: `id` (PK), `post_id` FK, `user_id` FK, `created_at`, **UNIQUE(`post_id`,`user_id`)** (isso é o que torna o "descurtir" confiável).
   - Índices em `comments(post_id)` e `likes(post_id)`.
3. **Validar:** rode num banco limpo, depois rode de novo (idempotência), e confirme que curtir/descurtir/comentar seguem funcionando.

---

## 🟡 P2 — Fechar o M1 (curtidas e comentários)

1. **Contador de comentários persistido/exibido:** hoje o `PostCard` só mostra badge de novos não lidos (`PostCard.jsx:331`). Adicione a contagem total de comentários, vinda do backend, exibida no card (Home e Profile).
2. **(Opcional, arquitetural)** Consolidar a lógica de interação que está espalhada entre `postController` (`:448`,`:476`) e `commentController` num `interactionController` — **só se** isso não exigir reescrever o que já funciona. Se for arriscado, registre como dívida técnica e siga.
3. **Validar:** curtir/comentar atualizam contadores corretamente; reload mantém os números.

---

## 🟢 P3 — M2: Notificações internas

> **Aproveite o que já existe:** há infra de Web Push (`pushController`, `pushService`, `push_subscriptions` em `supabase-fase4.sql:61`) e Socket.io rodando (`app.js:53`). Isto aqui é a parte **interna** (histórico no app), não notificação do zero.

1. **Schema:** migration idempotente para `notifications`: `id`, `user_id` (destinatário) FK, `actor_id` (quem gerou) FK, `type` (`like`|`comment`|`friend_request`), `post_id` (nullable) FK, `read` (bool default false), `created_at`.
2. **Helper reaproveitável:** crie `backend/src/helpers/notificationHelper.js` com uma função que (a) grava o registro em `notifications` e (b) emite via Socket.io pro usuário destino. Opcionalmente dispara o Web Push existente.
3. **Disparos:** chame o helper em curtir (`postController.js:471`), comentar (`commentController.js:182`) e pedido de amizade (`friendshipController.js:31`). Nunca notifique a si mesmo.
4. **Rotas:** listar notificações do usuário, marcar uma/todas como lida.
5. **Frontend:** ícone de sino com badge de não lidas (espelhe o padrão de `MessagesNavLink.jsx` + contador no `SocketContext.jsx:35`), dropdown/página com a lista, e marcar como lida ao abrir.
6. **Validar:** ação de outro usuário gera notificação ao vivo (socket) e persistida (reload mantém); marcar como lida zera o badge.

---

## 🔵 P4 — M3: Stories

1. **Schema:** migration idempotente para `stories`: `id`, `user_id` FK, `media_url`, `created_at`, `expires_at` (= created_at + 24h).
2. **Backend:** controller + rotas para criar story e listar **apenas ativos** (`expires_at > now`), agrupados por autor, respeitando amizade (igual ao feed).
3. **Frontend:**
   - `StoriesBar` horizontal no topo da Home: anel colorido = não visto / cinza = visto.
   - `StoryViewer` fullscreen com barra(s) de progresso animadas por CSS, avanço automático e navegação por toque/clique.
4. **Validar:** criar story aparece na barra; após 24h some da listagem; o viewer avança e fecha sozinho.

---

## 🟣 P5 — M4: Vídeos

1. **Dependência + deploy:** adicione `fluent-ffmpeg` ao `backend/package.json` e crie `backend/nixpacks.toml` instalando o binário `ffmpeg` (senão o Railway não tem ffmpeg no deploy).
2. **Backend:** rota de upload de vídeo que valida duração (limite definido) e gera thumbnail automática via ffmpeg; salve vídeo e thumb no Storage.
3. **Frontend:** player HTML5 nativo no `PostCard` quando o post for vídeo, e barra de progresso de upload no `CreatePostModal` (`CreatePostModal.jsx:78`).
4. **Validar:** subir um vídeo curto gera thumbnail, mostra progresso e toca no feed; vídeo acima do limite é recusado com mensagem clara.

---

## ⚪ P6 — Refactors de organização `(opcional, baixo risco)`

> Isto **não é bug** — o app funciona. São lições de organização. Faça se sobrar tempo; cada um em commit separado.

1. Extrair componentes reutilizáveis `Navbar`, `Button`, `Modal` (hoje inline em `HomePage.jsx:182` e classes em `App.css:190`).
2. Criar `authService.js` e `messageService.js` no frontend, tirando as chamadas soltas de `ChatPage.jsx` e das páginas de auth.
3. Mover a edição de perfil do `authController` (`:145`,`:159`) para o `userController`.

---

## ✅ Passo final — Regenerar o checklist com tudo ✅

Depois de concluir os blocos, **reescreva o `STATUS-PROJETO.md`** refletindo o estado real agora:

1. Refaça o **checklist** de todas as fases. Cada item resolvido vira `[x] ✅` com a referência `arquivo:linha` nova que prova a implementação.
2. Se algum item ficou de fora de propósito (ex.: um refactor de P6, ou o `interactionController` virou dívida técnica), marque-o honestamente e explique numa linha — **não marque ✅ o que não foi feito**.
3. Atualize a **tabela-resumo**. A meta é zerar ⚠️ e ❌ das Fases 1–3; se sobrar algo, deve ser só dívida consciente de P6.
4. Acrescente uma seção **"O que mudou nesta rodada"** listando os commits feitos, em ordem.
5. No chat, mostre só a **tabela-resumo final** + a lista de commits. O detalhe fica no arquivo.

> Lembrete final pro relatório: avise de novo que a chave do Supabase precisa ser **rotacionada** no painel (P0).