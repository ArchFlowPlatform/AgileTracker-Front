import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Interfaces para tipagem
interface KanbanColumn {
  name: string;
  color?: string;
  taskLimit?: number;
  isCollapsed?: boolean;
}

interface KanbanTask {
  title: string;
  description?: string;
  column: string;
  storyPoints?: number;
  status?: string;
}

interface KanbanLabel {
  name: string;
  color: string;
}

interface KanbanMember {
  name: string;
  initials: string;
  avatar?: string;
}

interface KanbanBoardData {
  board?: {
    name: string;
    description?: string;
  };
  columns?: KanbanColumn[];
  tasks?: KanbanTask[];
  members?: KanbanMember[];
  labels?: KanbanLabel[];
}

interface SprintData {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  workingDays?: string[];
  isActive?: boolean;
}

interface UserStoryData {
  title: string;
  description?: string;
  storyPoints?: number;
  priority?: string;
  status?: string;
  acceptanceCriteria?: string[];
  tags?: string[];
}

interface ScrumData {
  sprints?: SprintData[];
  userStories?: UserStoryData[];
}

interface SettingsData {
  teamMembers?: unknown[];
  sprintConfig?: unknown;
  theme?: string;
  language?: string;
}

/**
 * Serviço de sincronização com banco de dados
 * Salva todos os dados do localStorage no banco
 */
export class DatabaseSyncService {
  private static instance: DatabaseSyncService;

  static getInstance(): DatabaseSyncService {
    if (!DatabaseSyncService.instance) {
      DatabaseSyncService.instance = new DatabaseSyncService();
    }
    return DatabaseSyncService.instance;
  }

  /**
   * Garante que o usuário tem um board padrão
   */
  async ensureDefaultBoard(userId: number) {
    try {
      let board = await prisma.board.findFirst({
        where: { owner_id: userId }
      });

      if (!board) {
        console.log(`🏗️ Criando board padrão para usuário ${userId}`);
        
        board = await prisma.board.create({
          data: {
            name: 'Meu Board',
            description: 'Board padrão do usuário',
            owner_id: userId
          }
        });

        // Criar colunas padrão
        const defaultColumns = [
          { name: 'TO DO', position: 0 },
          { name: 'IN PROGRESS', position: 1 },
          { name: 'CODE REVIEW', position: 2 },
          { name: 'DONE', position: 3 }
        ];

        for (const col of defaultColumns) {
          await prisma.column.create({
            data: {
              name: col.name,
              position: col.position,
              board_id: board.id
            }
          });
        }

        console.log(`✅ Board padrão criado: ID ${board.id}`);
      }

      return board;
    } catch (error) {
      console.error('❌ Erro ao criar board padrão:', error);
      throw error;
    }
  }

  /**
   * Sincroniza dados do Kanban Board com o banco
   */
  async syncKanbanBoard(userId: number, boardData: KanbanBoardData) {
    try {
      console.log(`🔄 Sincronizando Kanban Board para usuário ${userId}`);

      // Buscar ou criar board do usuário
      let board = await prisma.board.findFirst({
        where: { owner_id: userId },
        include: { columns: true, tasks: true, members: true, labels: true }
      });

      if (!board) {
        // Criar novo board primeiro
        const newBoard = await prisma.board.create({
          data: {
            name: boardData.board?.name || 'Meu Board',
            description: boardData.board?.description || 'Board pessoal',
            owner_id: userId
          }
        });

        // Criar colunas com tasks
        for (let i = 0; i < (boardData.columns || []).length; i++) {
          const col = boardData.columns![i];
          await prisma.column.create({
            data: {
              name: col.name,
              position: i,
              board_id: newBoard.id,
              tasks: {
                create: boardData.tasks
                  ?.filter((task: KanbanTask) => task.column === col.name)
                  ?.map((task: KanbanTask, taskIndex: number) => ({
                    title: task.title,
                    description: task.description,
                    position: taskIndex,
                    story_points: task.storyPoints,
                    is_completed: task.status === 'done',
                    board_id: newBoard.id
                  })) || []
              }
            }
          });
        }

        // Criar membros
        if (boardData.members && boardData.members.length > 0) {
          await prisma.boardMember.create({
            data: {
              user_id: userId, // Por enquanto, apenas o owner
              role: 'owner',
              board_id: newBoard.id
            }
          });
        }

        // Criar labels
        for (const label of boardData.labels || []) {
          await prisma.label.create({
            data: {
              name: label.name,
              color: label.color,
              board_id: newBoard.id
            }
          });
        }

        // Buscar o board completo com relacionamentos
        board = await prisma.board.findUnique({
          where: { id: newBoard.id },
          include: { columns: true, tasks: true, members: true, labels: true }
        });
      } else {
        // Atualizar board existente
        await this.updateBoardData(board.id, boardData);
      }

      console.log(`✅ Kanban Board sincronizado: Board ID ${board?.id}`);
      return board;
    } catch (error) {
      console.error('❌ Erro ao sincronizar Kanban Board:', error);
      throw error;
    }
  }

  /**
   * Atualiza dados do board existente
   */
  private async updateBoardData(boardId: number, boardData: KanbanBoardData) {
    // Atualizar colunas
    await prisma.column.deleteMany({ where: { board_id: boardId } });
    
    for (let i = 0; i < (boardData.columns || []).length; i++) {
      const col = boardData.columns![i];
      await prisma.column.create({
        data: {
          name: col.name,
          position: i,
          board_id: boardId,
          tasks: {
            create: (boardData.tasks || [])
              .filter(task => task.column === col.name)
              .map((task: KanbanTask, taskIndex: number) => ({
                title: task.title,
                description: task.description || '',
                position: taskIndex,
                story_points: task.storyPoints || 0,
                is_completed: task.status === 'done',
                board_id: boardId
              }))
          }
        }
      });
    }

    // Atualizar labels
    await prisma.label.deleteMany({ where: { board_id: boardId } });
    for (const label of boardData.labels || []) {
      await prisma.label.create({
        data: {
          name: label.name,
          color: label.color,
          board_id: boardId
        }
      });
    }
  }

  /**
   * Sincroniza dados do Scrum com o banco
   */
  async syncScrumData(userId: number, scrumData: ScrumData) {
    try {
      console.log(`🔄 Sincronizando dados Scrum para usuário ${userId}`);

      const board = await prisma.board.findFirst({
        where: { owner_id: userId }
      });

      if (!board) {
        throw new Error('Board não encontrado para sincronizar dados Scrum');
      }

      // Sincronizar sprints
      await prisma.sprint.deleteMany({ where: { board_id: board.id } });
      for (const sprint of scrumData.sprints || []) {
        await prisma.sprint.create({
          data: {
            name: sprint.name,
            description: sprint.description || '',
            start_date: new Date(sprint.startDate),
            end_date: new Date(sprint.endDate),
            working_days: JSON.stringify(sprint.workingDays || []),
            is_active: sprint.isActive || false,
            board_id: board.id
          }
        });
      }

      // Sincronizar user stories
      await prisma.userStory.deleteMany({ where: { board_id: board.id } });
      for (const story of scrumData.userStories || []) {
        await prisma.userStory.create({
          data: {
            title: story.title,
            description: story.description || '',
            story_points: story.storyPoints || 0,
            priority: story.priority || 'Medium',
            status: story.status || 'Backlog',
            acceptance_criteria: JSON.stringify(story.acceptanceCriteria || []),
            tags: JSON.stringify(story.tags || []),
            board_id: board.id
          }
        });
      }

      console.log(`✅ Dados Scrum sincronizados para Board ID ${board.id}`);
    } catch (error) {
      console.error('❌ Erro ao sincronizar dados Scrum:', error);
      throw error;
    }
  }

  /**
   * Sincroniza configurações do usuário
   */
  async syncUserSettings(userId: number, settingsData: SettingsData) {
    try {
      console.log(`🔄 Sincronizando configurações para usuário ${userId}`);

      // Por enquanto, salvar configurações como JSON no campo name do usuário
      // Em uma implementação real, criaria uma tabela UserSettings
      await prisma.user.update({
        where: { id: userId },
        data: {
          name: JSON.stringify({
            teamMembers: settingsData.teamMembers || [],
            sprintConfig: settingsData.sprintConfig || {},
            theme: settingsData.theme || 'light',
            language: settingsData.language || 'pt-BR'
          })
        }
      });

      console.log(`✅ Configurações sincronizadas para usuário ${userId}`);
    } catch (error) {
      console.error('❌ Erro ao sincronizar configurações:', error);
      throw error;
    }
  }

  /**
   * Carrega dados do banco para o localStorage
   */
  async loadUserData(userId: number) {
    try {
      console.log(`📥 Carregando dados do banco para usuário ${userId}`);

      const board = await prisma.board.findFirst({
        where: { owner_id: userId },
        include: {
          columns: {
            include: { tasks: true },
            orderBy: { position: 'asc' }
          },
          tasks: true,
          members: true,
          labels: true,
          sprints: true,
          user_stories: true
        }
      });

      if (!board) {
        console.log(`ℹ️ Nenhum board encontrado para usuário ${userId}`);
        return null;
      }

      // Converter dados do banco para formato do frontend
      const kanbanData = {
        board: {
          id: board.id.toString(),
          name: board.name,
          description: board.description || '',
          createdAt: board.created_at.toISOString(),
          lastModified: board.updated_at.toISOString()
        },
        columns: board.columns.map(col => ({
          id: col.id.toString(),
          name: col.name,
          color: '#8b5cf6', // Cor padrão
          taskLimit: undefined,
          isCollapsed: false
        })),
        tasks: board.tasks.map(task => ({
          id: task.id.toString(),
          title: task.title,
          description: task.description || '',
          column: board.columns.find(col => col.id === task.column_id)?.name || 'TO DO',
          storyPoints: task.story_points || 0,
          status: task.is_completed ? 'done' : 'todo',
          labels: [],
          assignedMembers: [],
          comments: [],
          subtasks: [],
          attachments: [],
          createdAt: task.created_at.toISOString()
        })),
        members: board.members.map(member => ({
          name: `User ${member.user_id}`,
          initials: 'U',
          avatar: ''
        })),
        labels: board.labels.map(label => ({
          id: label.id.toString(),
          name: label.name,
          color: label.color
        }))
      };

      const scrumData = {
        sprints: board.sprints.map(sprint => ({
          id: sprint.id.toString(),
          name: sprint.name,
          description: sprint.description || '',
          startDate: sprint.start_date.toISOString(),
          endDate: sprint.end_date.toISOString(),
          workingDays: JSON.parse(sprint.working_days || '[]'),
          isActive: sprint.is_active
        })),
        userStories: board.user_stories.map(story => ({
          id: story.id.toString(),
          title: story.title,
          description: story.description || '',
          storyPoints: story.story_points,
          priority: story.priority,
          status: story.status,
          acceptanceCriteria: JSON.parse(story.acceptance_criteria || '[]'),
          tags: JSON.parse(story.tags || '[]')
        }))
      };

      console.log(`✅ Dados carregados do banco para usuário ${userId}`);
      return { kanbanData, scrumData };
    } catch (error) {
      console.error('❌ Erro ao carregar dados do banco:', error);
      throw error;
    }
  }
}

export const databaseSyncService = DatabaseSyncService.getInstance();
