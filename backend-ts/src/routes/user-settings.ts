import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: number;
    email: string;
  };
}

export default async function userSettingsRoutes(fastify: FastifyInstance) {
  // Middleware de autenticação inline
  const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        reply.code(401).send({ error: 'Token não fornecido' });
        return;
      }

      const token = authHeader.substring(7);
      const JWT_SECRET = 'your-secret-key-change-in-production';

      const user = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
      (request as AuthenticatedRequest).user = user;
    } catch {
      reply.code(401).send({ error: 'Token inválido' });
    }
  };

  fastify.addHook('preHandler', authenticate);

  // GET /api/user/settings - Obter configurações do usuário
  fastify.get('/settings', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Por enquanto, retornar configurações padrão
      // No futuro, isso pode vir do banco de dados
      const settings = {
        theme: 'light',
        language: 'pt-BR',
        notifications: {
          email: true,
          push: false,
        },
        preferences: {
          defaultBoard: 1,
          autoSave: true,
        },
      };

      reply.send(settings);
    } catch {
      reply.code(500).send({ error: 'Erro interno do servidor' });
    }
  });

  // PUT /api/user/settings - Atualizar configurações do usuário
  fastify.put('/settings', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const settings = request.body as Record<string, unknown>;

      // Por enquanto, apenas retornar sucesso
      // No futuro, isso pode salvar no banco de dados
      reply.send({ 
        message: 'Configurações atualizadas com sucesso',
        settings: settings 
      });
    } catch {
      reply.code(500).send({ error: 'Erro interno do servidor' });
    }
  });
}
