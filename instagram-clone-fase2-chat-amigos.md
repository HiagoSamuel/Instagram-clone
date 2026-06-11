# 📸 Instagram Clone — Fase 2: Amizades + Chat em Tempo Real

> **Para:** Desenvolvedor intermediário em React e Node.js
> **Agente de código:** OpenAI Codex / Cursor / Claude Code
> **Pré-requisito:** Fase 1 concluída (auth, feed, perfil, DMs básicos)
> **Objetivo:** Implementar o sistema de amizades e um chat funcional entre amigos — primeiro com polling, depois com WebSocket.

---

## 🧠 Visão Geral da Fase 2

Esta fase é dividida em **3 módulos principais**:

| Módulo | O que faz |
|---|---|
| **M1 — Amizades** | Seguir / aceitar amizade, ver amigos, bloquear acesso a conteúdo de não-amigos |
| **M2 — Chat v1 (Polling)** | Chat funcional entre amigos usando polling a cada 30s |
| **M3 — Chat v2 (WebSocket)** | Migração do chat para tempo real com WebSocket |

---

## 📚 Módulo 1 — Sistema de Amizades

### 💡 Como funciona (explicação para o estudante)

Amizade no Instagram funciona de forma assimétrica: você pode **seguir** alguém sem que eles te sigam de volta. Nesta versão, vamos criar um modelo **simétrico** (como o Facebook): um usuário envia uma solicitação, o outro aceita, e só então os dois se tornam amigos.

Isso é importante porque:
- Apenas amigos verão as publicações um do outro no feed
- Apenas amigos poderão iniciar um chat
- Isso protege a privacidade dos usuários

### 🗃️ Banco de dados — Supabase

Execute no SQL Editor do Supabase:

```sql
-- Tabela de amizades
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

-- Índices para performance
CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX idx_friendships_status ON friendships(status);
```

> **Por que usar `status` em vez de tabelas separadas?**
> Uma única tabela com status é mais simples de manter. O status `pending` significa solicitação enviada, `accepted` significa amigos, e `blocked` significa que um usuário bloqueou o outro.

### 🔌 Backend — Rotas de Amizade (`/api/friendships`)

Crie o arquivo `src/routes/friendshipRoutes.js`:

```
POST   /api/friendships/request/:userId   → enviar solicitação
PUT    /api/friendships/accept/:requesterId → aceitar solicitação
DELETE /api/friendships/:userId            → desfazer amizade / cancelar solicitação
GET    /api/friendships                    → listar meus amigos (status: accepted)
GET    /api/friendships/pending            → listar solicitações recebidas
GET    /api/friendships/status/:userId     → checar status com um usuário específico
```

**Crie o arquivo `src/controllers/friendshipController.js`:**

```javascript
// PROMPT PARA O AGENTE:
// Crie um controller Express com as seguintes funções:
//
// sendRequest(req, res):
//   - Recebe userId na URL (o usuário que vai receber a solicitação)
//   - req.user.id é o usuário logado (vem do middleware de autenticação JWT)
//   - Verifica se já existe uma amizade (em qualquer status) entre os dois
//   - Se não existir, insere na tabela friendships com status = 'pending'
//   - Retorna 201 com a friendship criada
//
// acceptRequest(req, res):
//   - Recebe requesterId na URL (quem enviou a solicitação)
//   - Atualiza a friendship onde requester_id = requesterId E addressee_id = req.user.id
//   - Muda status de 'pending' para 'accepted'
//   - Retorna 200 com a friendship atualizada
//
// removeFriendship(req, res):
//   - Deleta a friendship entre req.user.id e o userId da URL (em qualquer direção)
//   - Use OR na query: (requester_id = A AND addressee_id = B) OR (requester_id = B AND addressee_id = A)
//   - Retorna 204
//
// listFriends(req, res):
//   - Busca todas as friendships com status = 'accepted' envolvendo req.user.id
//   - Retorna os dados do outro usuário (não o próprio logado)
//   - JOIN com a tabela users para trazer nome, avatar, username
//
// listPending(req, res):
//   - Busca friendships onde addressee_id = req.user.id E status = 'pending'
//   - Retorna dados do requester (JOIN com users)
//
// getFriendshipStatus(req, res):
//   - Busca a friendship entre req.user.id e userId da URL
//   - Retorna: { status: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'blocked' }
//
// Use a conexão com o banco que já está configurada no projeto (pool do pg ou cliente Supabase)
// Todos os endpoints são protegidos pelo middleware authenticateToken
```

### 🛡️ Protegendo o Feed — só ver posts de amigos

No `postController.js`, modifique a função `getFeed`:

```javascript
// PROMPT PARA O AGENTE:
// Modifique a função getFeed no postController para:
//
// 1. Buscar os IDs de todos os amigos do usuário logado (status = 'accepted' na tabela friendships)
// 2. Incluir também o próprio ID do usuário logado
// 3. Filtrar os posts para retornar apenas posts onde author_id está nessa lista de IDs
// 4. Manter a paginação que já existe (limit e offset)
//
// Exemplo de query SQL:
// SELECT posts.*, users.username, users.avatar_url
// FROM posts
// JOIN users ON posts.author_id = users.id
// WHERE posts.author_id = ANY($1)  -- $1 é o array de IDs amigos + próprio
// ORDER BY posts.created_at DESC
// LIMIT $2 OFFSET $3
```

### 🎨 Frontend — Componentes de Amizade

**Crie `src/components/FriendButton.jsx`:**

```javascript
// PROMPT PARA O AGENTE:
// Crie um componente React chamado FriendButton que recebe a prop `userId` (ID do usuário do perfil visitado)
//
// O componente deve:
// 1. No mount, chamar GET /api/friendships/status/:userId para saber o status atual
// 2. Renderizar um botão diferente para cada status:
//    - 'none'             → botão azul "Adicionar amigo"
//    - 'pending_sent'     → botão cinza desabilitado "Solicitação enviada"
//    - 'pending_received' → botão verde "Aceitar solicitação"
//    - 'accepted'         → botão vermelho "Desfazer amizade"
// 3. Ao clicar, chamar a API correspondente e atualizar o status local
// 4. Mostrar loading durante a chamada à API
// 5. Tratar erros com uma mensagem simples (ex: toast ou alert)
//
// Use useState para: status, loading, error
// Use useEffect para buscar o status inicial
// Use axios (já configurado no projeto)
```

**Crie `src/pages/FriendRequestsPage.jsx`:**

```javascript
// PROMPT PARA O AGENTE:
// Crie uma página React que lista as solicitações de amizade pendentes recebidas
//
// Comportamento:
// 1. No mount, chamar GET /api/friendships/pending
// 2. Para cada solicitação, mostrar: avatar do usuário, nome, username
// 3. Dois botões: "Aceitar" (verde) e "Recusar" (cinza/vermelho)
// 4. Ao aceitar: chamar PUT /api/friendships/accept/:requesterId e remover da lista
// 5. Ao recusar: chamar DELETE /api/friendships/:userId e remover da lista
// 6. Se não houver solicitações, mostrar mensagem: "Nenhuma solicitação pendente"
//
// Estilo: parecido com a seção de notificações do Instagram
// Adicionar este link no menu de navegação com um badge numérico se houver pendências
```

---

## 📚 Módulo 2 — Chat v1: Polling

### 💡 Como funciona o Polling (explicação para o estudante)

**Polling** é a técnica mais simples para simular "tempo real": o navegador faz uma requisição ao servidor de tempos em tempos perguntando "tem mensagem nova?".

```
Navegador                    Servidor
    |                            |
    |--- GET /messages --------> |  (a cada 30 segundos)
    |<-- resposta com msgs -----|
    |                            |
    |--- GET /messages --------> |  (30 segundos depois)
    |<-- resposta com msgs -----|
```

**Vantagens:** simples de implementar, funciona em qualquer hospedagem.
**Desvantagens:** não é instantâneo, consome banda mesmo quando não há mensagens novas.

É uma ótima forma de começar antes de migrar para WebSocket.

### 🗃️ Banco de dados — Tabela de Mensagens

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- conversation_id é gerado de forma determinística a partir dos dois IDs
-- Exemplo: MENOR_ID:MAIOR_ID → garante que A→B e B→A usam o mesmo ID de conversa

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at);
```

> **Dica do conversation_id:** Para não criar uma tabela de conversas separada, gere o `conversation_id` concatenando os dois IDs em ordem alfabética no backend:
> ```javascript
> const conversationId = [userId1, userId2].sort().join(':');
> ```
> Assim, qualquer busca por mensagens entre A e B sempre usa o mesmo ID.

### 🔌 Backend — Rotas de Mensagens

```
GET  /api/messages/:friendId              → buscar histórico com um amigo
POST /api/messages/:friendId              → enviar mensagem
GET  /api/messages/:friendId/new?after=   → buscar apenas mensagens novas (polling)
GET  /api/conversations                   → listar todas as conversas
PUT  /api/messages/:friendId/read         → marcar como lida
```

**Crie `src/controllers/messageController.js`:**

```javascript
// PROMPT PARA O AGENTE:
// Crie um controller Express para mensagens com as seguintes funções:
//
// getHistory(req, res):
//   - Recebe friendId na URL
//   - VALIDAÇÃO: verificar se req.user.id e friendId são amigos (status = 'accepted' na tabela friendships)
//   - Se não forem amigos, retornar 403: "Vocês não são amigos"
//   - Se forem amigos, buscar as últimas 50 mensagens onde:
//     (sender_id = user E receiver_id = friend) OU (sender_id = friend E receiver_id = user)
//   - Ordenar por created_at ASC (mais antigas primeiro)
//   - Retornar array de mensagens
//
// sendMessage(req, res):
//   - Recebe friendId na URL e content no body
//   - VALIDAÇÃO: verificar amizade (igual ao getHistory)
//   - VALIDAÇÃO: content não pode ser vazio
//   - Gerar conversationId = [req.user.id, friendId].sort().join(':')
//   - Inserir na tabela messages
//   - Retornar 201 com a mensagem criada
//
// getNewMessages(req, res):
//   - Recebe friendId na URL e after (timestamp ISO) na query string
//   - Buscar mensagens entre os dois usuários onde created_at > after
//   - Retornar apenas as mensagens novas
//   - Este endpoint será chamado pelo polling a cada 30 segundos
//
// listConversations(req, res):
//   - Buscar a última mensagem de cada conversa envolvendo req.user.id
//   - Para cada conversa, trazer: dados do outro usuário, última mensagem, quantidade de não lidas
//   - Ordenar pela mais recente
```

### 🎨 Frontend — Chat com Polling

**Crie `src/pages/ChatPage.jsx`:**

```javascript
// PROMPT PARA O AGENTE:
// Crie uma página de chat React com polling. Esta página recebe friendId via useParams()
//
// ESTRUTURA DA TELA (igual ao Instagram DM):
// - Header: avatar + nome do amigo + botão voltar
// - Área de mensagens (scrollável, flex-direction: column)
//   - Minhas mensagens: alinhadas à direita, fundo azul
//   - Mensagens do amigo: alinhadas à esquerda, fundo cinza
//   - Mostrar horário em cada mensagem
// - Footer: input de texto + botão enviar
//
// LÓGICA DE POLLING:
// 1. No mount: chamar GET /api/messages/:friendId para carregar histórico
// 2. Salvar o created_at da última mensagem em uma ref (useRef)
// 3. Configurar setInterval a cada 30.000ms (30 segundos) para chamar:
//    GET /api/messages/:friendId/new?after=ULTIMO_TIMESTAMP
// 4. Se retornar mensagens novas, adicionar ao final do estado
// 5. Atualizar a ref com o novo último timestamp
// 6. No unmount (useEffect cleanup): limpar o interval com clearInterval
// 7. Fazer auto-scroll para o final quando chegar mensagem nova (useRef no div final + scrollIntoView)
//
// ENVIO DE MENSAGEM:
// 1. Ao submeter o form (Enter ou botão), chamar POST /api/messages/:friendId
// 2. Adicionar a mensagem enviada imediatamente no estado (sem esperar o polling)
// 3. Limpar o input
//
// Use useState: messages[], inputText, loading, sending
// Use useRef: lastMessageTime, messagesEndRef, intervalRef
//
// IMPORTANTE: limpe sempre o interval no return do useEffect para não vazar memória
```

---

## 📚 Módulo 3 — Chat v2: WebSocket

### 💡 Como funciona o WebSocket (explicação para o estudante)

Com polling, o navegador fica perguntando "tem novidade?". Com WebSocket, abrimos uma **conexão permanente** bidirecional: o servidor avisa o cliente quando há mensagem nova, sem o cliente precisar perguntar.

```
Polling (v1):                    WebSocket (v2):
Navegador    Servidor            Navegador    Servidor
    |            |                   |            |
    |-- GET? --> |                   |== CONEXÃO ==|  (1 vez, persiste)
    |<-- [] -----|                   |            |
    |  (30s)     |                   |            |
    |-- GET? --> |                   |  (msg nova)|
    |<-- [msg]---|                   |<-- PUSH ---|  (instantâneo!)
    |  (30s)     |                   |            |
    |-- GET? --> |                   |-- SEND --> |
    |<-- [] -----|                   |            |
```

**Vantagens:** instantâneo, menos consumo de rede quando não há mensagens.
**Desvantagens:** requer suporte na hospedagem e é um pouco mais complexo de implementar.

### ⚠️ Verificando Suporte a WebSocket nas Hospedagens

Antes de implementar, o agente deve verificar se Vercel e Railway suportam WebSocket.

**Prompt de verificação para o agente:**

```
ATENÇÃO: Antes de implementar WebSocket, verifique o seguinte:

1. RAILWAY (backend):
   Railway suporta WebSocket nativamente. Conexões persistentes funcionam sem configuração extra.
   Confirme que a variável de ambiente PORT está sendo usada: process.env.PORT || 3001
   O servidor WebSocket deve ouvir na mesma porta do Express.

2. VERCEL (frontend):
   A Vercel é uma plataforma serverless — isso significa que o FRONTEND (React) roda no
   navegador do usuário, não em um servidor. Portanto, o cliente WebSocket (socket.io-client)
   roda 100% no browser e não tem nenhuma limitação. ✅

   ATENÇÃO: Vercel Serverless Functions (API Routes do Next.js) NÃO suportam WebSocket.
   Mas como nosso backend está no Railway, isso não é um problema aqui.

3. SE O BACKEND ESTIVESSE EM PLATAFORMA SEM SUPORTE A WEBSOCKET:
   Alternativas que funcionam em serverless:
   a) Serviço externo: Pusher (pusher.com) — gratuito até 200.000 mensagens/dia
      - O backend envia mensagens pelo SDK do Pusher
      - O frontend se conecta direto ao Pusher via SDK
      - Zero configuração de WebSocket no seu servidor
   b) Ably (ably.com) — similar ao Pusher, gratuito até 6 milhões de mensagens/mês
   c) Supabase Realtime — já que usamos Supabase, podemos usar o canal Realtime deles
      para escutar mudanças na tabela messages em tempo real (sem precisar de socket.io)

CONCLUSÃO para este projeto: Railway + Socket.io é a escolha certa. Prossiga.
```

### 📦 Instalação das dependências

**Backend:**
```bash
# PROMPT PARA O AGENTE:
# No diretório do backend, instale:
npm install socket.io

# Socket.io é a biblioteca mais popular para WebSocket em Node.js
# Ela adiciona funcionalidades extras sobre o WebSocket nativo:
# - Reconexão automática
# - Salas (rooms) para agrupar conexões
# - Fallback para polling se WebSocket não estiver disponível
```

**Frontend:**
```bash
# PROMPT PARA O AGENTE:
# No diretório do frontend, instale:
npm install socket.io-client
```

### 🔌 Backend — Configurando o Socket.io

**Modifique `src/server.js` (ou `index.js`):**

```javascript
// PROMPT PARA O AGENTE:
// Modifique o arquivo principal do servidor para integrar o Socket.io.
//
// PASSO A PASSO:
//
// 1. Importe os módulos necessários:
//    const http = require('http');
//    const { Server } = require('socket.io');
//
// 2. Crie um servidor HTTP a partir do app Express:
//    const server = http.createServer(app);
//    (Antes você provavelmente usava app.listen() diretamente)
//
// 3. Crie a instância do Socket.io com CORS configurado:
//    const io = new Server(server, {
//      cors: {
//        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
//        methods: ['GET', 'POST']
//      }
//    });
//
// 4. Middleware de autenticação para Socket.io:
//    Antes de aceitar a conexão, valide o token JWT enviado pelo cliente.
//    O cliente vai enviar o token assim: socket.handshake.auth.token
//    Use a mesma lógica do seu middleware authenticateToken do Express.
//    Se o token for inválido, chame next(new Error('Unauthorized'))
//
// 5. Evento de conexão:
//    io.on('connection', (socket) => {
//      const userId = socket.user.id; // vem do middleware acima
//
//      // Cada usuário entra em uma "sala" com seu próprio ID
//      // Assim podemos mandar mensagens direto para ele
//      socket.join(`user:${userId}`);
//
//      console.log(`Usuário ${userId} conectado`);
//
//      // Evento: cliente envia uma mensagem
//      socket.on('send_message', async (data) => {
//        // data = { receiverId, content }
//        // 1. Validar que são amigos (mesma lógica do messageController)
//        // 2. Salvar a mensagem no banco de dados
//        // 3. Emitir o evento 'new_message' para o destinatário
//        //    io.to(`user:${data.receiverId}`).emit('new_message', mensagemSalva)
//        // 4. Emitir confirmação de volta para o remetente
//        //    socket.emit('message_sent', mensagemSalva)
//      });
//
//      socket.on('disconnect', () => {
//        console.log(`Usuário ${userId} desconectado`);
//      });
//    });
//
// 6. Troque app.listen por server.listen:
//    server.listen(process.env.PORT || 3001, () => {
//      console.log('Servidor rodando');
//    });
//
// 7. Exporte io para usar em outros arquivos se necessário:
//    module.exports = { app, io };
```

### 🎨 Frontend — Contexto de Socket

**Crie `src/contexts/SocketContext.jsx`:**

```javascript
// PROMPT PARA O AGENTE:
// Crie um Context React para gerenciar a conexão WebSocket globalmente.
// Isso evita criar múltiplas conexões ao navegar entre páginas.
//
// O SocketProvider deve:
// 1. Importar: import { io } from 'socket.io-client'
// 2. Criar a conexão UMA ÚNICA VEZ quando o usuário estiver logado:
//    const socket = io(process.env.REACT_APP_API_URL, {
//      auth: { token: localStorage.getItem('token') }
//    });
// 3. Armazenar a instância do socket no useRef (não useState, para não re-renderizar)
// 4. Expor via contexto: { socket, isConnected }
// 5. Escutar o evento 'connect' para atualizar isConnected = true
// 6. Escutar o evento 'disconnect' para atualizar isConnected = false
// 7. No cleanup (quando o usuário deslogar), chamar socket.disconnect()
//
// Envolva o App.jsx com <SocketProvider> apenas quando o usuário estiver autenticado.
// Use o AuthContext que já existe para saber se o usuário está logado.
//
// Exporte também um hook: export const useSocket = () => useContext(SocketContext)
```

**Atualize `src/pages/ChatPage.jsx` para usar WebSocket:**

```javascript
// PROMPT PARA O AGENTE:
// Modifique o ChatPage.jsx para trocar o polling pelo WebSocket.
//
// MUDANÇAS EM RELAÇÃO À VERSÃO DE POLLING:
//
// 1. Importe o hook: import { useSocket } from '../contexts/SocketContext'
//    const { socket } = useSocket();
//
// 2. REMOVA o setInterval e o clearInterval — não precisamos mais deles.
//
// 3. No useEffect, registre os eventos do socket:
//    socket.on('new_message', (message) => {
//      // Verificar se a mensagem é desta conversa
//      if (message.sender_id === friendId || message.receiver_id === friendId) {
//        setMessages(prev => [...prev, message]);
//        // Auto-scroll para o final
//      }
//    });
//
//    // MUITO IMPORTANTE: remover o listener no cleanup para não duplicar
//    return () => {
//      socket.off('new_message');
//    };
//
// 4. Na função de envio de mensagem, use o socket em vez de axios:
//    socket.emit('send_message', { receiverId: friendId, content: inputText });
//    socket.once('message_sent', (message) => {
//      setMessages(prev => [...prev, message]);
//    });
//
// 5. Mantenha o carregamento inicial do histórico via HTTP (GET /api/messages/:friendId)
//    WebSocket é para mensagens em tempo real, não para carregar histórico.
//
// O restante da UI (layout, scroll, input) permanece igual.
```

---

## ✅ Checklist Geral da Fase 2

### Módulo 1 — Amizades
- [ ] Criar tabela `friendships` no Supabase
- [ ] Criar `friendshipController.js` com todas as funções
- [ ] Criar `friendshipRoutes.js` e registrar no server
- [ ] Modificar `getFeed` para filtrar apenas posts de amigos
- [ ] Criar componente `FriendButton.jsx`
- [ ] Criar página `FriendRequestsPage.jsx`
- [ ] Adicionar badge de notificação no navbar para solicitações pendentes
- [ ] Adicionar `FriendButton` na `ProfilePage`

### Módulo 2 — Chat com Polling
- [ ] Criar tabela `messages` no Supabase
- [ ] Criar `messageController.js` com todas as funções
- [ ] Criar `messageRoutes.js` e registrar no server
- [ ] Criar `ChatPage.jsx` com polling a cada 30s
- [ ] Criar `ConversationsPage.jsx` (lista de conversas)
- [ ] Adicionar link para conversas no navbar

### Módulo 3 — Migração para WebSocket
- [ ] Instalar `socket.io` no backend
- [ ] Instalar `socket.io-client` no frontend
- [ ] Configurar servidor HTTP + Socket.io em `server.js`
- [ ] Adicionar middleware de autenticação JWT no socket
- [ ] Implementar evento `send_message` no servidor
- [ ] Criar `SocketContext.jsx` no frontend
- [ ] Envolver o App com `SocketProvider`
- [ ] Atualizar `ChatPage.jsx` para usar socket em vez de polling
- [ ] Testar envio e recebimento em tempo real

---

## 🧪 Como Testar

### Teste do sistema de amizades:
1. Crie 2 contas (usuário A e usuário B)
2. Como A, acesse o perfil de B e clique em "Adicionar amigo"
3. Como B, acesse a página de solicitações e aceite
4. Verifique que agora os posts de A aparecem no feed de B e vice-versa
5. Verifique que um terceiro usuário C não vê os posts de A ou B

### Teste do chat com polling:
1. Como A, abra o chat com B
2. Como B, abra outro navegador e abra o chat com A
3. Como B, envie uma mensagem
4. Aguarde até 30 segundos e verifique que A recebeu

### Teste do WebSocket:
1. Repita o teste acima
2. A mensagem deve aparecer **instantaneamente** (< 1 segundo)
3. Verifique no console do navegador: não deve haver requisições HTTP periódicas

---

## 🚀 Dicas Finais para o Agente

- **Sempre valide a amizade** antes de executar qualquer operação de mensagem
- **Não retorne dados de usuários que não são amigos** — proteção de privacidade
- **No WebSocket, lembre-se do cleanup**: sempre `socket.off('evento')` no return do useEffect, ou você vai acumular listeners e duplicar mensagens
- **O histórico de mensagens sempre vem via HTTP** (GET /api/messages/:friendId). O socket só envia mensagens novas em tempo real
- **Variáveis de ambiente**: adicione `REACT_APP_API_URL` no Vercel e `FRONTEND_URL` no Railway antes do deploy
