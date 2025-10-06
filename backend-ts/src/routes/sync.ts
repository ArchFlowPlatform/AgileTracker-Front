import { FastifyInstance } from 'fastify';
import { databaseSyncService } from '../services/database-sync';

export async function syncRoutes(fastify: FastifyInstance) {
  // Middleware de autenticação
  fastify.addHook('preHandler', async (request, reply) => {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      reply.code(401).send({ error: 'Token de acesso necessário' });
      return;
    }

    try {
      // Verificar token (implementar verificação JWT aqui)
      const userId = 1; // Por enquanto, usar ID fixo
      request.userId = userId;
    } catch (error) {
      reply.code(401).send({ error: 'Token inválido' });
      return;
    }
  });

  // Sincronizar dados do Kanban Board
  fastify.post('/sync/kanban-board', async (request, reply) => {
    try {
      const { boardData } = request.body as { boardData: any };
      const userId = (request as any).userId;

      const result = await databaseSyncService.syncKanbanBoard(userId, boardData);
      
      reply.send({
        success: true,
        message: 'Kanban Board sincronizado com sucesso',
        boardId: result.id
      });
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: 'Erro ao sincronizar Kanban Board',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // Sincronizar dados do Scrum
  fastify.post('/sync/scrum', async (request, reply) => {
    try {
      const { scrumData } = request.body as { scrumData: any };
      const userId = (request as any).userId;

      await databaseSyncService.syncScrumData(userId, scrumData);
      
      reply.send({
        success: true,
        message: 'Dados Scrum sincronizados com sucesso'
      });
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: 'Erro ao sincronizar dados Scrum',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // Sincronizar configurações do usuário
  fastify.post('/sync/settings', async (request, reply) => {
    try {
      const { settingsData } = request.body as { settingsData: any };
      const userId = (request as any).userId;

      await databaseSyncService.syncUserSettings(userId, settingsData);
      
      reply.send({
        success: true,
        message: 'Configurações sincronizadas com sucesso'
      });
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: 'Erro ao sincronizar configurações',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // Carregar dados do usuário
  fastify.get('/sync/load', async (request, reply) => {
    try {
      const userId = (request as any).userId;
      const userData = await databaseSyncService.loadUserData(userId);
      
      reply.send({
        success: true,
        data: userData
      });
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: 'Erro ao carregar dados do usuário',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // Sincronização completa (todos os dados)
  fastify.post('/sync/all', async (request, reply) => {
    try {
      const { kanbanData, scrumData, settingsData } = request.body as {
        kanbanData: any;
        scrumData: any;
        settingsData: any;
      };
      const userId = (request as any).userId;

      // Sincronizar todos os dados
      const board = await databaseSyncService.syncKanbanBoard(userId, kanbanData);
      await databaseSyncService.syncScrumData(userId, scrumData);
      await databaseSyncService.syncUserSettings(userId, settingsData);
      
      reply.send({
        success: true,
        message: 'Todos os dados sincronizados com sucesso',
        boardId: board.id
      });
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: 'Erro ao sincronizar dados',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });
}
