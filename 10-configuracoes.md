# Configurações do Instagram Clone

## Objetivo
Criar um botão de configurações visível apenas após login, posicionado no canto superior direito da tela inicial. O botão deve usar um ícone de engrenagem e abrir um painel ou modal com opções de configuração.

## Onde adicionar
- `frontend/src/App.jsx`
- `frontend/src/pages/Home/HomePage.jsx`
- `frontend/src/components` (novo componente `SettingsMenu` ou `SettingsModal`)
- `frontend/src/context/AuthContext.jsx` (para controlar estado de usuário)
- `frontend/src/App.css` ou CSS local para estilo

## Passos gerais

1. Criar o ícone de engrenagem
   - Use um botão `button` com `aria-label="Configurações"`
   - Coloque o botão no canto superior direito da página inicial dentro de `HomePage`
   - Exiba somente se `user` estiver logado

2. Criar o componente de configurações
   - Nome sugerido: `frontend/src/components/SettingsMenu/SettingsMenu.jsx`
   - Ele pode ser um dropdown simples ou modal
   - O conteúdo deve incluir:
     - Modo claro / modo escuro
     - Filtração de palavras
     - Alterar foto de perfil
     - Adicionar bio ao perfil
     - Alterar apelido

3. Implementar visibilidade condicionada
   - No `HomePage`, importe `useAuth` e use `user` para exibir o botão
   - Exemplo:
     ```jsx
     const { user } = useAuth()
     return (
       {user && <SettingsMenu />}
     )
     ```

## Funcionalidades descritas

### 1. Modo claro e modo escuro

- Criar um estado global ou local para tema
- Opções:
  - usar `useState` no `SettingsMenu`
  - ou criar um `ThemeContext`
- Alterar classes na raiz (`body` ou `#root`) para aplicar estilos
- Definir variáveis CSS como `--bg`, `--surface`, `--text`, `--border`
- O botão de configurações deve mostrar um toggle para alternar entre temas

### 2. Filtração de palavras

- Crie um controle no painel de configurações para listar palavras proibidas
- O filtro deve ser funcional no envio de posts e nos comentários (se tiver comentários)
- Exemplo de implementação:
  - ao criar post, antes de enviar, aplicar:
    ```js
    const censored = blockedWords.reduce(
      (text, word) => text.replaceAll(word, '****'),
      caption
    )
    ```
  - ou recusar envio com mensagem de erro se o post contiver palavras bloqueadas
- Armazenar as palavras em estado local ou no contexto
- Se quiser persistir, usar `localStorage` no frontend ou backend

### 3. Alterar foto de perfil

- No painel de configurações, abra um input `type="file"`
- Reutilize o fluxo de upload do registro/registro de avatar
- Envie o arquivo para o backend com `multipart/form-data`
- Atualize o `user.avatar_url` no contexto após upload bem-sucedido
- Mostre prévia da nova foto antes de salvar, se desejar

### 4. Adicionar bio ao perfil

- Adicione um campo de texto `textarea` no painel de configurações
- Permita editar e salvar a bio do usuário
- Atualize o perfil do usuário no backend e no contexto frontend
- Exiba a bio no componente de perfil

### 5. Alterar apelido

- Crie um campo de texto separado para `nickname`
- Não deve ser nome verdadeiro, deve ser apelido mostrado em posts/perfil
- Atualize `user.username` ou um campo `user.nickname`
- Garanta que o backend aceite a alteração
- Mostre o apelido no feed e no perfil

## Exemplo de estrutura do painel

- Tema: [claro / escuro] toggle
- Palavra bloqueada: campo de texto + botão de adicionar
- Foto de perfil: upload + preview
- Bio: textarea + salvar
- Apelido: input + salvar

## Estilo sugerido
- Botão de engrenagem no canto superior direito de `HomePage`
- Use ícone simples `⚙️` ou svg de engrenagem
- Painel com fundo escuro translúcido e bordas arredondadas
- Texto claro em modo escuro

## Regras de acessibilidade
- Botão deve ter `aria-label="Configurações"`
- Se for modal, use `role="dialog"` e `aria-modal="true"`
- Modo claro/escuro deve ser fácil de ativar
- Inputs devem ter labels ou `aria-label`

## Observação
- Se houver um painel de configurações, ele deve ser carregado apenas após login
- Mantenha o estado do usuário e do tema sincronizados no `AuthContext` ou em um novo contexto
