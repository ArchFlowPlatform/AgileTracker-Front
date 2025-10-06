import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: number;
    email: string;
  };
}

export default async function memberRoutes(fastify: FastifyInstance) {
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

  // Listar membros de um board
  fastify.get('/board/:boardId', async (request: FastifyRequest, reply: FastifyReply) => {
    const req = request as AuthenticatedRequest;
    const userId = req.user.id;
    const boardId = parseInt((request.params as { boardId: string }).boardId);

    const members = await prisma.boardMember.findMany({
      where: {
        board_id: boardId,
        board: {
          owner_id: userId,
        },
      },
      include: {
        board: true,
      },
    });

    reply.send(members);
  });

  // Adicionar membro ao board
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const req = request as AuthenticatedRequest;
      const userId = req.user.id;
      const body = request.body as { board_id: number; user_id: number; role?: string };

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

      const member = await prisma.boardMember.create({
        data: {
          board_id: body.board_id,
          user_id: body.user_id,
          role: body.role || 'member',
        },
        include: {
          board: true,
        },
      });

      reply.code(201).send(member);
    } catch {
      reply.code(400).send({ error: 'Dados inválidos' });
    }
  });

  // Remover membro do board
  fastify.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const req = request as AuthenticatedRequest;
    const userId = req.user.id;
    const memberId = parseInt((request.params as { id: string }).id);

    const result = await prisma.boardMember.deleteMany({
      where: {
        id: memberId,
        board: {
          owner_id: userId,
        },
      },
    });

    if (result.count === 0) {
      reply.code(404).send({ error: 'Membro não encontrado' });
      return;
    }

    reply.send({ message: 'Membro removido com sucesso' });
  });
}
