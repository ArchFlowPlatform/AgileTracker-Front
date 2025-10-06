import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { ColumnCreateSchema, ColumnUpdateSchema } from '../schemas';

interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: number;
    email: string;
  };
}

export default async function columnRoutes(fastify: FastifyInstance) {
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

  // Listar columns
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const req = request as AuthenticatedRequest;
    const userId = req.user.id;

    const columns = await prisma.column.findMany({
      where: {
        board: {
          owner_id: userId,
        },
      },
      include: {
        board: true,
        tasks: {
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { position: 'asc' },
    });

    reply.send(columns);
  });

  // Listar columns por board
  fastify.get('/board/:boardId', async (request: FastifyRequest, reply: FastifyReply) => {
    const req = request as AuthenticatedRequest;
    const userId = req.user.id;
    const boardId = parseInt((request.params as { boardId: string }).boardId);

    const columns = await prisma.column.findMany({
      where: {
        board_id: boardId,
        board: {
          owner_id: userId,
        },
      },
      include: {
        board: true,
        tasks: {
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { position: 'asc' },
    });

    reply.send(columns);
  });

  // Criar column
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const req = request as AuthenticatedRequest;
      const userId = req.user.id;
      const body = ColumnCreateSchema.parse(request.body);

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

      const column = await prisma.column.create({
        data: {
          name: body.name,
          position: body.position,
          board_id: body.board_id,
        },
        include: {
          board: true,
          tasks: true,
        },
      });

      reply.code(201).send(column);
    } catch {
      reply.code(400).send({ error: 'Dados inválidos' });
    }
  });

  // Atualizar column
  fastify.put('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const req = request as AuthenticatedRequest;
      const userId = req.user.id;
      const columnId = parseInt((request.params as { id: string }).id);
      const body = ColumnUpdateSchema.parse(request.body);

      const column = await prisma.column.updateMany({
        where: {
          id: columnId,
          board: {
            owner_id: userId,
          },
        },
        data: body,
      });

      if (column.count === 0) {
        reply.code(404).send({ error: 'Column não encontrada' });
        return;
      }

      const updatedColumn = await prisma.column.findUnique({
        where: { id: columnId },
        include: {
          board: true,
          tasks: true,
        },
      });

      reply.send(updatedColumn);
    } catch {
      reply.code(400).send({ error: 'Dados inválidos' });
    }
  });

  // Deletar column
  fastify.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const req = request as AuthenticatedRequest;
    const userId = req.user.id;
    const columnId = parseInt((request.params as { id: string }).id);

    const result = await prisma.column.deleteMany({
      where: {
        id: columnId,
        board: {
          owner_id: userId,
        },
      },
    });

    if (result.count === 0) {
      reply.code(404).send({ error: 'Column não encontrada' });
      return;
    }

    reply.send({ message: 'Column deletada com sucesso' });
  });
}
