import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Card, Task, SprintConfig, KanbanStore } from '@/types';
import { apiService } from '@/services/api';
import { createUserPersistConfig } from '@/utils/user-persistence';

const defaultSprintConfig: SprintConfig = {
  startDate: '',
  endDate: '',
  workingDays: []
};

// Função para criar store Kanban isolado por usuário
export const createUserKanbanStore = (userId: number | null) => {
  return create<KanbanStore>()(
    persist(
      (set, get) => ({
      cards: [],
      tasks: [],
      sprintConfig: defaultSprintConfig,

      // Card actions with backend sync
      addCard: async (cardData) => {
        try {
          // Salvar no backend primeiro
          const backendCard = await apiService.createTask({
            title: cardData.title,
            description: cardData.description || '',
            position: get().cards.length,
            story_points: cardData.storyPoints,
            // board_id e column_id serão determinados pelo backend automaticamente
          });

          // Atualizar store local com dados do backend
          const newCard: Card = {
            ...cardData,
            id: backendCard.id.toString(),
            createdAt: backendCard.created_at,
            updatedAt: backendCard.updated_at,
          };
          
          set((state) => ({ cards: [...state.cards, newCard] }));
          console.log('✅ Card criado no backend e store local');
        } catch (error) {
          console.error('❌ Erro ao criar card no backend:', error);
          // Fallback: criar apenas localmente
          const newCard: Card = {
            ...cardData,
            id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
          };
          set((state) => ({ cards: [...state.cards, newCard] }));
        }
      },

      updateCard: async (id, updates) => {
        try {
          // Atualizar no backend
          await apiService.updateTask(parseInt(id), {
            title: updates.title,
            description: updates.description,
            story_points: updates.storyPoints,
          });

          // Atualizar store local
          set((state) => ({
            cards: state.cards.map((card) =>
              card.id === id
                ? { ...card, ...updates, updatedAt: new Date().toISOString() }
                : card
            ),
          }));
          console.log('✅ Card atualizado no backend e store local');
        } catch (error) {
          console.error('❌ Erro ao atualizar card no backend:', error);
          // Fallback: atualizar apenas localmente
          set((state) => ({
            cards: state.cards.map((card) =>
              card.id === id
                ? { ...card, ...updates, updatedAt: new Date().toISOString() }
                : card
            ),
          }));
        }
      },

      deleteCard: async (id) => {
        try {
          // Deletar no backend
          await apiService.deleteTask(parseInt(id));

          // Atualizar store local
          set((state) => ({
            cards: state.cards.filter((card) => card.id !== id),
            tasks: state.tasks.filter((task) => task.cardId !== id),
          }));
          console.log('✅ Card deletado no backend e store local');
        } catch (error) {
          console.error('❌ Erro ao deletar card no backend:', error);
          // Fallback: deletar apenas localmente
          set((state) => ({
            cards: state.cards.filter((card) => card.id !== id),
            tasks: state.tasks.filter((task) => task.cardId !== id),
          }));
        }
      },

      moveCard: async (id, status) => {
        try {
          // Atualizar posição no backend (implementar quando necessário)
          // await apiService.updateTask(parseInt(id), { column_id: newColumnId });

          // Atualizar store local
          set((state) => ({
            cards: state.cards.map((card) =>
              card.id === id
                ? { ...card, status, updatedAt: new Date().toISOString() }
                : card
            ),
          }));
          console.log('✅ Card movido no store local');
        } catch (error) {
          console.error('❌ Erro ao mover card:', error);
          // Fallback: mover apenas localmente
          set((state) => ({
            cards: state.cards.map((card) =>
              card.id === id
                ? { ...card, status, updatedAt: new Date().toISOString() }
                : card
            ),
          }));
        }
      },

      // Task actions
      addTask: (taskData) => {
        const newTask: Task = {
          ...taskData,
          id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ tasks: [...state.tasks, newTask] }));
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, ...updates, updatedAt: new Date().toISOString() }
              : task
          ),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));
      },

      toggleTaskCompletion: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { 
                  ...task, 
                  completed: !task.completed,
                  completedDate: !task.completed ? new Date().toISOString() : undefined,
                  updatedAt: new Date().toISOString() 
                }
              : task
          ),
        }));
      },

      // Sprint config actions
      updateSprintConfig: (config) => {
        set({ sprintConfig: config });
      },

      // Burndown data
      getBurndownData: () => {
        const { cards, sprintConfig } = get();
        
        // Calcular dados de burndown baseado nos cards
        const totalPoints = cards.reduce((sum, card) => sum + (card.storyPoints || 0), 0);
        const completedPoints = cards
          .filter(card => card.status === 'done')
          .reduce((sum, card) => sum + (card.storyPoints || 0), 0);
        
        return {
          labels: ['Início', 'Meio', 'Fim'],
          totalPontos: totalPoints,
          pontosCompletados: [totalPoints, totalPoints - completedPoints / 2, completedPoints],
          cardsCompletados: [cards.length, Math.floor(cards.length * 0.5), cards.filter(c => c.status === 'done').length],
          totalCards: cards.length,
          totalDias: sprintConfig.startDate && sprintConfig.endDate ? 
            Math.ceil((new Date(sprintConfig.endDate).getTime() - new Date(sprintConfig.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 14,
          diasTrabalhados: 7,
          membrosEquipe: 1,
        };
      },

      // Data sync methods
      loadDataFromBackend: async (boardId: number = 1) => {
        try {
          const tasks = await apiService.getTasks(boardId);

          // Converter dados do backend para formato do store
          const backendCards: Card[] = tasks.map((task: {
            id: number;
            title: string;
            description: string;
            story_points: number;
            column: { name: string };
            created_at: string;
            updated_at: string;
          }) => ({
            id: task.id.toString(),
            title: task.title,
            description: task.description || '',
            color: '#3b82f6', // Cor padrão
            status: task.column?.name?.toLowerCase().includes('done') || 
                   task.column?.name?.toLowerCase().includes('validation') ? 'done' : 
                   task.column?.name?.toLowerCase().includes('progress') ? 'inprogress' : 'todo',
            storyPoints: task.story_points || 0,
            assignee: '',
            createdAt: task.created_at,
            updatedAt: task.updated_at,
          }));

          set({ cards: backendCards });
          console.log('✅ Dados do Kanban carregados do backend');
        } catch (error) {
          console.error('❌ Erro ao carregar dados do backend:', error);
        }
      },

      clearData: () => {
        set({ cards: [], tasks: [], sprintConfig: defaultSprintConfig });
      },
      }),
      createUserPersistConfig('kanban-storage', userId)
    )
  );
};

// Store padrão para compatibilidade (usuário não logado)
export const useKanbanStore = createUserKanbanStore(null);