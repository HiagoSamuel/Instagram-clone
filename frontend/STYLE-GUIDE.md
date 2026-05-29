# Guia de Estilo para o Instagram Clone

Este guia mostra como estilizar o projeto atual usando CSS simples e organizado. Ele foca nas classes que já existem no frontend e em como aplicar um visual mais agradável para a landing page, auth, feed, cards e modal.

## 1. Estrutura de estilo do projeto

- `frontend/src/index.css`: estilos globais, variáveis CSS e reset básico.
- `frontend/src/App.css`: estilos de layout e classes compartilhadas pela aplicação.
- Componentes e páginas podem usar classes CSS já presentes no JSX.

> Dica: mantenha variáveis `:root` em `index.css` e regras de layout em `App.css`.

## 2. Importante

- `frontend/src/main.jsx` já importa `./index.css`.
- `frontend/src/App.jsx` já importa `./App.css`.

Isso significa que você pode colocar estilos globais em `index.css` e regras de aplicativo em `App.css`.

## 3. Variáveis e reset global

No `frontend/src/index.css`, defina cores, tipografia e um reset simples:

```css
:root {
  --bg: #f7f7fb;
  --surface: #ffffff;
  --surface-strong: #f2f2f7;
  --text: #1f2937;
  --text-muted: #6b7280;
  --border: #e5e7eb;
  --primary: #2563eb;
  --primary-hover: #1d4ed8;
  --danger: #dc2626;
  --shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
  --radius: 24px;
  --radius-sm: 14px;
  --font: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: var(--font);
  background: var(--bg);
  color: var(--text);
}

button,
input,
textarea {
  font: inherit;
}

a {
  color: inherit;
  text-decoration: none;
}

img {
  max-width: 100%;
  display: block;
}
```

## 4. Estilo geral de botão

No `frontend/src/App.css`, crie classes de botão reutilizáveis:

```css
.button {
  border: none;
  cursor: pointer;
  border-radius: 999px;
  font-weight: 600;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.button-primary {
  background: var(--primary);
  color: white;
  padding: 12px 18px;
}

.button-primary:hover {
  background: var(--primary-hover);
}

.button-secondary {
  background: #edf2ff;
  color: var(--text);
  padding: 10px 16px;
}

.button-secondary:hover {
  background: #e0e7ff;
}

button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
```

## 5. Página de autenticação

As páginas de login e registro usam as classes:

- `auth-page`
- `auth-card`
- `auth-form`
- `auth-error`

Adicione estes estilos a `App.css`:

```css
.auth-page {
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: 32px;
  background: linear-gradient(180deg, #eef2ff 0%, #f8fafc 100%);
}

.auth-card {
  width: min(460px, 100%);
  padding: 36px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 32px;
  box-shadow: var(--shadow);
}

.auth-card h1 {
  margin: 0 0 24px;
  font-size: 28px;
}

.auth-form {
  display: grid;
  gap: 16px;
}

.auth-form input {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 14px 16px;
  background: #ffffff;
}

.auth-form button {
  width: 100%;
}

.auth-error {
  margin: 0;
  color: var(--danger);
  font-size: 0.95rem;
}

.auth-card p {
  margin: 20px 0 0;
  color: var(--text-muted);
}

.auth-card p a {
  color: var(--primary);
}
```

## 6. Estrutura da homepage

No `HomePage.jsx`, você tem:

- `home-page`
- `home-header`
- `home-actions`
- `feed-list`

Use estes estilos em `App.css`:

```css
.home-page {
  padding: 28px;
  max-width: 1140px;
  margin: 0 auto;
}

.home-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  margin-bottom: 28px;
}

.home-header h1 {
  margin: 0;
  font-size: 2rem;
}

.home-header p {
  margin: 8px 0 0;
  color: var(--text-muted);
}

.home-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.feed-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}
```

## 7. Cartão de post

Os posts usam estas classes:

- `post-card`
- `post-header`
- `post-author`
- `post-image`
- `post-actions`
- `post-caption`
- `post-time`

Adicione este CSS:

```css
.post-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 32px;
  box-shadow: var(--shadow);
  overflow: hidden;
}

.post-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px;
}

.post-author strong {
  display: block;
  color: var(--text-h);
}

.post-image {
  background: #f9fafb;
}

.post-image img {
  width: 100%;
  height: auto;
  display: block;
}

.post-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 16px 18px;
}

.post-actions button {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1.3rem;
}

.post-caption {
  padding: 0 18px 16px;
  color: var(--text);
  line-height: 1.5;
}

.post-time {
  padding: 0 18px 18px;
  color: var(--text-muted);
  font-size: 0.9rem;
}
```

## 8. Modal de criação de post

O modal usa:

- `modal-overlay`
- `modal-content`
- `modal-header`
- `modal-close`
- `modal-form`
- `modal-error`

Estilos sugeridos:

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: grid;
  place-items: center;
  padding: 24px;
  z-index: 50;
}

.modal-content {
  width: min(640px, 100%);
  background: var(--surface);
  border-radius: 28px;
  padding: 28px;
  box-shadow: var(--shadow);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.modal-close {
  border: none;
  background: transparent;
  font-size: 1.25rem;
  cursor: pointer;
}

.modal-form {
  display: grid;
  gap: 18px;
}

.modal-form label {
  display: grid;
  gap: 10px;
  text-align: left;
  font-weight: 600;
}

.modal-form input,
.modal-form textarea {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 14px 16px;
  background: #ffffff;
}

.modal-form textarea {
  min-height: 120px;
  resize: vertical;
}

.modal-error {
  color: var(--danger);
  margin: 0;
}

.modal-form button {
  justify-self: start;
}
```

## 9. Avatar

O componente `Avatar` provavelmente usa `img` simples. Você pode eleger um estilo global:

```css
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e5e7eb;
}
```

Se quiser, crie uma classe `avatar` e adicione no componente.

## 10. Layout responsivo

Para garantir que o app funcione bem em telas menores, adicione regras responsivas em `App.css`:

```css
@media (max-width: 860px) {
  .home-page {
    padding: 20px;
  }

  .home-header {
    flex-direction: column;
    align-items: stretch;
  }

  .home-actions {
    justify-content: stretch;
  }
}

@media (max-width: 520px) {
  .auth-card,
  .modal-content {
    padding: 22px;
  }
}
```

## 11. Como aplicar rapidamente

1. Abra `frontend/src/index.css`.
2. Substitua ou adicione as variáveis CSS e reset.
3. Abra `frontend/src/App.css`.
4. Substitua o conteúdo do arquivo pelo CSS do guia.
5. Salve e observe a interface no navegador.

## 12. Personalização rápida

- Troque `--primary` para a cor que quiser.
- Ajuste `border-radius` para um visual mais arredondado ou mais plano.
- Use gradientes suaves em `.auth-page` e `body` para dar contraste visual.

## 13. Próximos passos

- Se quiser, crie arquivos CSS separados por componente: `CreatePostModal.css`, `PostCard.css`, `AuthPage.css`.
- Para cada componente, importe o CSS no topo do arquivo JSX.
- Use `@media` e `grid-template-columns` para deixar o feed mais fluido.

---

Com esse guia, você consegue transformar o app em um layout moderno e consistente com poucas alterações. Se quiser, posso gerar também o CSS completo pronto para colar em `App.css` e `index.css`.