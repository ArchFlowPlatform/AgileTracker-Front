import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { TaskCreateSchema, TaskUpdateSchema } from '../schemas';

interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: number;
    email: string;
  };
}

export default async function taskRoutes(fastify: FastifyInstance) {
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

  // Listar tasks
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const req = request as AuthenticatedRequest;
    const userId = req.user.id;

    const tasks = await prisma.task.findMany({
      where: {
        board: {
          owner_id: userId,
        },
      },
      include: {
        board: true,
        column: true,
        owner: true,
      },
      orderBy: { position: 'asc' },
    });

    reply.send(tasks);
  });

  // Listar tasks por board
  fastify.get('/board/:boardId', async (request: FastifyRequest, reply: FastifyReply) => {
    const req = request as AuthenticatedRequest;
    const userId = req.user.id;
    const boardId = parseInt((request.params as { boardId: string }).boardId);

    const tasks = await prisma.task.findMany({
      where: {
        board_id: boardId,
        board: {
          owner_id: userId,
        },
      },
      include: {
        board: true,
        column: true,
        owner: true,
      },
      orderBy: { position: 'asc' },
    });

    reply.send(tasks);
  });

  // Criar task
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const req = request as AuthenticatedRequest;
      const userId = req.user.id;
      const body = TaskCreateSchema.parse(request.body);

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

      const task = await prisma.task.create({
        data: {
          title: body.title,
          description: body.description,
          position: body.position,
          story_points: body.story_points,
          board_id: body.board_id,
          column_id: body.column_id,
          owner_id: userId,
        },
        include: {
          board: true,
          column: true,
          owner: true,
        },
      });

      reply.code(201).send(task);
    } catch {
      reply.code(400).send({ error: 'Dados inválidos' });
    }
  });

  // Atualizar task
  fastify.put('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const req = request as AuthenticatedRequest;
      const userId = req.user.id;
      const taskId = parseInt((request.params as { id: string }).id);
      const body = TaskUpdateSchema.parse(request.body);

      const task = await prisma.task.updateMany({
        where: {
          id: taskId,
          board: {
            owner_id: userId,
          },
        },
        data: body,
      });

      if (task.count === 0) {
        reply.code(404).send({ error: 'Task não encontrada' });
        return;
      }

      const updatedTask = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          board: true,
          column: true,
          owner: true,
        },
      });

      reply.send(updatedTask);
    } catch {
      reply.code(400).send({ error: 'Dados inválidos' });
    }
  });

  // Deletar task
  fastify.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const req = request as AuthenticatedRequest;
    const userId = req.user.id;
    const taskId = parseInt((request.params as { id: string }).id);

    const result = await prisma.task.deleteMany({
      where: {
        id: taskId,
        board: {
          owner_id: userId,
        },
      },
    });

    if (result.count === 0) {
      reply.code(404).send({ error: 'Task não encontrada' });
      return;
    }

    reply.send({ message: 'Task deletada com sucesso' });
  });
}
