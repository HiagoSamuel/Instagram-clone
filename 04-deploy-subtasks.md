# Subtarefas Deploy — Fase 1

## 1. Preparar repositório GitHub
- Inicializar repositório Git no root
- Adicionar `frontend/` e `backend/` ao commit
- Criar `.gitignore` para Node e Vite
- Subir projeto para GitHub

## 2. Deploy do Frontend na Vercel
- Criar conta ou entrar em Vercel
- Conectar ao repositório GitHub
- Importar projeto com foco na pasta `frontend/`
- Configurar variável de ambiente:
  - `VITE_API_URL=https://<seu-backend>/api`
- Verificar build automático do Vite
- Conferir deploy e rotear domínio Vercel

## 3. Deploy do Backend na Railway
- Criar conta em Railway
- Criar projeto novo via GitHub ou pasta `backend/`
- Configurar variáveis de ambiente:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_KEY`
  - `JWT_SECRET`
  - `FRONTEND_URL=https://<seu-front-end>.vercel.app`
- Confirmar que Railway detecta `npm start`
- Testar URL pública de backend

## 4. Ajustes pós-deploy
- Atualizar frontend para apontar URL do backend deployado
- Verificar CORS do backend
- Testar login, feed, perfil e mensagens em produção
- Validar upload de imagens em ambiente real

## 5. Checklists
- [ ] Frontend funcionando em Vercel
- [ ] Backend funcionando em Railway
- [ ] Autenticação JWT válida em produção
- [ ] Upload de imagem no Supabase Storage
- [ ] Rotas públicas e privadas funcionando
- [ ] Caminho de API correto no `VITE_API_URL`
