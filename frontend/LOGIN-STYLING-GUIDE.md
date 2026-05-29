# Login Styling Guide

Este guia mostra como estilizar a tela de login para ficar parecida com o layout do Instagram, mas sem o botão de login via Facebook.

## Objetivo

Transformar a página de login em uma tela dividida:
- lado esquerdo com ilustração, logo e texto de boas-vindas
- lado direito com o formulário de login
- layout responsivo para celular
- sem o botão de login via Facebook

## Arquivos a editar

- `frontend/src/pages/Login/LoginPage.jsx`
- `frontend/src/App.css` ou `frontend/src/pages/Login/LoginPage.css`

## Passo 1: ajustar a estrutura do JSX

Abra `frontend/src/pages/Login/LoginPage.jsx` e altere o retorno do componente para ter duas áreas principais:

1. `login-screen`
2. `login-hero`
3. `login-card`

Exemplo de estrutura:

```jsx
export default function LoginPage() {
  // ... estado e lógica

  return (
    <div className="login-screen">
      <section className="login-hero">
        <div className="hero-brand">
          <img src="/instagram-logo.png" alt="Instagram" />
          <h1>Veja momentos do dia a dia dos seus amigos próximos.</h1>
        </div>
        <div className="hero-visual">
          {/* coloque aqui uma imagem ou composição visual */}
        </div>
      </section>

      <section className="login-card">
        <div className="login-box">
          <h2>Entrar no Instagram</h2>
          <form className="auth-form" onSubmit={handleSubmit}>
            <input type="email" name="email" placeholder="Email" />
            <input type="password" name="password" placeholder="Senha" />
            <button type="submit">Entrar</button>
          </form>
          <p className="auth-help">Esqueceu a senha?</p>
        </div>
      </section>
    </div>
  )
}
```

> Observação: remova o bloco de `Entrar com o Facebook` e mantenha apenas o login por email/senha.

## Passo 2: criar ou atualizar o CSS

Se quiser manter tudo em `App.css`, adicione as regras a seguir. Se preferir separar, crie `frontend/src/pages/Login/LoginPage.css` e importe no topo do componente `LoginPage.jsx`.

### CSS sugerido

```css
.login-screen {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 40px;
  align-items: center;
  padding: 40px;
  background: radial-gradient(circle at top left, rgba(79, 70, 229, 0.18), transparent 35%),
    linear-gradient(180deg, #0f172a 0%, #111827 100%);
  color: #ffffff;
}

.login-hero {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.hero-brand img {
  max-width: 140px;
}

.hero-brand h1 {
  margin: 0;
  font-size: clamp(2rem, 3vw, 3.5rem);
  line-height: 1.05;
  font-weight: 700;
}

.hero-visual {
  position: relative;
  min-height: 420px;
  background: radial-gradient(circle at top, rgba(99, 102, 241, 0.16), transparent 40%);
  border-radius: 32px;
  overflow: hidden;
  box-shadow: 0 40px 80px rgba(15, 23, 42, 0.35);
}

.hero-visual::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url('/login-hero.png') center/cover no-repeat;
  opacity: 0.9;
}

.login-card {
  display: grid;
  place-items: center;
}

.login-box {
  width: min(420px, 100%);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 32px;
  padding: 36px;
  backdrop-filter: blur(18px);
}

.login-box h2 {
  margin: 0 0 24px;
  font-size: 1.6rem;
  color: #ffffff;
}

.auth-form {
  display: grid;
  gap: 18px;
}

.auth-form input {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 16px;
  padding: 16px 18px;
  background: rgba(15, 23, 42, 0.6);
  color: #f8fafc;
}

.auth-form input::placeholder {
  color: rgba(248, 250, 252, 0.65);
}

.auth-form button {
  width: 100%;
  border-radius: 16px;
  padding: 14px 18px;
  background: #4f46e5;
  color: #ffffff;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.auth-form button:hover {
  background: #4338ca;
}

.auth-help {
  margin-top: 18px;
  color: rgba(248, 250, 252, 0.8);
  text-align: center;
}

@media (max-width: 980px) {
  .login-screen {
    grid-template-columns: 1fr;
    padding: 24px;
  }

  .login-hero {
    order: 2;
  }

  .login-card {
    order: 1;
  }
}

@media (max-width: 640px) {
  .login-screen {
    padding: 18px;
  }

  .login-box {
    padding: 24px;
  }

  .hero-brand h1 {
    font-size: 2rem;
  }
}
```

> Se você não tiver uma imagem para o lado esquerdo, use um gradiente ou um componente de `div` com bordas arredondadas.

## Passo 3: remover o login via Facebook

No `LoginPage.jsx`, apague ou comente o bloco que contém o botão `Entrar com o Facebook`.

Mantenha apenas:
- campos de email e senha
- botão `Entrar`
- link `Esqueceu a senha?`
- link para cadastro, se quiser

## Passo 4: testar o layout

1. Salve as alterações.
2. Execute o frontend com `npm run dev` no diretório `frontend`.
3. Abra o navegador e acesse a página de login.
4. Ajuste os espaçamentos e cores até ficar parecido com a referência.

## Passo 5: sugestões finais

- use `background: linear-gradient` no corpo se quiser um fundo escuro degradê.
- mantenha `border-radius` grande para o card e para a área visual.
- use `box-shadow` leve no login card para destacá-lo.
- use `color: #ffffff` e placeholders claros.
- na versão mobile, empilhe a hero section abaixo do card.

## Resultado esperado

- uma tela dividida em duas colunas no desktop
- lado esquerdo com mensagem e visual gráfico
- lado direito com card de login clean
- sem botão de login via Facebook
- visual moderno, escuro e suave
