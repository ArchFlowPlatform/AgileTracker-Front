import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: number;
    email: string;
  };
}

export default async function labelRoutes(fastify: FastifyInstance) {
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

  // Listar labels de um board
  fastify.get('/board/:boardId', async (request: FastifyRequest, reply: FastifyReply) => {
    const req = request as AuthenticatedRequest;
    const userId = req.user.id;
    const boardId = parseInt((request.params as { boardId: string }).boardId);

    const labels = await prisma.label.findMany({
      where: {
        board_id: boardId,
        board: {
          owner_id: userId,
        },
      },
      include: {
        board: true,
      },
      orderBy: { created_at: 'asc' },
    });

    reply.send(labels);
  });

  // Criar label
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const req = request as AuthenticatedRequest;
      const userId = req.user.id;
      const body = request.body as { name: string; color: string; board_id: number };

      // Verificar se o board pertence ao usuário
      const board = await prisma.board.findFirst({
        where: {
          id: body.board_id,
          owner_id: userId,
        },
      });

      if (!board) {
        reply.code(404).send({ error: 'Board não encontrado' });
        return;
      }

      const label = await prisma.label.create({
        data: {
          name: body.name,
          color: body.color,
          board_id: body.board_id,
        },
        include: {
          board: true,
        },
      });

      reply.code(201).send(label);
    } catch {
      reply.code(400).send({ error: 'Dados inválidos' });
    }
  });

  // Atualizar label
  fastify.put('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const req = request as AuthenticatedRequest;
      const userId = req.user.id;
      const labelId = parseInt((request.params as { id: string }).id);
      const body = request.body as { name: string; color: string; board_id: number };

      const label = await prisma.label.updateMany({
        where: {
          id: labelId,
          board: {
            owner_id: userId,
          },
        },
        data: {
          name: body.name,
          color: body.color,
        },
      });

      if (label.count === 0) {
        reply.code(404).send({ error: 'Label não encontrada' });
        return;
      }

      const updatedLabel = await prisma.label.findUnique({
        where: { id: labelId },
        include: {
          board: true,
        },
      });

      reply.send(updatedLabel);
    } catch {
      reply.code(400).send({ error: 'Dados inválidos' });
    }
  });

  // Deletar label
  fastify.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const req = request as AuthenticatedRequest;
    const userId = req.user.id;
    const labelId = parseInt((request.params as { id: string }).id);

    const result = await prisma.label.deleteMany({
      where: {
        id: labelId,
        board: {
          owner_id: userId,
        },
      },
    });

    if (result.count === 0) {
      reply.code(404).send({ error: 'Label não encontrada' });
      return;
    }

    reply.send({ message: 'Label deletada com sucesso' });
  });
}
