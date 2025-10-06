import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: number;
    email: string;
  };
}

export default async function epicRoutes(fastify: FastifyInstance) {
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

  // Listar epics
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const req = request as AuthenticatedRequest;
    const userId = req.user.id;

    const epics = await prisma.epic.findMany({
      where: {
        board: {
          owner_id: userId,
        },
      },
      include: {
        board: true,
        user_stories: true,
      },
      orderBy: { created_at: 'desc' },
    });

    reply.send(epics);
  });

  // Listar epics por board
  fastify.get('/board/:boardId', async (request: FastifyRequest, reply: FastifyReply) => {
    const req = request as AuthenticatedRequest;
    const userId = req.user.id;
    const boardId = parseInt((request.params as { boardId: string }).boardId);

    const epics = await prisma.epic.findMany({
      where: {
        board_id: boardId,
        board: {
          owner_id: userId,
        },
      },
      include: {
        board: true,
        user_stories: true,
      },
      orderBy: { created_at: 'desc' },
    });

    reply.send(epics);
  });

  // Criar epic
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const req = request as AuthenticatedRequest;
      const userId = req.user.id;
      const { name, description, board_id } = request.body as {
        name: string;
        description?: string;
        board_id: number;
      };

      // Verificar se o board pertence ao usuário
      const board = await prisma.board.findFirst({
        where: {
          id: board_id,
          owner_id: userId,
        },
      });

      if (!board) {
        reply.code(404).send({ error: 'Board não encontrado' });
        return;
      }

      const epic = await prisma.epic.create({
        data: {
          name,
          description: description || '',
          board_id,
        },
        include: {
          board: true,
          user_stories: true,
        },
      });

      reply.code(201).send(epic);
    } catch {
      reply.code(400).send({ error: 'Dados inválidos' });
    }
  });

  // Atualizar epic
  fastify.put('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const req = request as AuthenticatedRequest;
      const userId = req.user.id;
      const epicId = parseInt((request.params as { id: string }).id);
      const { name, description } = request.body as {
        name?: string;
        description?: string;
      };

      const epic = await prisma.epic.updateMany({
        where: {
          id: epicId,
          board: {
            owner_id: userId,
          },
        },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
        },
      });

      if (epic.count === 0) {
        reply.code(404).send({ error: 'Epic não encontrado' });
        return;
      }

      const updatedEpic = await prisma.epic.findUnique({
        where: { id: epicId },
        include: {
          board: true,
          user_stories: true,
        },
      });

      reply.send(updatedEpic);
    } catch {
      reply.code(400).send({ error: 'Dados inválidos' });
    }
  });

  // Deletar epic
  fastify.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const req = request as AuthenticatedRequest;
    const userId = req.user.id;
    const epicId = parseInt((request.params as { id: string }).id);

    const result = await prisma.epic.deleteMany({
      where: {
        id: epicId,
        board: {
          owner_id: userId,
        },
      },
    });

    if (result.count === 0) {
      reply.code(404).send({ error: 'Epic não encontrado' });
      return;
    }

    reply.send({ message: 'Epic deletado com sucesso' });
  });
}
