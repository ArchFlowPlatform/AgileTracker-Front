import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { BoardCreateSchema, BoardUpdateSchema } from '../schemas';

interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: number;
    email: string;
  };
}

export default async function boardRoutes(fastify: FastifyInstance) {
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

  // Registrar middleware de autenticação
  fastify.addHook('preHandler', authenticate);

  // Listar boards do usuário
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const req = request as AuthenticatedRequest;
    const userId = req.user.id;

    const boards = await prisma.board.findMany({
      where: { owner_id: userId },
      include: {
        columns: true,
        tasks: true,
        members: true,
        labels: true,
        sprints: true,
      },
      orderBy: { created_at: 'desc' },
    });

    reply.send(boards);
  });

  // Criar board
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const req = request as AuthenticatedRequest;
      const userId = req.user.id;
      const body = BoardCreateSchema.parse(request.body);

      const board = await prisma.board.create({
        data: {
          name: body.name,
          description: body.description,
          owner_id: userId,
        },
        include: {
          columns: true,
          tasks: true,
          members: true,
          labels: true,
          sprints: true,
        },
      });

      reply.code(201).send(board);
    } catch {
      reply.code(400).send({ error: 'Dados inválidos' });
    }
  });

  // Buscar board específico
  fastify.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const req = request as AuthenticatedRequest;
    const userId = req.user.id;
    const boardId = parseInt((request.params as { id: string }).id);

    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        owner_id: userId,
      },
      include: {
        columns: {
          orderBy: { position: 'asc' },
        },
        tasks: {
          include: {
            owner: true,
          },
        },
        members: true,
        labels: true,
        sprints: true,
      },
    });

    if (!board) {
      reply.code(404).send({ error: 'Board não encontrado' });
      return;
    }

    reply.send(board);
  });

  // Atualizar board
  fastify.put('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const req = request as AuthenticatedRequest;
      const userId = req.user.id;
      const boardId = parseInt((request.params as { id: string }).id);
      const body = BoardUpdateSchema.parse(request.body);

      const board = await prisma.board.updateMany({
        where: {
          id: boardId,
          owner_id: userId,
        },
        data: body,
      });

      if (board.count === 0) {
        reply.code(404).send({ error: 'Board não encontrado' });
        return;
      }

      const updatedBoard = await prisma.board.findUnique({
        where: { id: boardId },
        include: {
          columns: true,
          tasks: true,
          members: true,
          labels: true,
          sprints: true,
        },
      });

      reply.send(updatedBoard);
    } catch {
      reply.code(400).send({ error: 'Dados inválidos' });
    }
  });

  // Deletar board
  fastify.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const req = request as AuthenticatedRequest;
    const userId = req.user.id;
    const boardId = parseInt((request.params as { id: string }).id);

    const result = await prisma.board.deleteMany({
      where: {
        id: boardId,
        owner_id: userId,
      },
    });

    if (result.count === 0) {
      reply.code(404).send({ error: 'Board não encontrado' });
      return;
    }

    reply.send({ message: 'Board deletado com sucesso' });
  });

  // Estatísticas dos boards
  fastify.get('/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    const req = request as AuthenticatedRequest;
    const userId = req.user.id;

    try {
      const totalBoards = await prisma.board.count({
        where: { owner_id: userId },
      });

      if (totalBoards === 0) {
        return reply.send({
          total_boards: 0,
          total_tasks: 0,
          completed_tasks: 0,
          pending_tasks: 0,
          total_story_points: 0,
          total_members: 0,
          total_columns: 0,
          completion_rate: 0,
        });
      }

      const totalTasks = await prisma.task.count({
        where: {
          board: {
            owner_id: userId,
          },
        },
      });

      const completedTasks = await prisma.task.count({
        where: {
          board: {
            owner_id: userId,
          },
          is_completed: true,
        },
      });

      const tasksWithStoryPoints = await prisma.task.findMany({
        where: {
          board: {
            owner_id: userId,
          },
          story_points: {
            not: null,
          },
        },
        select: {
          story_points: true,
        },
      });

      const totalStoryPoints = tasksWithStoryPoints.reduce((sum, task) => {
        return sum + (task.story_points || 0);
      }, 0);

      const totalMembers = await prisma.boardMember.count({
        where: {
          board: {
            owner_id: userId,
          },
        },
      });

      const totalColumns = await prisma.column.count({
        where: {
          board: {
            owner_id: userId,
          },
        },
      });

      reply.send({
        total_boards: totalBoards,
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        pending_tasks: totalTasks - completedTasks,
        total_story_points: totalStoryPoints,
        total_members: totalMembers,
        total_columns: totalColumns,
        completion_rate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      });
    } catch {
      reply.code(500).send({
        total_boards: 0,
        total_tasks: 0,
        completed_tasks: 0,
        pending_tasks: 0,
        total_story_points: 0,
        total_members: 0,
        total_columns: 0,
        completion_rate: 0,
      });
    }
  });
}
