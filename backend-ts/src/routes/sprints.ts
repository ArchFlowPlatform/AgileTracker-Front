import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { SprintCreateSchema, SprintUpdateSchema } from '../schemas';

interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: number;
    email: string;
  };
}

export default async function sprintRoutes(fastify: FastifyInstance) {
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

  // Listar sprints de um board
  fastify.get('/board/:boardId', async (request: FastifyRequest, reply: FastifyReply) => {
    const req = request as AuthenticatedRequest;
    const userId = req.user.id;
    const boardId = parseInt((request.params as { boardId: string }).boardId);

    const sprints = await prisma.sprint.findMany({
      where: {
        board_id: boardId,
        board: {
          owner_id: userId,
        },
      },
      include: {
        board: true,
      },
      orderBy: { created_at: 'desc' },
    });

    // Converter working_days de JSON string para array
    const sprintsWithArray = sprints.map(sprint => ({
      ...sprint,
      working_days: sprint.working_days ? JSON.parse(sprint.working_days) : []
    }));
    
    reply.send(sprintsWithArray);
  });

  // Criar sprint
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const req = request as AuthenticatedRequest;
      const userId = req.user.id;
      const body = SprintCreateSchema.parse(request.body);

      let boardId = body.board_id;

      // Se o board não existir, criar um board padrão para o usuário
      const board = await prisma.board.findFirst({
        where: {
          id: body.board_id,
          owner_id: userId,
        },
      });

      if (!board) {
        // Criar board padrão para o usuário
        const defaultBoard = await prisma.board.create({
          data: {
            name: 'Board Padrão',
            description: 'Board criado automaticamente para sprints',
            owner_id: userId,
          },
        });
        boardId = defaultBoard.id;
        console.log(`✅ Board padrão criado para usuário ${userId}: ${defaultBoard.id}`);
      }

      const sprint = await prisma.sprint.create({
        data: {
          name: body.name,
          description: body.description,
          start_date: new Date(body.start_date),
          end_date: new Date(body.end_date),
          working_days: body.working_days ? JSON.stringify(body.working_days) : null,
          board_id: boardId,
        },
        include: {
          board: true,
        },
      });

      reply.code(201).send(sprint);
    } catch (error) {
      console.error('Erro ao criar sprint:', error);
      reply.code(400).send({ error: 'Dados inválidos' });
    }
  });

  // Buscar sprint específico
  fastify.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const req = request as AuthenticatedRequest;
    const userId = req.user.id;
    const sprintId = parseInt((request.params as { id: string }).id);

    const sprint = await prisma.sprint.findFirst({
      where: {
        id: sprintId,
        board: {
          owner_id: userId,
        },
      },
      include: {
        board: true,
      },
    });

    if (!sprint) {
      reply.code(404).send({ error: 'Sprint não encontrado' });
      return;
    }

    // Converter working_days de JSON string para array
    const sprintWithArray = {
      ...sprint,
      working_days: sprint.working_days ? JSON.parse(sprint.working_days) : []
    };
    
    reply.send(sprintWithArray);
  });

  // Atualizar sprint
  fastify.put('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const req = request as AuthenticatedRequest;
      const userId = req.user.id;
      const sprintId = parseInt((request.params as { id: string }).id);
      const body = SprintUpdateSchema.parse(request.body);

      const updateData: Partial<{
        name: string;
        description: string | null;
        start_date: Date;
        end_date: Date;
        working_days: string | null;
        is_active: boolean;
      }> = {};
      if (body.name) updateData.name = body.name;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.start_date) updateData.start_date = new Date(body.start_date);
      if (body.end_date) updateData.end_date = new Date(body.end_date);
      if (body.working_days) updateData.working_days = JSON.stringify(body.working_days);
      if (body.is_active !== undefined) updateData.is_active = body.is_active;

      const sprint = await prisma.sprint.updateMany({
        where: {
          id: sprintId,
          board: {
            owner_id: userId,
          },
        },
        data: updateData,
      });

      if (sprint.count === 0) {
        reply.code(404).send({ error: 'Sprint não encontrado' });
        return;
      }

      const updatedSprint = await prisma.sprint.findUnique({
        where: { id: sprintId },
        include: {
          board: true,
        },
      });

      // Converter working_days de JSON string para array
      const updatedSprintWithArray = {
        ...updatedSprint,
        working_days: updatedSprint?.working_days ? JSON.parse(updatedSprint.working_days) : []
      };

      reply.send(updatedSprintWithArray);
    } catch {
      reply.code(400).send({ error: 'Dados inválidos' });
    }
  });

  // Deletar sprint
  fastify.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const req = request as AuthenticatedRequest;
    const userId = req.user.id;
    const sprintId = parseInt((request.params as { id: string }).id);

    const result = await prisma.sprint.deleteMany({
      where: {
        id: sprintId,
        board: {
          owner_id: userId,
        },
      },
    });

    if (result.count === 0) {
      reply.code(404).send({ error: 'Sprint não encontrado' });
      return;
    }

    reply.send({ message: 'Sprint deletado com sucesso' });
  });

  // Ativar sprint
  fastify.post('/:id/activate', async (request: FastifyRequest, reply: FastifyReply) => {
    const req = request as AuthenticatedRequest;
    const userId = req.user.id;
    const sprintId = parseInt((request.params as { id: string }).id);

    // Desativar outros sprints do mesmo board
    await prisma.sprint.updateMany({
      where: {
        board: {
          owner_id: userId,
        },
        is_active: true,
      },
      data: {
        is_active: false,
      },
    });

    // Ativar o sprint atual
    const sprint = await prisma.sprint.updateMany({
      where: {
        id: sprintId,
        board: {
          owner_id: userId,
        },
      },
      data: {
        is_active: true,
      },
    });

    if (sprint.count === 0) {
      reply.code(404).send({ error: 'Sprint não encontrado' });
      return;
    }

    reply.send({ message: 'Sprint ativado com sucesso' });
  });

  // Executar sprint
  fastify.post('/:id/execute', async (request: FastifyRequest, reply: FastifyReply) => {
    const req = request as AuthenticatedRequest;
    const userId = req.user.id;
    const sprintId = parseInt((request.params as { id: string }).id);

    const sprint = await prisma.sprint.findFirst({
      where: {
        id: sprintId,
        board: {
          owner_id: userId,
        },
      },
    });

    if (!sprint) {
      reply.code(404).send({ error: 'Sprint não encontrado' });
      return;
    }

    // Aqui você pode implementar a lógica de execução do sprint
    // Por exemplo: processar tasks, calcular burndown, etc.

    reply.send({
      message: `Sprint '${sprint.name}' executado com sucesso`,
      sprint_id: sprintId,
    });
  });

  // Buscar sprint ativo de um board
  fastify.get('/active/board/:boardId', async (request: FastifyRequest, reply: FastifyReply) => {
    const req = request as AuthenticatedRequest;
    const userId = req.user.id;
    const boardId = parseInt((request.params as { boardId: string }).boardId);

    const sprint = await prisma.sprint.findFirst({
      where: {
        board_id: boardId,
        is_active: true,
        board: {
          owner_id: userId,
        },
      },
      include: {
        board: true,
      },
    });

    if (!sprint) {
      reply.code(404).send({ error: 'Nenhum sprint ativo encontrado' });
      return;
    }

    // Converter working_days de JSON string para array
    const sprintWithArray = {
      ...sprint,
      working_days: sprint.working_days ? JSON.parse(sprint.working_days) : []
    };

    reply.send(sprintWithArray);
  });
}
