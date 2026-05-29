# Etapa Prática 1 — Iniciando o Projeto

Este arquivo orienta os primeiros passos práticos do Instagram Clone: criar a estrutura de pastas, configurar o frontend e o backend e instalar dependências.

## 1. Preparar o workspace
1. Abra a pasta do projeto no VS Code: `c:\Users\hiago\Documents\Hiago-projects\Instagram-clone`
2. Garanta que o Node.js esteja instalado na sua máquina.
3. Crie os diretórios principais:
   - `frontend/`
   - `backend/`

## 2. Inicializar o Git
1. No terminal, execute:
   ```bash
   git init
   ```
2. Crie um `.gitignore` com pelo menos:
   ```gitignore
   node_modules
   dist
   .env
   /.vite
   ```
3. Faça o primeiro commit após os arquivos básicos estarem criados.

## 3. Configurar o Frontend
### 3.1 Criar app React com Vite
1. Entre em `frontend/`:
   ```bash
   cd frontend
   ```
2. Crie o app com Vite:
   ```bash
   npm create vite@latest . -- --template react
   ```
3. Instale dependências básicas:
   ```bash
   npm install react-router-dom axios
   ```
4. Instale dependências de desenvolvimento caso use CSS Modules ou Tailwind:
   - Para CSS Modules não precisa extra
   - Para Tailwind:
     ```bash
     npm install -D tailwindcss postcss autoprefixer
     npx tailwindcss init -p
     ```

### 3.2 Estrutura inicial no frontend
Crie estas pastas em `frontend/src/`:
- `components/`
- `pages/`
- `context/`
- `services/`
- `hooks/`

### 3.3 Arquivos iniciais do frontend
Crie os arquivos básicos:
- `src/main.jsx`
- `src/App.jsx`
- `src/context/AuthContext.jsx`
- `src/hooks/useAuth.js`
- `src/services/api.js`

### 3.4 Configurar rotas e provider
No `src/App.jsx`, crie a lógica de rotas com `react-router-dom` e envolva a aplicação com `AuthProvider`.

## 4. Configurar o Backend
### 4.1 Inicializar Node.js
1. Entre em `backend/`:
   ```bash
   cd ../backend
   ```
2. Inicie o npm:
   ```bash
   npm init -y
   ```
3. Instale dependências:
   ```bash
   npm install express cors dotenv jsonwebtoken bcrypt @supabase/supabase-js multer
   npm install -D nodemon
   ```

### 4.2 Estrutura inicial do backend
Crie as pastas e arquivos:
- `src/app.js`
- `src/services/supabase.js`
- `src/controllers/`
- `src/routes/`
- `src/middlewares/`

### 4.3 Criar `package.json` scripts
No `backend/package.json`, adicione:
```json
"scripts": {
  "start": "node src/app.js",
  "dev": "nodemon src/app.js"
}
```

## 5. Configurar variáveis de ambiente
### Frontend `.env`
No `frontend/`, crie `.env` com:
```env
VITE_API_URL=http://localhost:3001/api
```

### Backend `.env`
No `backend/`, crie `.env` com:
```env
SUPABASE_URL=https://<sua-url>.supabase.co
SUPABASE_SERVICE_KEY=<sua-service-key>
JWT_SECRET=uma-senha-super-secreta
PORT=3001
FRONTEND_URL=http://localhost:5173
```

## 6. Testar a base inicial
### Frontend
1. Execute em `frontend/`:
   ```bash
   npm run dev
   ```
2. Abra o app e confirme que o React carrega.

### Backend
1. Execute em `backend/`:
   ```bash
   npm run dev
   ```
2. Confirme no terminal que o servidor iniciou na porta 3001.

## 7. Verificação final desta fase
- [ ] Frontend criado com Vite
- [ ] Backend inicializado com Express
- [ ] Diretórios e arquivos básicos criados
- [ ] `.env` configurados para desenvolvimento
- [ ] Apps funcionais em localhost

## 8. O que vem depois
A próxima etapa é implementar autenticação e o fluxo de login/register. Quando você disser **"proximo"**, montamos o backend de auth e a tela de login no frontend.
