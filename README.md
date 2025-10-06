# AgileTracker - Projeto Completo

Sistema de gerenciamento de projetos ágeis com Kanban board, sprints e analytics.

## 🚀 Tecnologias

### Frontend
- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Zustand** - Gerenciamento de estado
- **React Hook Form** - Formulários

### Backend
- **Fastify** - Framework web rápido
- **TypeScript** - Tipagem estática
- **Prisma** - ORM moderno
- **SQLite** - Banco de dados
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas

## 📦 Instalação

### Pré-requisitos
- Node.js 18+
- npm

### Instalação completa
```bash
# Instalar dependências do frontend
npm install

# Instalar dependências do backend
cd backend-ts
npm install

# Configurar banco de dados
npm run db:generate
npm run db:push
```

## 🏃‍♂️ Execução

### Opção 1: Script automático (recomendado)
```bash
python start_project.py
```

### Opção 2: Manual
```bash
# Terminal 1 - Backend
cd backend-ts
npm run dev

# Terminal 2 - Frontend
npm run dev
```

## 📚 API Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/test` - Testar autenticação

### Boards
- `GET /api/boards` - Listar boards
- `POST /api/boards` - Criar board
- `GET /api/boards/:id` - Buscar board
- `PUT /api/boards/:id` - Atualizar board
- `DELETE /api/boards/:id` - Deletar board
- `GET /api/boards/stats` - Estatísticas

### Tasks
- `GET /api/tasks` - Listar tasks
- `POST /api/tasks` - Criar task
- `PUT /api/tasks/:id` - Atualizar task
- `DELETE /api/tasks/:id` - Deletar task

### Columns
- `GET /api/columns` - Listar columns
- `POST /api/columns` - Criar column
- `PUT /api/columns/:id` - Atualizar column
- `DELETE /api/columns/:id` - Deletar column

### Sprints
- `GET /api/sprints/board/:boardId` - Listar sprints
- `POST /api/sprints` - Criar sprint
- `GET /api/sprints/:id` - Buscar sprint
- `PUT /api/sprints/:id` - Atualizar sprint
- `DELETE /api/sprints/:id` - Deletar sprint
- `POST /api/sprints/:id/activate` - Ativar sprint
- `POST /api/sprints/:id/execute` - Executar sprint
- `GET /api/sprints/active/board/:boardId` - Sprint ativo

### Sistema
- `GET /api/system/info` - Informações do sistema

## 🎯 Funcionalidades

- ✅ **Autenticação** - Login/registro com JWT
- ✅ **Kanban Board** - Drag & drop de tasks
- ✅ **Sprints** - Gerenciamento de sprints
- ✅ **Analytics** - Estatísticas e métricas
- ✅ **Burndown Chart** - Gráfico de burndown
- ✅ **Hot Reload** - Desenvolvimento rápido
- ✅ **TypeScript** - Tipagem em todo o projeto

## 🔧 Configuração

### Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:

```env
JWT_SECRET=your-secret-key-change-in-production
DATABASE_URL="file:./backend-ts/agiletracker.db"
```

## 🚀 Deploy

### Frontend
```bash
npm run build
npm start
```

### Backend
```bash
cd backend-ts
npm run build
npm start
```

## 📝 Notas

- O backend Python foi migrado para TypeScript
- Hot reload funciona nativamente
- Banco SQLite é criado automaticamente
- Todas as rotas mantêm compatibilidade com o frontend

## 🗑️ Limpeza

Para remover o backend Python antigo (quando não estiver em uso):
```bash
# Windows
rmdir /s backend-python-old

# Linux/Mac
rm -rf backend-python-old
```