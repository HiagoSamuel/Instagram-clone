# Guia Rápido — Supabase Setup

## 1. Criar conta
1. Acesse https://supabase.com
2. Clique em "Sign Up"
3. Use email e crie senha (ou faça login com GitHub)

## 2. Criar projeto
1. Clique em "New Project"
2. Preencha:
   - **Project name**: `instagram-clone` (ou qualquer nome)
   - **Password**: crie uma senha forte
   - **Region**: escolha a mais próxima (ex: `South America - São Paulo`)
3. Clique em "Create new project"
4. Aguarde ~2 minutos até carregar

## 3. Pegar as credenciais
Após o projeto carregar:

1. Vá em **Settings** (engrenagem no canto inferior esquerdo)
2. Clique em **API**
3. Na seção "Project URL", copie a URL
   - Essa é sua `SUPABASE_URL`
   - Exemplo: `https://xxxxxxxxxx.supabase.co`

4. Na seção "Project API keys", procure por **Service Role** (não Anon)
   - Copie a chave completa
   - Essa é sua `SUPABASE_SERVICE_KEY`

## 4. Colocar no `.env`
Abra `backend/.env` e preencha:

```env
SUPABASE_URL=https://xxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=sua-chave-service-role-aqui
JWT_SECRET=minha-senha-super-secreta-123
PORT=3001
FRONTEND_URL=http://localhost:5173
```

## 5. Criar as tabelas no banco
1. Volte para o Supabase no dashboard
2. Clique em **SQL Editor** (à esquerda)
3. Clique em **New Query**
4. Cole o SQL abaixo:

```sql
-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(30) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de posts
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de curtidas
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Tabela de seguidores
CREATE TABLE IF NOT EXISTS followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Tabela de conversas
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- Tabela de mensagens
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

5. Clique em **Run** (play)

## 6. Criar bucket para fotos
1. Vá em **Storage** (à esquerda)
2. Clique em **Create a new bucket**
3. Nome: `posts`
4. Marque **Public bucket**
5. Clique em **Create bucket**

## 7. Testar o backend
Volte ao terminal e rode:
```bash
npm run dev
```

Se aparecer `🚀 Backend rodando na porta 3001`, funcionou!
