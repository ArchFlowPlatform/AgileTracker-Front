# AgileTracker Backend - TypeScript

Backend moderno em TypeScript com Fastify, Prisma e hot reload nativo.

## 🚀 Tecnologias

- **Fastify** - Framework web rápido e eficiente
- **TypeScript** - Tipagem estática
- **Prisma** - ORM moderno para banco de dados
- **SQLite** - Banco de dados local
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas
- **Zod** - Validação de schemas

## 📦 Instalação

```bash
cd backend-ts
npm install
```

## 🗄️ Banco de Dados

```bash
# Gerar cliente Prisma
npm run db:generate

# Aplicar schema ao banco
npm run db:push

# Abrir Prisma Studio (opcional)
npm run db:studio
```

## 🏃‍♂️ Execução

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Produção
npm run build
npm start
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

## 🔧 Configuração

### Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:

```env
JWT_SECRET=your-secret-key-change-in-production
DATABASE_URL="file:./agiletracker.db"
```

### Banco de Dados
O banco SQLite será criado automaticamente em `agiletracker.db`.

## 🎯 Vantagens do TypeScript

- ✅ **Hot reload nativo** - Sem problemas de reload
- ✅ **Tipagem estática** - Menos bugs em runtime
- ✅ **Mesma linguagem** - Frontend + Backend
- ✅ **Prisma ORM** - Melhor que SQLAlchemy
- ✅ **Fastify** - Mais rápido que Express
- ✅ **Validação Zod** - Schemas type-safe

## 🚀 Deploy

```bash
# Build para produção
npm run build

# Executar em produção
npm start
```

## 📝 Logs

O servidor usa Pino para logs estruturados com cores no desenvolvimento.
