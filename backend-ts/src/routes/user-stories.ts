import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { databaseSyncService } from '../services/database-sync';

interface UserStoryCreateData {
  title: string;
  description?: string;
  story_points?: number;
  priority?: string;
  acceptance_criteria?: string[];
  tags?: string[];
  epic_id?: number;
  board_id?: number;
}

interface UserStoryUpdateData {
  title?: string;
  description?: string;
  story_points?: number;
  priority?: string;
  status?: string;
  acceptance_criteria?: string[];
  tags?: string[];
  epic_id?: number;
}

interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: number;
    email: string;
  };
}

export default async function userStoryRoutes(fastify: FastifyInstance) {
  // Middleware de autenticação
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
  // GET /api/user-stories - Listar todas as user stories
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userStories = await prisma.userStory.findMany({
        include: {
          epic: true,
          board: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      return userStories.map((story: {
        id: number;
        title: string;
        description: string | null;
        story_points: number;
        priority: string;
        status: string;
        acceptance_criteria: string | null;
        tags: string | null;
        epic_id: number | null;
        board_id: number | null;
        created_at: Date;
        updated_at: Date;
        epic: {
          id: number;
          name: string;
          description: string | null;
        } | null;
        board: {
          id: number;
          name: string;
          description: string | null;
        } | null;
      }) => ({
        id: story.id,
        title: story.title,
        description: story.description,
        story_points: story.story_points,
        priority: story.priority,
        status: story.status,
        acceptance_criteria: story.acceptance_criteria,
        tags: story.tags,
        epic_id: story.epic_id,
        board_id: story.board_id,
        created_at: story.created_at,
        updated_at: story.updated_at,
        epic: story.epic ? {
          id: story.epic.id,
          name: story.epic.name,
          description: story.epic.description,
        } : null,
      }));
    } catch (error) {
      console.error('❌ Erro ao criar User Story:', error);
      fastify.log.error(error);
      reply.code(500).send({ error: 'Erro interno do servidor' });
      return;
    }
  });

  // GET /api/user-stories/board/:boardId - Listar user stories por board
  fastify.get('/board/:boardId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const boardId = parseInt((request.params as { boardId: string }).boardId);
      
      const userStories = await prisma.userStory.findMany({
        where: {
          board_id: boardId,
        },
        include: {
          epic: true,
          board: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      return userStories.map((story: {
        id: number;
        title: string;
        description: string | null;
        story_points: number;
        priority: string;
        status: string;
        acceptance_criteria: string | null;
        tags: string | null;
        epic_id: number | null;
        board_id: number | null;
        created_at: Date;
        updated_at: Date;
        epic: {
          id: number;
          name: string;
          description: string | null;
        } | null;
        board: {
          id: number;
          name: string;
          description: string | null;
        } | null;
      }) => ({
        id: story.id,
        title: story.title,
        description: story.description,
        story_points: story.story_points,
        priority: story.priority,
        status: story.status,
        acceptance_criteria: story.acceptance_criteria,
        tags: story.tags,
        epic_id: story.epic_id,
        board_id: story.board_id,
        created_at: story.created_at,
        updated_at: story.updated_at,
        epic: story.epic ? {
          id: story.epic.id,
          name: story.epic.name,
          description: story.epic.description,
        } : null,
      }));
    } catch (error) {
      console.error('❌ Erro ao criar User Story:', error);
      fastify.log.error(error);
      reply.code(500).send({ error: 'Erro interno do servidor' });
      return;
    }
  });

  // POST /api/user-stories - Criar nova user story
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      console.log('📝 Criando User Story:', request.body);
      
      const {
        title,
        description,
        story_points,
        priority = 'Medium',
        acceptance_criteria = [],
        tags = [],
        epic_id,
        board_id,
      } = request.body as UserStoryCreateData;

      if (!title || !description) {
        reply.code(400).send({ error: 'Título e descrição são obrigatórios' });
        return;
      }

      console.log('📝 Dados processados:', {
        title,
        description,
        story_points,
        priority,
        acceptance_criteria,
        tags,
        epic_id,
        board_id
      });

      // Garantir que sempre existe um board para o usuário
      const req = request as AuthenticatedRequest;
      const userId = req.user.id;
      
      // Garantir que o usuário tem um board padrão
      const board = await databaseSyncService.ensureDefaultBoard(userId);
      
      // Usar o board do usuário se não foi especificado um board_id
      // Se board_id foi especificado, verificar se existe e pertence ao usuário
      let finalBoardId = board.id; // Usar board padrão como fallback
      
      if (board_id) {
        const specifiedBoard = await prisma.board.findFirst({
          where: { 
            id: board_id,
            owner_id: userId 
          }
        });
        if (specifiedBoard) {
          finalBoardId = board_id;
          console.log(`✅ Usando board especificado: ID ${board_id}`);
        } else {
          console.log(`⚠️ Board ID ${board_id} não encontrado ou não pertence ao usuário, usando board padrão: ID ${board.id}`);
        }
      }

      const userStory = await prisma.userStory.create({
        data: {
          title,
          description,
          story_points: story_points || 0,
          priority,
          status: 'Backlog',
          acceptance_criteria: JSON.stringify(acceptance_criteria),
          tags: JSON.stringify(tags),
          epic_id: epic_id ? parseInt(epic_id.toString()) : null,
          board_id: finalBoardId, // Usar board_id validado ou null
        },
        include: {
          epic: true,
          board: true,
        },
      });

      console.log('✅ User Story criada com sucesso:', userStory);

      return {
        id: userStory.id,
        title: userStory.title,
        description: userStory.description,
        story_points: userStory.story_points,
        priority: userStory.priority,
        status: userStory.status,
        acceptance_criteria: JSON.parse(userStory.acceptance_criteria || '[]'),
        tags: JSON.parse(userStory.tags || '[]'),
        epic_id: userStory.epic_id,
        board_id: userStory.board_id,
        created_at: userStory.created_at,
        updated_at: userStory.updated_at,
        epic: userStory.epic ? {
          id: userStory.epic.id,
          name: userStory.epic.name,
          description: userStory.epic.description,
        } : null,
      };
    } catch (error) {
      console.error('❌ Erro ao criar User Story:', error);
      fastify.log.error(error);
      reply.code(500).send({ error: 'Erro interno do servidor' });
      return;
    }
  });

  // GET /api/user-stories/:id - Obter user story específica
  fastify.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      
      const userStory = await prisma.userStory.findUnique({
        where: { id: parseInt(id) },
        include: {
          epic: true,
          board: true,
        },
      });

      if (!userStory) {
        reply.code(404).send({ error: 'User Story não encontrada' });
        return;
      }

      return {
        id: userStory.id,
        title: userStory.title,
        description: userStory.description,
        story_points: userStory.story_points,
        priority: userStory.priority,
        status: userStory.status,
        acceptance_criteria: JSON.parse(userStory.acceptance_criteria || '[]'),
        tags: JSON.parse(userStory.tags || '[]'),
        epic_id: userStory.epic_id,
        board_id: userStory.board_id,
        created_at: userStory.created_at,
        updated_at: userStory.updated_at,
        epic: userStory.epic ? {
          id: userStory.epic.id,
          name: userStory.epic.name,
          description: userStory.epic.description,
        } : null,
      };
    } catch (error) {
      console.error('❌ Erro ao criar User Story:', error);
      fastify.log.error(error);
      reply.code(500).send({ error: 'Erro interno do servidor' });
      return;
    }
  });

  // PUT /api/user-stories/:id - Atualizar user story
  fastify.put('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const {
        title,
        description,
        story_points,
        priority,
        status,
        acceptance_criteria,
        tags,
        epic_id,
      } = request.body as UserStoryUpdateData;

      const userStory = await prisma.userStory.update({
        where: { id: parseInt(id) },
        data: {
          ...(title && { title }),
          ...(description && { description }),
          ...(story_points !== undefined && { story_points }),
          ...(priority && { priority }),
          ...(status && { status }),
          ...(acceptance_criteria && { acceptance_criteria: JSON.stringify(acceptance_criteria) }),
          ...(tags && { tags: JSON.stringify(tags) }),
          ...(epic_id !== undefined && { epic_id: epic_id ? parseInt(epic_id.toString()) : null }),
          updated_at: new Date(),
        },
        include: {
          epic: true,
        },
      });

      return {
        id: userStory.id,
        title: userStory.title,
        description: userStory.description,
        story_points: userStory.story_points,
        priority: userStory.priority,
        status: userStory.status,
        acceptance_criteria: JSON.parse(userStory.acceptance_criteria || '[]'),
        tags: JSON.parse(userStory.tags || '[]'),
        epic_id: userStory.epic_id,
        board_id: userStory.board_id,
        created_at: userStory.created_at,
        updated_at: userStory.updated_at,
        epic: userStory.epic ? {
          id: userStory.epic.id,
          name: userStory.epic.name,
          description: userStory.epic.description,
        } : null,
      };
    } catch (error) {
      console.error('❌ Erro ao criar User Story:', error);
      fastify.log.error(error);
      reply.code(500).send({ error: 'Erro interno do servidor' });
      return;
    }
  });

  // DELETE /api/user-stories/:id - Deletar user story
  fastify.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      
      await prisma.userStory.delete({
        where: { id: parseInt(id) },
      });

      return { message: 'User Story deletada com sucesso' };
    } catch (error) {
      console.error('❌ Erro ao criar User Story:', error);
      fastify.log.error(error);
      reply.code(500).send({ error: 'Erro interno do servidor' });
      return;
    }
  });
}
