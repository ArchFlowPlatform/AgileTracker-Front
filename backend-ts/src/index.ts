import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

// Importar rotas
import authRoutes from './routes/auth';
import boardRoutes from './routes/boards';
import columnRoutes from './routes/columns';
import taskRoutes from './routes/tasks';
import memberRoutes from './routes/members';
import labelRoutes from './routes/labels';
import sprintRoutes from './routes/sprints';
import userStoryRoutes from './routes/user-stories';
import epicRoutes from './routes/epics';
import userSettingsRoutes from './routes/user-settings';
import { syncRoutes } from './routes/sync';

// Instanciar Prisma
export const prisma = new PrismaClient();

// Criar instância do Fastify
const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  },
});

// Registrar CORS
fastify.register(cors, {
  origin: true, // Aceita todas as origens em desenvolvimento
  credentials: true,
});

// Registrar rotas
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(boardRoutes, { prefix: '/api/boards' });
fastify.register(columnRoutes, { prefix: '/api/columns' });
fastify.register(taskRoutes, { prefix: '/api/tasks' });
fastify.register(memberRoutes, { prefix: '/api/members' });
fastify.register(labelRoutes, { prefix: '/api/labels' });
fastify.register(sprintRoutes, { prefix: '/api/sprints' });
fastify.register(userStoryRoutes, { prefix: '/api/user-stories' });
fastify.register(epicRoutes, { prefix: '/api/epics' });
fastify.register(userSettingsRoutes, { prefix: '/api/user' });
fastify.register(syncRoutes, { prefix: '/api' });

// Registrar middleware de autenticação global
fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.code(401).send({ error: 'Token não fornecido' });
      return;
    }

    const token = authHeader.substring(7);
    const JWT_SECRET = 'your-secret-key-change-in-production';

    const user = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
    (request as FastifyRequest & { user: { id: number; email: string } }).user = user;
  } catch {
    reply.code(401).send({ error: 'Token inválido' });
  }
});

// Endpoint de sistema
fastify.get('/api/system/info', async () => {
  return {
    version: '1.0.0',
    last_update: new Date().toISOString(),
    persistence: 'SQLite Database',
    environment: 'Development',
    database_path: 'backend-ts/agiletracker.db',
    api_version: '1.0.0',
    build_date: new Date().toISOString(),
  };
});

// Endpoint raiz
fastify.get('/', async () => {
  return {
    message: 'AgileTracker API - TypeScript Backend',
    timestamp: new Date().toISOString(),
  };
});

// Iniciar servidor
const start = async () => {
  try {
    await fastify.listen({
      port: 8000,
      host: '127.0.0.1',
    });
    console.log('🚀 Servidor rodando em http://127.0.0.1:8000');
    console.log('📚 Documentação: http://127.0.0.1:8000/docs');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
