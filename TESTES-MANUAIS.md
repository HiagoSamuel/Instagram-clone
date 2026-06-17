# Testes Manuais - Fase 2 e WebSocket

Use duas contas diferentes: Usuario A e Usuario B. Abra cada conta em um navegador/aba anonima diferente para evitar compartilhar sessao.

## 1. Amizades

1. Entre como Usuario A.
2. Busque o Usuario B em `/search`.
3. Abra o perfil do Usuario B e clique em `Adicionar amigo`.
4. Entre como Usuario B.
5. Abra `Solicitacoes`.
6. Aceite a solicitacao do Usuario A.
7. Abra o perfil do Usuario A.

Resultado esperado:
- O botao mostra estado de amizade aceita.
- Os posts privados do Usuario A aparecem para o Usuario B.
- Um terceiro usuario sem amizade nao ve esses posts.

## 2. Chat em tempo real

1. Entre como Usuario A em uma aba.
2. Entre como Usuario B em outra aba.
3. Garanta que A e B sao amigos.
4. Com o Usuario A, abra `/chat/:idDoUsuarioB`.
5. Com o Usuario B, abra `/chat/:idDoUsuarioA`.
6. Envie uma mensagem do Usuario A para o Usuario B.

Resultado esperado:
- A mensagem aparece para o Usuario B em menos de 1 segundo.
- A mensagem fica persistida ao recarregar a pagina.
- O console nao deve mostrar erro de token ou conexao recusada.

## 3. Lista de conversas e badge global

1. Entre como Usuario A e deixe aberta a pagina `Mensagens`.
2. Entre como Usuario B em outra aba e envie uma mensagem para A.
3. Volte para a aba do Usuario A.

Resultado esperado:
- A conversa com B sobe para o topo.
- O contador de nao lidas aparece na conversa.
- O badge no link `Mensagens` aumenta.
- Ao abrir a conversa, o badge diminui imediatamente.

## 4. Posts, comentarios e curtidas em tempo real

1. Entre como Usuario A e Usuario B em abas separadas.
2. Garanta que sao amigos.
3. Com B olhando o feed, crie um post como A.
4. Curta, descurta e comente no post a partir de uma das contas.
5. Apague o comentario e depois o post.

Resultado esperado:
- O novo post aparece no feed/perfil sem refresh.
- Curtidas atualizam a contagem sem duplicar para quem clicou.
- Comentarios chegam sem refresh e exibem badge se a aba de comentarios estiver fechada.
- Comentarios e posts apagados somem sem refresh.

## 5. Reconexao

1. Abra um chat entre A e B.
2. Derrube a internet do navegador ou bloqueie temporariamente a rede nas DevTools.
3. Envie uma mensagem pela outra conta.
4. Restaure a internet.

Resultado esperado:
- A faixa mostra estado offline/reconectando.
- Ao reconectar, aparece estado sincronizado.
- Mensagens recebidas durante a queda aparecem sem recarregar a pagina.
