# Avatar Guide

Este guia mostra como criar e estilizar o componente `Avatar` para o seu Instagram Clone.

## 1. Objetivo

O `Avatar` deve renderizar uma imagem redonda do usuário. Ele precisa ser:

- responsivo ao tamanho (`size`)
- com fallback quando não há imagem
- estilizado com borda e `object-fit`
- fácil de reusar em vários componentes

## 2. Onde está o componente

Arquivo atual:

- `frontend/src/components/Avatar/Avatar.jsx`

## 3. O que fazer

### 3.1. Manter o componente simples

Use propriedades para controlar:

- `src`: URL da imagem
- `size`: tamanho em pixels
- `alt`: texto alternativo opcional

### 3.2. Criar uma classe CSS de avatar

Use uma classe como `.avatar` para aplicar borda, sombra e corte redondo.

### 3.3. Adicionar fallback de imagem

Quando `src` não existir, use uma imagem padrão ou inicial do usuário.

### 3.4. Deixar o CSS separado

Se preferir, crie um arquivo específico:

- `frontend/src/components/Avatar/Avatar.css`

Ou adicione as regras ao `App.css` se quiser manter tudo junto.

## 4. Exemplo de componente

No `frontend/src/components/Avatar/Avatar.jsx`, você pode usar:

```jsx
import './Avatar.css'

export default function Avatar({ src, size = 40, alt = 'Avatar' }) {
  return (
    <img
      className="avatar"
      src={src || '/default-avatar.png'}
      alt={alt}
      width={size}
      height={size}
    />
  )
}
```

> Observação: use `width` e `height` para manter a imagem quadrada.

## 5. Exemplo de CSS

No `frontend/src/components/Avatar/Avatar.css` ou em `App.css`:

```css
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(79, 70, 229, 0.15);
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);
}

.avatar.small {
  width: 32px;
  height: 32px;
}

.avatar.medium {
  width: 48px;
  height: 48px;
}

.avatar.large {
  width: 64px;
  height: 64px;
}
```

## 6. Como usar no `PostCard`

No `PostCard.jsx`, importe e use o `Avatar` assim:

```jsx
import Avatar from '../Avatar/Avatar'

// ...
<Avatar src={post.user.avatar_url} size={36} alt={`${post.user.username} avatar`} />
```

## 7. Melhorias possíveis

- criar um placeholder SVG caso a imagem falhe
- adicionar `loading="lazy"`
- aceitar `className` extra para customização
- renderizar iniciais quando não houver imagem

## 8. Próximo passo

1. Crie `Avatar.css` com os estilos acima.
2. Importe `./Avatar.css` dentro de `Avatar.jsx`.
3. Atualize `PostCard.jsx` para usar o novo componente.
4. Teste em tela pequena e em desktop.

Pronto! Depois disso, o avatar vai ficar consistente em todo o app, com bordas arredondadas e bom comportamento visual.